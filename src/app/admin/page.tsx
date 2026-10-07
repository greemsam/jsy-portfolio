import { getAdminArtworkData } from "@/__server/services/artwork.service";
import PostManager from "@/__components/postManager";
import styles from "./page.module.css";

export default async function AdminPage() {
    const data = await getAdminArtworkData();

    return <PostManager initialData={data} />;
}