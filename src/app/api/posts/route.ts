import {
    getPosts,
    postArtworks,
    deletePost,
} from "@/__server/services/post.service";
import { adminDb } from "@/__server/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { guardAdmin, isAdmin } from "@/__server/lib/admin-access";

export async function GET() {
    // 실제 데이터 조회는 backend service에 위임
    const artworks = await getPosts(!(await isAdmin()));
    return Response.json(artworks, {
        headers: { "Cache-Control": "private, no-store" },
    });
}

export async function POST(request: Request) {
    const denied = await guardAdmin(request);
    if (denied) return denied;
    return postArtworks(request);
}

export async function PATCH(request: Request) {
    const denied = await guardAdmin(request);
    if (denied) return denied;
    const data = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return Response.json(
            { success: false, message: "잘못된 요청입니다." },
            { status: 400 },
        );
    }
    if ("published" in data && typeof data.published !== "boolean") {
        return Response.json(
            { success: false, message: "공개 여부를 확인해 주세요." },
            { status: 400 },
        );
    }
    const validId = (id: unknown): id is string =>
        typeof id === "string" && id.trim().length > 0 && !id.includes("/");
    if ("postIds" in data) {
        if (
            !Array.isArray(data.postIds) ||
            !data.postIds.length ||
            data.postIds.length > 100 ||
            !data.postIds.every(validId) ||
            typeof data.published !== "boolean"
        ) {
            return Response.json(
                {
                    success: false,
                    message:
                        "한 번에 1~100개 작품의 공개 여부를 변경할 수 있습니다.",
                },
                { status: 400 },
            );
        }
        const postIds = [...new Set<string>(data.postIds)];
        const batch = adminDb.batch();
        for (const id of postIds) {
            batch.update(adminDb.collection("posts").doc(id), {
                published: data.published,
            });
        }
        await batch.commit();
        return Response.json({
            success: true,
            postIds,
            published: data.published,
        });
    }
    if (!validId(data.postId)) {
        return Response.json(
            { success: false, message: "작품을 확인해 주세요." },
            { status: 400 },
        );
    }
    const updates: Record<string, unknown> = {};
    if (
        "additionalDescription" in data &&
        typeof data.additionalDescription !== "string"
    ) {
        return Response.json(
            { success: false, message: "추가 설명을 확인해 주세요." },
            { status: 400 },
        );
    }
    if (
        "images" in data &&
        (!Array.isArray(data.images) ||
            data.images.some((image: unknown) => {
                if (!image || typeof image !== "object") return true;
                const item = image as Record<string, unknown>;
                return (
                    typeof item.driveFileId !== "string" ||
                    typeof item.description !== "string" ||
                    (item.caption !== undefined &&
                        typeof item.caption !== "string") ||
                    ["medium", "sizeUnit"].some(
                        (key) =>
                            item[key] !== undefined &&
                            typeof item[key] !== "string",
                    ) ||
                    ["width", "height"].some(
                        (key) =>
                            item[key] !== undefined &&
                            (typeof item[key] !== "number" ||
                                !Number.isFinite(item[key]) ||
                                (item[key] as number) < 0),
                    )
                );
            }) ||
            new Set(
                data.images.map(
                    (image: { driveFileId: string }) => image.driveFileId,
                ),
            ).size !== data.images.length)
    ) {
        return Response.json(
            { success: false, message: "이미지 설명과 캡션을 확인해 주세요." },
            { status: 400 },
        );
    }
    for (const field of [
        "width",
        "height",
        "sizeUnit",
        "title",
        "description",
        "additionalDescription",
        "medium",
        "published",
    ]) {
        if (data[field] !== undefined) updates[field] = data[field];
    }
    if (!Object.keys(updates).length && !("images" in data)) {
        return Response.json(
            { success: false, message: "수정할 항목이 없습니다." },
            { status: 400 },
        );
    }
    if ("images" in data) {
        const ref = adminDb.collection("posts").doc(data.postId);
        const saved = await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists) return false;
            const images = doc.data()?.images ?? [];
            const metadata = new Map<
                string,
                {
                    description: string;
                    caption?: string;
                    medium?: string;
                    width?: number;
                    height?: number;
                    sizeUnit?: string;
                }
            >(
                data.images.map(
                    (image: {
                        driveFileId: string;
                        description: string;
                        caption?: string;
                        medium?: string;
                        width?: number;
                        height?: number;
                        sizeUnit?: string;
                    }) => [image.driveFileId, image],
                ),
            );
            if (
                images.length !== metadata.size ||
                images.some(
                    (image: { driveFileId: string }) =>
                        !metadata.has(image.driveFileId),
                )
            )
                return false;
            transaction.update(ref, {
                ...updates,
                images: images.map((image: { driveFileId: string }) => ({
                    ...image,
                    description: metadata.get(image.driveFileId)!.description,
                    ...Object.fromEntries(
                        Object.entries(metadata.get(image.driveFileId)!).filter(
                            ([key]) =>
                                [
                                    "caption",
                                    "medium",
                                    "width",
                                    "height",
                                    "sizeUnit",
                                ].includes(key),
                        ),
                    ),
                })),
                updatedAt: FieldValue.serverTimestamp(),
            });
            return true;
        });
        return Response.json(
            {
                success: saved,
                ...(saved
                    ? {}
                    : {
                          message:
                              "이미지 정보가 변경되었습니다. 새로고침 후 다시 시도해 주세요.",
                      }),
            },
            { status: saved ? 200 : 409 },
        );
    }
    if (Object.keys(updates).some((field) => field !== "published"))
        updates.updatedAt = FieldValue.serverTimestamp();
    await adminDb.collection("posts").doc(data.postId).update(updates);

    return Response.json({ success: true });
}

export async function DELETE(request: Request) {
    const denied = await guardAdmin(request);
    if (denied) return denied;
    return deletePost(request);
}
