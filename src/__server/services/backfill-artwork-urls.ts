import { randomUUID } from "node:crypto";
import { adminDb, adminStorage } from "@/__server/lib/firebase-admin";

// 기존 Storage 파일의 다운로드 토큰을 확인하고 URL 생성
async function getOrCreateDownloadUrl(path: string) {
    const bucket = adminStorage.bucket();
    const file = bucket.file(path);

    // 기존 파일 존재 여부 확인
    const [exists] = await file.exists();

    if (!exists) {
        throw new Error(`Storage 파일이 없습니다: ${path}`);
    }

    // 기존 다운로드 토큰 확인
    const [metadata] = await file.getMetadata();

    // Storage 메타데이터에서 기존 다운로드 토큰 확인
    const tokenValue = metadata.metadata?.firebaseStorageDownloadTokens;

    // 문자열인 경우에만 기존 토큰 사용
    const existingToken =
        typeof tokenValue === "string" ? tokenValue : undefined;

    // 기존 토큰이 없으면 새 토큰 생성
    const token = existingToken?.split(",")[0] || randomUUID();

    // 토큰이 없을 때만 메타데이터 추가
    if (!existingToken) {
        await file.setMetadata({
            metadata: {
                ...metadata.metadata,
                firebaseStorageDownloadTokens: token,
            },
        });
    }

    // 브라우저에서 사용할 다운로드 URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// 기존 작품의 이미지 URL을 보완하는 일회성 작업
export async function backfillArtworkUrls() {
    const snapshot = await adminDb.collection("posts").get();

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
        const post = doc.data();

        if (!Array.isArray(post.images) || post.images.length === 0) {
            skipped++;
            continue;
        }

        try {
            // 이미지별로 기존 URL은 유지하고 누락된 URL만 생성
            const images = await Promise.all(
                post.images.map(async (image) => ({
                    ...image,
                    thumbnailUrl:
                        image.thumbnailUrl ||
                        (await getOrCreateDownloadUrl(image.thumbnailPath)),
                    displayUrl:
                        image.displayUrl ||
                        (await getOrCreateDownloadUrl(image.displayPath)),
                }))
            );

            // 변경이 필요한 작품만 Firestore 업데이트
            const needsUpdate = post.images.some(
                (image) => !image.thumbnailUrl || !image.displayUrl
            );

            if (!needsUpdate) {
                skipped++;
                continue;
            }

            await doc.ref.update({ images });
            updated++;
        } catch (error) {
            failed++;
            console.error(`작품 보완 실패: ${doc.id}`, error);
        }
    }

    return { updated, skipped, failed };
}