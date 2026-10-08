import { adminDb } from "../src/__server/lib/firebase-admin";

async function main() {
    const snapshot = await adminDb.collection("artworks").get();

    let copied = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
        const target = adminDb.collection("posts").doc(doc.id);

        // 기존 문서가 있으면 덮어쓰지 않음
        const existing = await target.get();

        if (existing.exists) {
            skipped++;
            continue;
        }

        // 문서 ID와 모든 필드를 그대로 복사
        await target.create(doc.data());
        copied++;
    }

    console.log({ copied, skipped });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});