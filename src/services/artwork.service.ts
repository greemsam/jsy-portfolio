import { adminDb } from "@/lib/firebase-admin";
import { drive } from "@/lib/google-drive";
import type { Artwork } from "@/types/artwork";

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


export async function getDriveFiles() {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        throw new Error("GOOGLE_DRIVE_FOLDER_ID is not defined");
    }

    const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, modifiedTime, thumbnailLink)",
        orderBy: "name",
    });

    return response.data.files ?? [];
}