'use client'
import styles from "@/__cssModules/admin/adminHeader.module.css"
export default function adminHeader(){
    return (
        <header className={styles.adminHeader}>
            <div className={styles.adminHeaderInner}>
                <h1>Vulyeppun Art</h1>
            </div>
        </header>
    )
}