import { backfillArtworkUrls } from "../src/__server/services/backfill-artwork-urls";

async function main() {
    // 기존 작품 이미지에 누락된 다운로드 URL 추가
    const result = await backfillArtworkUrls();

    console.log("기존 이미지 URL 보완 결과:", result);

    // 일부 작품에서 오류가 발생했다면 실패 상태로 종료
    if (result.failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("이미지 URL 보완 작업 실패:", error);
    process.exitCode = 1;
});