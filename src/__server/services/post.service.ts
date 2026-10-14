
import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { getAllDriveFiles, downloadDriveFile } from "@/__server/lib/google-drive";
import { uploadArtworkImage } from "@/__server/lib/firebase-storage";
import { adminDb, adminStorage } from "@/__server/lib/firebase-admin";
import type { DriveFile } from "@/__types/drive";

type ArtworkRegisterRequest = {
    year: string;
    title: string;
    description: string;
    images: DriveFile[];
};
export type ArtworkImage = {
    driveFileId: string;
    thumbnailPath: string;
    displayPath: string;
    thumbnailUrl:string;
    displayUrl:string
};

async function processArtworkImage(year: string, image: DriveFile):Promise<ArtworkImage> {
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
        driveFileId: image.id,
        thumbnailPath: uploadedImage.thumbnailPath,
        displayPath: uploadedImage.displayPath,
        thumbnailUrl: uploadedImage.thumbnailUrl,
        displayUrl: uploadedImage.displayUrl,
    };
}
export async function postArtworks(request: Request) {
    // 클라이언트에서 전달받은 작품 등록 데이터
    const data:ArtworkRegisterRequest = await request.json();

    if (!data.images?.length) {
        return Response.json(
            {
                success: false,
                message: "선택된 이미지가 없습니다.",
            },
            {
                status: 400,
            }
        );
    }
        // 선택된 모든 이미지를 병렬 처리
    const artworkImages = await Promise.all(
        data.images.map((image) => processArtworkImage(data.year, image))
    );
    // Firestore에 저장할 작품 데이터
    const post = {
        year: data.year,
        title: data.title,
        description: data.description,

        // 아직 등록 UI에서 입력받지 않는 값은 기본값으로 저장
        medium: "",
        width:"",
        height:"",
        sizeUnit:"",
        tags: [],

        // Storage 업로드까지 완료된 이미지 정보
        images: artworkImages,

        // 등록 직후에는 비공개 상태
        published: false,

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

export async function deletePost(request:Request){
    const { postId } = await request.json();
    if (!postId) {
        return Response.json({ success: false }, { status: 400 });
    }
    const postsRef = adminDb.collection("posts");
    const postRef = postsRef.doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        return Response.json(
            { success: false, message: "게시물이 없습니다." },
            { status: 404 }
        );
    }
    const images = postDoc.data()?.images ?? [];

     // 다른 게시물에서 사용 중인 이미지 경로 확인
    const otherPosts = await postsRef.get();
    const usedPaths = new Set<string>();
    for (const doc of otherPosts.docs) {
        if (doc.id === postId) continue;
        for (const image of doc.data().images ?? []) {
            if (image.thumbnailPath) usedPaths.add(image.thumbnailPath);
            if (image.displayPath) usedPaths.add(image.displayPath);
        }
    }
    const bucket = adminStorage.bucket();

    // 다른 게시물이 사용하지 않는 파일만 삭제
    const pathsToDelete = new Set<string>();

    for (const image of images) {
        if (image.thumbnailPath && !usedPaths.has(image.thumbnailPath)) {
            pathsToDelete.add(image.thumbnailPath);
        }

        if (image.displayPath && !usedPaths.has(image.displayPath)) {
            pathsToDelete.add(image.displayPath);
        }
    }
    await Promise.all(
        [...pathsToDelete].map((path) =>
            bucket.file(path).delete({ ignoreNotFound: true })
        )
    );

    // Firestore 게시물 삭제
    await postRef.delete();
    return Response.json({ success: true });
}
export async function getPosts() {
    // Firestore에서 등록된 전체 작품 조회
    const snapshot = await adminDb
        .collection("posts")
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
            postId: doc.id,
            year: data.year ?? "",
            title: data.title ?? "",
            description: data.description ?? "",
            medium: data.medium ?? "",
            width:data.width ?? "",
            height:data.height ?? "",
            sizeUnit:data.sizeUnit ?? "",
            tags: data.tags ?? [],
            images: data.images ?? [],
            published: data.published ?? false,
            createdAt:
                data.createdAt?.toDate?.().toISOString() ?? null,
            updatedAt:
                data.updatedAt?.toDate?.().toISOString() ?? null,
        };
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
        posts
    };
}
