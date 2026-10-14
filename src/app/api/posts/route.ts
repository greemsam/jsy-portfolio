import {getPosts, postArtworks, deletePost} from "@/__server/services/post.service";
import { adminDb } from "@/__server/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
    // 실제 데이터 조회는 backend service에 위임
    const artworks = await getPosts();
    return Response.json(artworks);
}

export async function POST(request: Request) {
    return postArtworks(request);
}

export async function PATCH(request: Request) {
    const { postId, width, height, sizeUnit, title, description, medium } =  await request.json();

    await adminDb.collection("posts").doc(postId).update({
        title,
        description,
        medium,
        width,
        height,
        sizeUnit,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ success: true });
}

export async function DELETE(request: Request) {
    return deletePost(request)
}