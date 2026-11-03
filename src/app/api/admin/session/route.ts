import { cookies } from "next/headers";
import { adminAuth } from "@/__server/lib/firebase-admin";
import {
    allowedAdmin,
    sameOrigin,
    SESSION_COOKIE,
    SESSION_SECONDS,
} from "@/__server/lib/admin-access";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
};

export async function POST(request: Request) {
    if (!sameOrigin(request))
        return Response.json({ success: false }, { status: 403 });
    try {
        const { idToken } = await request.json();
        if (typeof idToken !== "string")
            return Response.json({ success: false }, { status: 400 });
        const decoded = await adminAuth.verifyIdToken(idToken, true);
        const age = Date.now() / 1000 - decoded.auth_time;
        if (
            !allowedAdmin(decoded.uid) ||
            decoded.firebase.sign_in_provider !== "google.com" ||
            age < 0 ||
            age > 300
        ) {
            return Response.json(
                { success: false, message: "허용된 관리자 계정이 아닙니다." },
                { status: 403 },
            );
        }
        const session = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_SECONDS * 1000,
        });
        (await cookies()).set(SESSION_COOKIE, session, {
            ...cookieOptions,
            maxAge: SESSION_SECONDS,
        });
        return Response.json(
            { success: true },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch {
        return Response.json(
            { success: false, message: "로그인 인증에 실패했습니다." },
            { status: 401 },
        );
    }
}

export async function DELETE(request: Request) {
    if (!sameOrigin(request))
        return Response.json({ success: false }, { status: 403 });
    (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return Response.json({ success: true });
}
