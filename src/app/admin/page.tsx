import { getAllDriveFiles } from "@/lib/google-drive";
import type { ArtInfoFromGoogleDrive,  DriveFile} from "@/types/artwork"
import PostManager from './postManager'
import styles from "./page.module.css";
export default async function AdminPage() {
    const data:ArtInfoFromGoogleDrive[] = await getAllDriveFiles();
    return (
        <div className={styles.adminMain}>
            <h1>JSY PORTFOLIO</h1>
            <PostManager data={data}/>
        </div>
    )
}