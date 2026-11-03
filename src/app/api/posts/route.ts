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
    for (const field of [
        "width",
        "height",
        "sizeUnit",
        "title",
        "description",
        "medium",
        "published",
    ]) {
        if (data[field] !== undefined) updates[field] = data[field];
    }
    if (!Object.keys(updates).length) {
        return Response.json(
            { success: false, message: "수정할 항목이 없습니다." },
            { status: 400 },
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
