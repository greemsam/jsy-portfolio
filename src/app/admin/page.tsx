import { useAdminStore } from "@/__frontend/admin/stores";
import PostManager from '@/__frontend/admin/components/postManager'
import styles from "./page.module.css";
export default async function AdminPage() {

    return (
        <div className={styles.adminMain}>
            <h1>JSY PORTFOLIO</h1>
            <PostManager/>
        </div>
    );
}