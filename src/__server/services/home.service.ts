import { adminDb } from "@/__server/lib/firebase-admin";
import type { Post } from "@/__types/artwork";

export async function getHomeData(): Promise<{ artwork: Post | null }> {
    const posts = adminDb.collection("posts");
    const doc = await (async () => {
        try {
            const snapshot = await posts
                .where("published", "==", true)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();
            return snapshot.docs[0];
        } catch (error) {
            const failure = error as {
                code?: number | string;
                message?: string;
            };
            const missingIndex =
                (failure.code === 9 ||
                    failure.code === "failed-precondition") &&
                /requires an index/i.test(failure.message ?? "");
            if (!missingIndex) throw error;

            // While the composite index is unavailable, scan newest first in
            // bounded batches using the default single-field createdAt index.
            console.warn(
                "Home artwork composite index is unavailable; using batched lookup.",
            );
            const ordered = posts.orderBy("createdAt", "desc");
            let page = await ordered.limit(20).get();
            while (page.docs.length) {
                const published = page.docs.find(
                    (doc) => doc.data().published === true,
                );
                if (published) return published;
                if (page.docs.length < 20) return undefined;
                page = await ordered
                    .startAfter(page.docs[page.docs.length - 1])
                    .limit(20)
                    .get();
            }
            return undefined;
        }
    })();
    if (!doc) return { artwork: null };

    const data = doc.data();
    return {
        artwork: {
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
        },
    };
}
