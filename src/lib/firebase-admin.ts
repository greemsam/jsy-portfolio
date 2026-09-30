import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Artwork } from "@/types/artwork";

const firebaseAdminApp = getApps().length === 0
    ? initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0];

const adminDb = getFirestore(firebaseAdminApp);

export async function getPublishedArtworks(): Promise<Artwork[]> {
    const snapshot = await adminDb
        .collection("artworks")
        .where("published", "==", true)
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

            createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
            updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
        };
    });
}