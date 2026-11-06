import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import {
    getAllDriveFiles,
    downloadDriveFile,
} from "@/__server/lib/google-drive";
import { uploadArtworkImage } from "@/__server/lib/firebase-storage";
import { adminDb, adminStorage } from "@/__server/lib/firebase-admin";
import type { DriveFile } from "@/__types/drive";
import { MAX_POST_IMAGES } from "@/__types/artwork";

type ArtworkRegisterRequest = {
    year: string;
    title: string;
    description: string;
    additionalDescription?: string;
    images: (DriveFile & {
        description?: string;
        caption?: string;
        medium?: string;
        width?: number;
        height?: number;
        sizeUnit?: string;
    })[];
    published?: boolean;
    medium?: string;
    width?: number;
    height?: number;
    sizeUnit?: string;
};
export type ArtworkImage = {
    description: string;
    caption: string;
    medium: string;
    width: number;
    height: number;
    sizeUnit: string;
    driveFileId: string;
    thumbnailPath: string;
    displayPath: string;
    thumbnailUrl: string;
    displayUrl: string;
};

async function processArtworkImage(
    year: string,
    image: DriveFile & {
        description?: string;
        caption?: string;
        medium?: string;
        width?: number;
        height?: number;
        sizeUnit?: string;
    },
): Promise<ArtworkImage> {
    // Google Drive에서 원본 이미지 다운로드
    const originalBuffer = await downloadDriveFile(image.id);

    // 원본으로부터 썸네일과 상세 이미지를 동시에 생성
    const [thumbnailBuffer, displayBuffer] = await Promise.all([
        sharp(originalBuffer)
            .resize({
                width: 500,
                withoutEnlargement: true,
            })
            .webp({
                quality: 80,
            })
            .toBuffer(),

        sharp(originalBuffer)
            .resize({
                width: 2400,
                withoutEnlargement: true,
            })
            .webp({
                quality: 85,
            })
            .toBuffer(),
    ]);

    // 변환된 이미지를 Firebase Storage에 업로드
    const uploadedImage = await uploadArtworkImage({
        year,
        driveFileId: image.id,
        thumbnailBuffer,
        displayBuffer,
    });

    // Firestore Artwork.images에 저장할 형태
    return {
        description: image.description ?? "",
        caption: image.caption ?? "",
        medium: image.medium ?? "",
        width: image.width ?? 0,
        height: image.height ?? 0,
        sizeUnit: image.sizeUnit ?? "mm",
        driveFileId: image.id,
        thumbnailPath: uploadedImage.thumbnailPath,
        displayPath: uploadedImage.displayPath,
        thumbnailUrl: uploadedImage.thumbnailUrl,
        displayUrl: uploadedImage.displayUrl,
    };
}
export async function postArtworks(request: Request) {
    // 클라이언트에서 전달받은 작품 등록 데이터
    const data: ArtworkRegisterRequest = await request.json();

    if (
        (data.additionalDescription !== undefined &&
            typeof data.additionalDescription !== "string") ||
        !Array.isArray(data.images) ||
        data.images.some(
            (image) =>
                !image ||
                typeof image.id !== "string" ||
                (image.description !== undefined &&
                    typeof image.description !== "string") ||
                (image.caption !== undefined &&
                    typeof image.caption !== "string") ||
                (image.medium !== undefined &&
                    typeof image.medium !== "string") ||
                (image.sizeUnit !== undefined &&
                    typeof image.sizeUnit !== "string") ||
                (image.width !== undefined &&
                    (!Number.isFinite(image.width) || image.width < 0)) ||
                (image.height !== undefined &&
                    (!Number.isFinite(image.height) || image.height < 0)),
        )
    ) {
        return Response.json(
            { success: false, message: "이미지 설명과 캡션을 확인해 주세요." },
            { status: 400 },
        );
    }

    if (data.images.length > MAX_POST_IMAGES) {
        return Response.json(
            {
                success: false,
                message: `이미지는 최대 ${MAX_POST_IMAGES}개까지 등록할 수 있습니다.`,
            },
            { status: 400 },
        );
    }
    if (!data.images?.length) {
        return Response.json(
            {
                success: false,
                message: "선택된 이미지가 없습니다.",
            },
            {
                status: 400,
            },
        );
    }
    // 선택된 모든 이미지를 병렬 처리
    const artworkImages = await Promise.all(
        data.images.map((image) => processArtworkImage(data.year, image)),
    );
    // Firestore에 저장할 작품 데이터
    const post = {
        year: data.year,
        title: data.title,
        description: data.description,
        additionalDescription: data.additionalDescription ?? "",

        medium: data.medium ?? "",
        width: data.width ?? 0,
        height: data.height ?? 0,
        sizeUnit: data.sizeUnit ?? "mm",
        tags: [],

        // Storage 업로드까지 완료된 이미지 정보
        images: artworkImages,

        published: data.published === true,

        // Firestore 서버 시간을 기준으로 생성/수정 시간 기록
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const postRef = await adminDb.collection("posts").add(post);
    return Response.json({
        success: true,
        postId: postRef.id,
    });
}

export async function deletePost(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json(
            { success: false, message: "잘못된 JSON 요청입니다." },
            { status: 400 },
        );
    }
    // 기존 단일 삭제 요청도 지원합니다.
    const ids: unknown = body?.postIds ?? (body?.postId ? [body.postId] : []);
    if (
        !Array.isArray(ids) ||
        !ids.length ||
        ids.length > 100 ||
        ids.some(
            (id) =>
                typeof id !== "string" ||
                !id.trim() ||
                id.includes("/") ||
                id === "." ||
                id === ".." ||
                /^__.*__$/.test(id) ||
                Buffer.byteLength(id, "utf8") > 1500,
        )
    ) {
        return Response.json(
            {
                success: false,
                message: "삭제할 게시물 ID를 1~100개 전달해 주세요.",
            },
            { status: 400 },
        );
    }
    const postIds = [...new Set(ids as string[])];
    const selectedIds = new Set(postIds);
    try {
        const postsRef = adminDb.collection("posts");
        // 선택한 게시물과 공유 이미지 참조를 한 번의 조회로 확인합니다.
        const snapshot = await postsRef.select("images").get();
        const selectedPosts = snapshot.docs.filter((doc) =>
            selectedIds.has(doc.id),
        );
        const usedPaths = new Set<string>();
        for (const doc of snapshot.docs) {
            if (selectedIds.has(doc.id)) continue;
            for (const image of doc.data().images ?? []) {
                if (image.thumbnailPath) usedPaths.add(image.thumbnailPath);
                if (image.displayPath) usedPaths.add(image.displayPath);
            }
        }
        const bucket = adminStorage.bucket();

        // 다른 게시물이 사용하지 않는 파일만 삭제
        const pathsToDelete = new Set<string>();

        for (const doc of selectedPosts) {
            for (const image of doc.data().images ?? []) {
                if (
                    image.thumbnailPath &&
                    !usedPaths.has(image.thumbnailPath)
                ) {
                    pathsToDelete.add(image.thumbnailPath);
                }

                if (image.displayPath && !usedPaths.has(image.displayPath)) {
                    pathsToDelete.add(image.displayPath);
                }
            }
        }
        // 이미지 데이터는 받지 않고 삭제 요청을 최대 5개씩 실행합니다.
        const paths = [...pathsToDelete];
        for (let i = 0; i < paths.length; i += 5) {
            const results = await Promise.allSettled(
                paths
                    .slice(i, i + 5)
                    .map((path) =>
                        bucket.file(path).delete({ ignoreNotFound: true }),
                    ),
            );
            if (results.some((result) => result.status === "rejected")) {
                throw new Error("Storage deletion failed");
            }
        }

        // Firestore 게시물 삭제
        if (selectedPosts.length) {
            const batch = adminDb.batch();
            selectedPosts.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }
        // 이미 없는 ID도 성공 처리하여 동일 요청을 재시도할 수 있게 합니다.
        return Response.json({ success: true, deletedPostIds: postIds });
    } catch (error) {
        console.error("게시물 삭제 실패:", error);
        return Response.json(
            {
                success: false,
                message:
                    "삭제를 완료하지 못했습니다. 일부 이미지는 삭제되었을 수 있으니 다시 시도해 주세요.",
            },
            { status: 500 },
        );
    }
}
export async function getPosts(publishedOnly = false) {
    // Firestore에서 등록된 전체 작품 조회
    const postsRef = adminDb.collection("posts");
    const query = publishedOnly
        ? postsRef.where("published", "==", true)
        : postsRef;
    const snapshot = await query.orderBy("createdAt", "desc").get();

    return snapshot.docs
        .filter((doc) => !publishedOnly || doc.data().published === true)
        .map((doc) => {
            const data = doc.data();

            return {
                postId: doc.id,
                year: data.year ?? "",
                title: data.title ?? "",
                description: data.description ?? "",
                additionalDescription: data.additionalDescription ?? "",
                medium: data.medium ?? "",
                width: data.width ?? "",
                height: data.height ?? "",
                sizeUnit: data.sizeUnit ?? "",
                tags: data.tags ?? [],
                images: data.images ?? [],
                published: data.published ?? false,
                createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
                updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
            };
        });
}
export async function getPublishedPosts(year: string) {
    if (!/^(?:\d{4}|before 2012)$/.test(year)) {
        throw new Error("Invalid artwork year");
    }
    const query = adminDb.collection("posts").where("published", "==", true);
    const snapshots =
        year === "before 2012"
            ? await Promise.all([
                  query.where("year", "==", "before 2012").get(),
                  query
                      .where("year", ">=", "0000")
                      .where("year", "<", "2012")
                      .get(),
              ])
            : [await query.where("year", "==", year).get()];

    // Sort in memory to avoid requiring a composite Firestore index.
    return snapshots
        .flatMap((snapshot) => snapshot.docs)
        .map((doc) => {
            const data = doc.data();
            return {
                postId: doc.id,
                year: data.year ?? "",
                title: data.title ?? "",
                description: data.description ?? "",
                additionalDescription: data.additionalDescription ?? "",
                medium: data.medium ?? "",
                width: data.width ?? 0,
                height: data.height ?? 0,
                sizeUnit: data.sizeUnit ?? "",
                tags: data.tags ?? [],
                images: data.images ?? [],
                published: true,
                createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
                updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
            };
        })
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
export async function getPublishedYears(): Promise<string[]> {
    // Only transfer year metadata, never image URLs or artwork content.
    const snapshot = await adminDb
        .collection("posts")
        .where("published", "==", true)
        .select("year")
        .get();
    const years = snapshot.docs
        .map((doc) => String(doc.data().year ?? "").trim())
        .filter((year) => /^(?:\d{4}|before 2012)$/.test(year))
        .map((year) =>
            /^\d{4}$/.test(year) && Number(year) < 2012 ? "before 2012" : year,
        );
    return [...new Set(years)].sort((a, b) => {
        if (a === "before 2012") return 1;
        if (b === "before 2012") return -1;
        return b.localeCompare(a);
    });
}
export async function getAdminInitialData() {
    // 관리자 페이지에 필요한 Drive 파일과 등록 작품을 동시에 조회
    const [driveFiles, posts] = await Promise.all([
        getAllDriveFiles(),
        getPosts(),
    ]);
    return {
        driveFiles,
        posts,
    };
}
