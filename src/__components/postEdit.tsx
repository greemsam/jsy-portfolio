"use client";

import { useEffect, useState } from "react";
import styles from "@/__cssModules/admin/postEdit.module.css";
import type { Post } from "@/__types/artwork";
type Props = {
    post:Post
    onClose: () => void;
    onUpdate: (updatedPost: Post) => void;
};
export default function postEdit({ post, onClose, onUpdate }: Props) {
    const [width, setWidth] = useState(post.width)
    const [height, setHeight] = useState(post.height)
    const [sizeUnit, setSizeUnit] = useState(post.sizeUnit || 'mm')
    const [medium, setMedium] = useState(post.medium)
    const [title, setTitle] = useState(post.title)
    const [description, setDescription] = useState(post.description)
    const handleUpdate = async () => {
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
    };
    return (
        <div className={styles.postEditCover}>
            <div className={styles.postEditDialog}>
                <div className={styles.postEditHeader}>
                    <h2>포스팅 수정</h2>
                    <button onClick={onClose}>닫기</button> 
                </div>
                <div className={styles.textInfo}>
                    <input type="text" 
                        value={title} 
                        onChange={(e)=> setTitle(e.target.value)} 
                        placeholder={'제목 입력'}
                    />
                    <br/>
                    <textarea value={description} 
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
                <button className={styles.registerPost} type="button" onClick={handleUpdate}>수정</button>
            </div>
        </div>
    );
}