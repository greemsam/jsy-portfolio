"use client";

type Props = {
    title?:string
    sentence:string
    cancelButtonText?:string
    acceptButtonText?:string
    onClose: () => void
    onCancel?: () => void
    onAccept?: () => void
    disabled?: boolean
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
    disabled = false
}:Props = defaultProps ) {
    return (
        <div>
            <button type="button" aria-label="닫기" disabled={disabled} onClick={onClose}>닫기</button>
            <h1>{title}</h1>
            <p>{sentence}</p>
            {cancelButtonText && 
                <button disabled={disabled} onClick={onCancel ?? onClose}>{cancelButtonText}</button>
            }
            <button disabled={disabled} onClick={onAccept ? onAccept : onClose}>{acceptButtonText}</button>
        </div>
    )
}
