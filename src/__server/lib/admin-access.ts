import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

export const SESSION_COOKIE =
    process.env.NODE_ENV === "production"
        ? "__Host-admin-session"
        : "admin-session";
export const SESSION_SECONDS = 60 * 60 * 8;

export function allowedAdmin(uid: string) {
    return (process.env.ADMIN_UIDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .includes(uid);
}

export function sameOrigin(request: Request) {
    const expected =
        process.env.ADMIN_APP_ORIGIN ||
        (process.env.NODE_ENV !== "production"
            ? new URL(request.url).origin
            : "");
    return (
        !!expected &&
        request.headers.get("origin") === expected &&
        request.headers.get("sec-fetch-site") !== "cross-site"
    );
}

export async function isAdmin() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return false;
    try {
        const decoded = await adminAuth.verifySessionCookie(token, true);
        return (
            allowedAdmin(decoded.uid) &&
            decoded.firebase.sign_in_provider === "google.com"
        );
    } catch {
        return false;
    }
}

export async function guardAdmin(request?: Request) {
    if (request && !sameOrigin(request))
        return Response.json(
            { success: false, message: "허용되지 않은 요청입니다." },
            { status: 403 },
        );
    if (!(await isAdmin()))
        return Response.json(
            { success: false, message: "관리자 로그인이 필요합니다." },
            { status: 401 },
        );
    return null;
}
