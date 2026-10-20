"use client";

import styles from '@/__cssModules/admin/postLists.module.css'
import PostImage from "./postImage"
import LayerPopup from './layerPopup'
import type { Post } from "@/__types/artwork";
import { useState } from "react";

type Props = {
    posts:Post[]
    onEdit: (post: Post) => void
    onDelete:(postId:string) => void
};
export default function PostLists({ posts, onEdit, onDelete }:Props ) {
    const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false) 
    const [selectedPopstIds, setSelectedPopstIds] = useState<string[]>([])
    const updateDate = (date:null|string) => !date ? '' : new Intl.DateTimeFormat('ko-KR').format(new Date(date))
    const caption = (post:Post) =>{
        const width = post.width || ''
        const height = post.height || ''
        const size = width !== '' && height !=='' ? `, ${width} X ${height}` : ''
        return `${post.medium}${size}`
    }
    const handleDelete = async (postId:string[]) =>{
         const response = await fetch("/api/posts", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({postId}),
        });
        const result = await response.json();
        if (response.ok && result.success) onDelete(postId)
        console.log(result);
    }
    return (
        <div>
            {posts.map((post) => (
                <div className={styles.postList} key={post.postId}>
                    <PostImage src={post.images[0].thumbnailUrl} alt={post.title} />
                    <article className={styles.postWrapper}>
                        <div className={styles.postInfo} onClick={() => onEdit(post)}>
                            <h2 className={styles.imgTitle}>{post.title}</h2>
                            <div className={styles.updatedAt}>{updateDate(post.updatedAt)}</div>
                            <span>{caption(post)}</span>
                        </div>
                        <button className={styles.deleteButton} onClick={() => setSelectedPopstIds([post.postId])}>삭제</button>
                    </article>
                </div>
            ))}
            {isDeleteConfirmOpened && 
                <LayerPopup sentence="삭제 하시겠습니까?" 
                    onClose={() => setIsDeleteConfirmOpened(false)}
                    onAccept={() => handleDelete(selectedPopstIds)}
                />
            }
        </div>
    );
}