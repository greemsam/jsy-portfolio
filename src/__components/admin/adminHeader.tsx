"use client";
import styles from "@/__cssModules/admin/adminHeader.module.css";
export default function adminHeader() {
    return (
        <header className={styles.adminHeader}>
            <div className={styles.adminHeaderInner}>
                <h1>Vulyeppun Art 관리자</h1>
                <button
                    type="button"
                    onClick={async () => {
                        const response = await fetch("/api/admin/session", {
                            method: "DELETE",
                        });
                        if (response.ok)
                            window.location.replace("/admin/login");
                    }}
                >
                    로그아웃
                </button>
            </div>
        </header>
    );
}
