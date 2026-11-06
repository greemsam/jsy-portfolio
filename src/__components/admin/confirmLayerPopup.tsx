"use client";
import styles from "@/__cssModules/admin/layerPopup.module.css";

type Props = {
    title?: string;
    sentence: string;
    cancelButtonText?: string;
    acceptButtonText?: string;
    onClose: () => void;
    onCancel?: () => void;
    onAccept: () => void;
    disabled?: boolean;
    destructive?: boolean;
};
export default function ConfirmLayerPopup({
    title = "알림",
    sentence,
    cancelButtonText = "취소",
    acceptButtonText = "확인",
    onClose,
    onCancel,
    onAccept,
    disabled = false,
    destructive = false,
}: Props) {
    return (
        <div className={styles.cover}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label={title || "알림"}
            >
                <button
                    className={styles.close}
                    type="button"
                    aria-label="닫기"
                    disabled={disabled}
                    onClick={onClose}
                >
                    <span className="material-icons" aria-hidden="true">
                        clear
                    </span>
                </button>
                <h1>{title}</h1>
                <p>{sentence}</p>
                <div className={styles.actions}>
                    {cancelButtonText && (
                        <button
                            className={styles.cancel}
                            disabled={disabled}
                            onClick={onCancel ?? onClose}
                        >
                            {cancelButtonText}
                        </button>
                    )}
                    <button
                        className={`${styles.accept} ${destructive ? styles.danger : ""}`}
                        disabled={disabled}
                        onClick={onAccept}
                    >
                        {acceptButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
