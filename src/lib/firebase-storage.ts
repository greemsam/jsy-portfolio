import { adminStorage } from "@/lib/firebase-admin";

type UploadArtworkImageParams = {
    year: string;
    driveFileId: string;
    thumbnailBuffer: Buffer;
    displayBuffer: Buffer;
};

export async function uploadArtworkImage({
    year,
    driveFileId,
    thumbnailBuffer,
    displayBuffer,
}: UploadArtworkImageParams) {
    // Firebase 프로젝트의 기본 Storage bucket
    const bucket = adminStorage.bucket();

    // 썸네일 이미지가 저장될 Storage 내부 경로
    const thumbnailPath =
        `artworks/${year}/${driveFileId}-thumbnail.webp`;

    // 상세 화면용 이미지가 저장될 Storage 내부 경로
    const displayPath =
        `artworks/${year}/${driveFileId}-display.webp`;

    // Storage에서 썸네일 파일 객체 생성
    const thumbnailFile = bucket.file(thumbnailPath);

    // Storage에서 상세 이미지 파일 객체 생성
    const displayFile = bucket.file(displayPath);

    // 썸네일과 상세 이미지를 동시에 업로드
    await Promise.all([
        thumbnailFile.save(thumbnailBuffer, {
            contentType: "image/webp",
        }),

        displayFile.save(displayBuffer, {
            contentType: "image/webp",
        }),
    ]);

    return {
        thumbnailPath,
        displayPath,
    };
}