
import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { getAllDriveFiles, downloadDriveFile } from "@/__server/lib/google-drive";
import { adminDb } from "@/__server/lib/firebase-admin";
import { uploadArtworkImage } from "@/__server/lib/firebase-storage";
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
    const artwork = {
        year: data.year,
        title: data.title,
        description: data.description,

        // 아직 등록 UI에서 입력받지 않는 값은 기본값으로 저장
        medium: "",
        size: null,
        tags: [],

        // Storage 업로드까지 완료된 이미지 정보
        images: artworkImages,

        // 등록 직후에는 비공개 상태
        published: false,

        // Firestore 서버 시간을 기준으로 생성/수정 시간 기록
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const artworkRef = await adminDb.collection("artworks").add(artwork);
    return Response.json({
        success: true,
        artId: artworkRef.id,
    });
}

export async function getArtworks() {
    // Firestore에서 등록된 전체 작품 조회
    const snapshot = await adminDb
        .collection("artworks")
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
            artId: doc.id,
            year: data.year ?? "",
            title: data.title ?? "",
            description: data.description ?? "",
            medium: data.medium ?? "",
            size: data.size ?? null,
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
export async function getAdminArtworkData() {
    // 관리자 페이지에 필요한 Drive 파일과 등록 작품을 동시에 조회
    const [driveFiles, artworks] = await Promise.all([
        getAllDriveFiles(),
        getArtworks(),
    ]);

    return {
        driveFiles,
        artworks,
    };
}

