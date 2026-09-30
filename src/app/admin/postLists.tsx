"use client";

export default function postLists({data, onRegister}:{data:any, onRegister:()=>void}) {
    return (
        <div>
            { data.length > 0 ? (
                <ul>
                   <li></li>
                </ul>
            ):(
                <>포스팅이 없습니다.</>
            )}
            <button onClick={onRegister}>
                + 새 포스팅 등록
            </button>
        </div>
    );
}