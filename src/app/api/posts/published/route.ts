import { getPublishedPosts } from "@/__server/services/post.service";

export async function GET(request: Request) {
    const year = new URL(request.url).searchParams.get("year");
    if (!year || !/^(?:\d{4}|before 2012)$/.test(year)) {
        return Response.json(
            { message: "올바른 연도를 지정해 주세요." },
            { status: 400 },
        );
    }
    try {
        return Response.json(await getPublishedPosts(year), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Failed to load published artworks:", error);
        return Response.json(
            { message: "작품 목록을 불러오지 못했습니다." },
            { status: 500 },
        );
    }
}
