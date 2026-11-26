import { getPosts } from "@/__server/services/post.service";

export async function GET() {
    const artworks = await getPosts();
    return Response.json(artworks, {
        headers: { "Cache-Control": "no-store" },
    });
}
