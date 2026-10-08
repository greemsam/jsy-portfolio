import { randomUUID } from "node:crypto";
import { adminStorage } from "@/__server/lib/firebase-admin";

type UploadArtworkImageParams = {
    year: string;
    driveFileId: string;
    thumbnailBuffer: Buffer;
    displayBuffer: Buffer;
};

export async function getArtworkImageUrl(path?: string) {
    // Storage에 저장된 이미지 파일 객체
    if(!path) return ''
    const file = adminStorage.bucket().file(path);

    // 이미지에 접근할 수 있는 서명된 URL 생성
    const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000,
    });


    return url;
}
export async function uploadArtworkImage({
    year,
    driveFileId,
    thumbnailBuffer,
    displayBuffer,
}: UploadArtworkImageParams) {
    // Firebase 프로젝트의 기본 Storage bucket
    const bucket = adminStorage.bucket();

    // 각 이미지의 Storage 저장 경로
    const thumbnailPath = `artworks/${year}/${driveFileId}-thumbnail.webp`;
    const displayPath = `artworks/${year}/${driveFileId}-display.webp`;
    // 브라우저에서 이미지에 접근하기 위한 다운로드 토큰
    const thumbnailToken = randomUUID();
    const displayToken = randomUUID();

    // Storage에서 썸네일 파일 객체 생성
    const thumbnailFile = bucket.file(thumbnailPath);

    // Storage에서 상세 이미지 파일 객체 생성
    const displayFile = bucket.file(displayPath);

    // 썸네일과 상세 이미지를 동시에 업로드
    await Promise.all([
        thumbnailFile.save(thumbnailBuffer, {
            contentType: "image/webp",
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: thumbnailToken,
                },
            },
        }),

        displayFile.save(displayBuffer, {
            contentType: "image/webp",
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: displayToken,
                },
            },
        }),
    ]);
    const bucketName = bucket.name;
    const makeUrl = (path: string, token: string) => `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return {
        thumbnailPath,
        displayPath,
        thumbnailUrl: makeUrl(thumbnailPath, thumbnailToken),
        displayUrl: makeUrl(displayPath, displayToken),
    };
}