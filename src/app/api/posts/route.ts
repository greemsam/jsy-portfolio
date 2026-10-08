import {getPosts, postArtworks} from "@/__server/services/post.service";

export async function GET() {
    // 실제 데이터 조회는 backend service에 위임
    const artworks = await getPosts();

    return Response.json(artworks);
}

export async function POST(request: Request) {
    return postArtworks(request);
}