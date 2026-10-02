import sharp from "sharp";
import { downloadDriveFile } from "@/lib/google-drive";
export async function POST(request: Request) {
    // 클라이언트(PostRegister)에서 전달한 작품 등록 데이터
    const data = await request.json();
    // 선택한 이미지 중 첫 번째 이미지
    const firstImage = data.images[0];

    if (!firstImage?.id) {
        return Response.json(
            {
                success: false,
                message: "선택된 이미지가 없습니다.",
            },
            {
                status: 400,
            }
        );
    }
    // Google Drive에서 다운로드한 원본 이미지 데이터
    const originalBuffer = await downloadDriveFile(firstImage.id);
    // 작품 목록 등에 사용할 작은 썸네일 이미지
    const thumbnailBuffer = await sharp(originalBuffer)
        .resize({
            width: 500,
            withoutEnlargement: true,
        })
        .webp({
            quality: 80,
        })
        .toBuffer();
    // 작품 상세 화면에서 사용할 웹용 이미지
    const displayBuffer = await sharp(originalBuffer)
        .resize({
            width: 2400,
            withoutEnlargement: true,
        })
        .webp({
            quality: 85,
        })
        .toBuffer();

    console.log("원본:", originalBuffer.length);
    console.log("thumbnail:", thumbnailBuffer.length);
    console.log("display:", displayBuffer.length);

    return Response.json({
        success: true,
        originalSize: originalBuffer.length,
        thumbnailSize: thumbnailBuffer.length,
        displaySize: displayBuffer.length,
    });
}