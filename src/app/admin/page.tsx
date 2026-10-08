import { getAdminInitialData } from "@/__server/services/post.service";
import PostManager from "@/__components/postManager";

export default async function AdminPage() {
    const data = await getAdminInitialData();

    return <PostManager initialData={data} />;
}