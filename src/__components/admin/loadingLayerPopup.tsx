"use client";
import styles from "@/__cssModules/admin/layerPopup.module.css";

type Props = {
    sentence?: string;
};

export default function LoadingLayerPopup({ sentence = "처리 중입니다…" }: Props) {
    return (
        <div className={styles.cover}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label="처리 중"
            >
                <div className={styles.loading} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    <p>{sentence}</p>
                </div>
            </div>
        </div>
    );
}
