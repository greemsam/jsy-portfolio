import { getHomeData } from "@/__server/services/home.service";

export async function GET() {
    try {
        return Response.json(await getHomeData(), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Failed to load home data:", error);
        return Response.json(
            { message: "메인 화면 정보를 불러오지 못했습니다." },
            { status: 500 },
        );
    }
}
