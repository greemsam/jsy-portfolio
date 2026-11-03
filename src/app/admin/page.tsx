import { getAdminInitialData } from "@/__server/services/post.service";
import PostManager from "@/__components/admin/postManager";
import AdminHeader from "@/__components/admin/adminHeader";
import { isAdmin } from "@/__server/lib/admin-access";
import { redirect } from "next/navigation";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminPage() {
    if (!(await isAdmin())) redirect("/admin/login");
    const data = await getAdminInitialData();

    return (
        <>
            <AdminHeader />
            <PostManager initialData={data} />
        </>
    );
}
