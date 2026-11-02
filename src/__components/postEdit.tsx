"use client";

import { useState } from "react";
import styles from "@/__cssModules/admin/postForm.module.css";
import type { Post } from "@/__types/artwork";
type Props = {
    post:Post
    onClose: () => void;
    onUpdate: (updatedPost: Post) => void;
};
export default function PostEdit({ post, onClose, onUpdate }: Props) {
    const [width, setWidth] = useState(post.width)
    const [height, setHeight] = useState(post.height)
    const [sizeUnit, setSizeUnit] = useState(post.sizeUnit || 'mm')
    const [medium, setMedium] = useState(post.medium)
    const [title, setTitle] = useState(post.title)
    const [description, setDescription] = useState(post.description)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const handleUpdate = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError('');
        try {
        // 서버에 전달할 작품 등록 데이터
        const params = {
            postId:post.postId,
            width,
            height,
            sizeUnit,
            title,
            description,
            medium,
        };

        const response = await fetch(`/api/posts`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });

        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '수정하지 못했습니다. 다시 시도해 주세요.');
        if(result.success){
            onUpdate({
                ...post,
                width,
                height,
                sizeUnit,
                title,
                description,
                medium,
            })
            onClose()
        }
        } catch (error) {
            setError(error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className={styles.postEditCover}>
            <div className={styles.postEditDialog} role="dialog" aria-modal="true" aria-label="포스팅 수정">
                <div className={styles.postEditHeader}>
                    <h2>포스팅 수정</h2>
                    <button disabled={isSaving} onClick={onClose}>닫기</button>
                </div>
                <div className={styles.textInfo}>
                    <input type="text"
                        aria-label="제목"
                        value={title}
                        onChange={(e)=> setTitle(e.target.value)}
                        placeholder={'제목 입력'}
                    />
                    <br/>
                    <textarea value={description}
                        aria-label="설명"
                        onChange={(e)=> setDescription(e.target.value)}
                        placeholder={'설명 입력'}
                    />
                </div>
                <ul>
                    <li className={styles.postEditMedium}>
                        <input type="text" placeholder="재료" value={medium} onChange={(e) => setMedium(e.target.value)}/>
                    </li>
                    <li className={styles.postEditSize}>
                        <input type="text" placeholder="가로" value={width} onChange={(e) => setWidth(Number(e.target.value))}/>
                        <span>X</span>
                        <input type="text" placeholder="세로" value={height} onChange={(e) => setHeight(Number(e.target.value))}/>
                        <select name="size-unit" id="size-unit" value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="px">px</option>
                        </select>
                    </li>
                </ul>
                {error && <p className={styles.error} role="alert">{error}</p>}
                <button className={styles.registerPost} disabled={isSaving} type="button" onClick={handleUpdate}>{isSaving ? '저장 중…' : '수정 저장'}</button>
            </div>
        </div>
    );
}
