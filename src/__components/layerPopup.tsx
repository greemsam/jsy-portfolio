"use client";

type Props = {
    title?:string
    sentence:string
    cancelButtonText?:string
    acceptButtonText?:string
    onClose: () => void
    onCancel?: () => void
    onAccept?: () => void
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
    onAccept 
}:Props = defaultProps ) {
    return (
        <div>
            <img src="" alt="close" onClick={onClose}/>
            <h1>{title}</h1>
            <p>{sentence}</p>
            {cancelButtonText && 
                <button onClick={onCancel}>{cancelButtonText}</button>
            }
            <button onClick={onAccept ? onAccept : onClose}>{acceptButtonText}</button>        
        </div>
    )
}