"use client";

import styles from '@/__cssModules/admin/postLists.module.css'
import PostImage from "./postImage"
import LayerPopup from './layerPopup'
import type { Post } from "@/__types/artwork";
import { useState } from "react";

type Props = {
    posts:Post[]
    onEdit: (post: Post) => void
    onDelete:(postIds:string[]) => void
};
export default function PostLists({ posts, onEdit, onDelete }:Props ) {
    const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false) 
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])
    const [pendingPostIds, setPendingPostIds] = useState<string[]>([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const confirmDelete = (postIds: string[]) => {
        if (postIds.length > 100) {
            setError('한 번에 최대 100개까지 삭제할 수 있습니다.')
            return
        }
        setPendingPostIds(postIds)
        setError('')
        setIsDeleteConfirmOpened(true)
    }
    const updateDate = (date:null|string) => !date ? '' : new Intl.DateTimeFormat('ko-KR').format(new Date(date))
    const caption = (post:Post) =>{
        const width = post.width || ''
        const height = post.height || ''
        const size = width !== '' && height !=='' ? `, ${width} X ${height}` : ''
        return `${post.medium}${size}`
    }
    const handleDelete = async () => {
        if (isDeleting || !pendingPostIds.length) return
        setIsDeleting(true)
        setError('')
        try {
            const response = await fetch("/api/posts", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({postIds: pendingPostIds}),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '삭제하지 못했습니다. 다시 시도해 주세요.')
            }
            onDelete(result.deletedPostIds)
            const deletedIds = new Set<string>(result.deletedPostIds)
            setSelectedPostIds((prev) => prev.filter((id) => !deletedIds.has(id)))
            setIsDeleteConfirmOpened(false)
            setPendingPostIds([])
        } catch (error) {
            setError(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.')
        } finally {
            setIsDeleting(false)
        }
    }
    return (
        <div>
            <label>
                <input type="checkbox" disabled={isDeleting || !posts.length}
                    checked={posts.length > 0 && posts.every((post) => selectedPostIds.includes(post.postId))}
                    onChange={(event) => setSelectedPostIds(event.target.checked ? posts.map((post) => post.postId) : [])} />
                전체 선택
            </label>
            <button disabled={isDeleting || !selectedPostIds.length} onClick={() => confirmDelete(selectedPostIds)}>
                선택 삭제 ({selectedPostIds.length})
            </button>
            {error && <p role="alert">{error}</p>}
            {posts.map((post) => (
                <div className={styles.postList} key={post.postId}>
                    <input type="checkbox" aria-label={`${post.title} 선택`} disabled={isDeleting}
                        checked={selectedPostIds.includes(post.postId)}
                        onChange={(event) => setSelectedPostIds((prev) => event.target.checked
                            ? [...prev, post.postId] : prev.filter((id) => id !== post.postId))} />
                    {post.images[0] && <PostImage src={post.images[0].thumbnailUrl} alt={post.title} />}
                    <article className={styles.postWrapper}>
                        <div className={styles.postInfo} onClick={() => onEdit(post)}>
                            <h2 className={styles.imgTitle}>{post.title}</h2>
                            <div className={styles.updatedAt}>{updateDate(post.updatedAt)}</div>
                            <span>{caption(post)}</span>
                        </div>
                        <button className={styles.deleteButton} disabled={isDeleting} onClick={() => confirmDelete([post.postId])}>삭제</button>
                    </article>
                </div>
            ))}
            {isDeleteConfirmOpened && 
                <LayerPopup sentence={`${pendingPostIds.length}개 작품을 삭제하시겠습니까?`}
                    title="작품 삭제" cancelButtonText="취소" acceptButtonText={isDeleting ? '삭제 중…' : '삭제'}
                    disabled={isDeleting}
                    onClose={() => { if (!isDeleting) setIsDeleteConfirmOpened(false) }}
                    onCancel={() => { if (!isDeleting) setIsDeleteConfirmOpened(false) }}
                    onAccept={handleDelete}
                />
            }
        </div>
    );
}
