import {
    downloadDrivePreview,
    getAllDriveFiles,
} from "@/__server/lib/google-drive";
import sharp from "sharp";
import { unstable_cache } from "next/cache";
import { guardAdmin } from "@/__server/lib/admin-access";

export const runtime = "nodejs";
const getPreviewFiles = unstable_cache(
    getAllDriveFiles,
    ["drive-preview-files"],
    { revalidate: 60 },
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fileId: string }> },
) {
    const denied = await guardAdmin();
    if (denied) return denied;
    const { fileId } = await params;
    if (!/^[\w-]+$/.test(fileId)) {
        return new Response(null, { status: 400 });
    }
    try {
        // Only expose previews of images already available in the portfolio picker.
        const groups = await getPreviewFiles();
        request.signal.throwIfAborted();
        const file = groups
            .flatMap((group) => group.files)
            .find((item) => item.id === fileId);
        if (!file || !file.mimeType.startsWith("image/")) {
            return new Response(null, { status: 404 });
        }
        const source = await downloadDrivePreview(file, request.signal);
        const image = await sharp(source)
            .rotate()
            .resize(240, 240, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer();
        request.signal.throwIfAborted();
        return new Response(new Uint8Array(image), {
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": "private, max-age=300",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch {
        return new Response(null, { status: 502 });
    }
}
