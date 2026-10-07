import {getArtworks} from "@/__server/services/artwork.service";

export async function GET() {
    // 실제 데이터 조회는 backend service에 위임
    const artworks = await getArtworks();

    return Response.json(artworks);
}