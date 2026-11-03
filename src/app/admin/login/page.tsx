import AdminLogin from "@/__components/admin/adminLogin";
import { isAdmin } from "@/__server/lib/admin-access";
import { redirect } from "next/navigation";

export const metadata = {
    title: "비공개 관리 시스템",
    robots: { index: false, follow: false },
};

export default async function LoginPage() {
    if (await isAdmin()) redirect("/admin");
    return (
        <AdminLogin
            config={{
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
            }}
        />
    );
}
