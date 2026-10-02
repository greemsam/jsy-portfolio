import sharp from "sharp";
import { downloadDriveFile } from "@/lib/google-drive";
import { uploadArtworkImage } from "@/lib/firebase-storage";
import type { DriveFile } from "@/types/drive";

type ArtworkRegisterRequest = {
    year: string;
    title: string;
    description: string;
    images: DriveFile[];
};
async function processArtworkImage(
    year: string,
    image: DriveFile
) {
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

export async function POST(request: Request) {
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
        data.images.map((image) =>
            processArtworkImage(data.year, image)
        )
    );

    return Response.json({
        success: true,
        images: artworkImages,
    });
}