import { adminDb } from "@/__server/lib/firebase-admin";

export async function getPosts() {
    // 공개 서비스에서는 인증 쿠키와 무관하게 공개 작품만 조회합니다.
    const postsRef = adminDb.collection("posts");
    const query = postsRef.where("published", "==", true);
    const snapshot = await query.orderBy("createdAt", "desc").get();

    return snapshot.docs
        .filter((doc) => doc.data().published === true)
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
                images: (data.images ?? []).map(
                    (image: import("@/__types/artwork").ArtworkImage) => {
                        const result = { ...image };
                        delete result.displayUrl;
                        return result;
                    },
                ),
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
                images: (data.images ?? []).map(
                    (image: import("@/__types/artwork").ArtworkImage) => {
                        const result = { ...image };
                        delete result.displayUrl;
                        return result;
                    },
                ),
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
