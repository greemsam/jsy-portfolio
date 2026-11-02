"use client";
import styles from "@/__cssModules/admin/layerPopup.module.css";

type Props = {
    title?:string
    sentence:string
    cancelButtonText?:string
    acceptButtonText?:string
    onClose: () => void
    onCancel?: () => void
    onAccept?: () => void
    disabled?: boolean
    destructive?: boolean
};
const defaultProps:Props = {
    title:'알림',
    sentence:'알 수 없는 오류입니다.',
    acceptButtonText:'확인',
    onClose(){window.location.replace('/')},
}
export default function layerPopup({
    title,
    sentence,
    cancelButtonText,
    acceptButtonText,
    onClose,
    onCancel,
    onAccept,
    disabled = false,
    destructive = false
}:Props = defaultProps ) {
    return (
        <div className={styles.cover}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={title || '알림'}>
            <button className={styles.close} type="button" aria-label="닫기" disabled={disabled} onClick={onClose}>닫기</button>
            <h1>{title}</h1>
            <p>{sentence}</p>
            <div className={styles.actions}>
            {cancelButtonText &&
                <button className={styles.cancel} disabled={disabled} onClick={onCancel ?? onClose}>{cancelButtonText}</button>
            }
            <button className={`${styles.accept} ${destructive ? styles.danger : ''}`} disabled={disabled} onClick={onAccept ? onAccept : onClose}>{acceptButtonText}</button>
            </div>
          </div>
        </div>
    )
}
