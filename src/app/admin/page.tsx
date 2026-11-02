import { getAdminInitialData } from "@/__server/services/post.service";
import PostManager from "@/__components/postManager";
import AdminHeader from "@/__components/adminHeader"
export default async function AdminPage() {
    const data = await getAdminInitialData();

    return (
        <>
            <AdminHeader/>
            <PostManager initialData={data}/>
        </>
    )
}