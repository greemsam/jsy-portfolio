"use client";
import styles from "@/__cssModules/admin/layerPopup.module.css";

type Props = {
    title?: string;
    sentence: string;
    acceptButtonText?: string;
    onClose: () => void;
};

export default function YesOnlyLayerPopup({
    title = "알림",
    sentence,
    acceptButtonText = "확인",
    onClose,
}: Props) {
    return (
        <div className={styles.cover}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <h1>{title}</h1>
                <p>{sentence}</p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.accept}
                        onClick={onClose}
                    >
                        {acceptButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
