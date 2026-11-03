"use client";

import { useState } from "react";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    inMemoryPersistence,
    setPersistence,
    signOut,
} from "firebase/auth";
import styles from "@/__cssModules/admin/adminLogin.module.css";

export default function AdminLogin({ config }: { config: FirebaseOptions }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const configured = !!(
        config.apiKey &&
        config.authDomain &&
        config.projectId
    );
    const login = async () => {
        if (busy || !configured) return;
        setBusy(true);
        setError("");
        const app =
            getApps().find((item) => item.name === "admin-client") ??
            initializeApp(config, "admin-client");
        const auth = getAuth(app);
        try {
            await setPersistence(auth, inMemoryPersistence);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const { user } = await signInWithPopup(auth, provider);
            const response = await fetch("/api/admin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: await user.getIdToken() }),
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.message || "로그인하지 못했습니다.");
            window.location.replace("/admin");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "로그인하지 못했습니다.",
            );
        } finally {
            await signOut(auth).catch(() => {});
            setBusy(false);
        }
    };
    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <h1>비공개 관리 시스템</h1>
                <p>승인된 계정만 이용할 수 있습니다.</p>
                {!configured && (
                    <p role="alert">로그인 환경 설정이 필요합니다.</p>
                )}
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}
                <div className={styles.actions}>
                    <a href="/">홈으로</a>
                    <button disabled={busy || !configured} onClick={login}>
                        {busy ? "인증 중…" : "관리자 인증"}
                    </button>
                </div>
            </section>
        </main>
    );
}
