"use client";

import { useAdminStore } from "@/__stores";
import styles from '@/__cssModules/admin/postLists.module.css'
import PostImage from "./postImage"
import type { Post } from "@/__types/artwork";

type Props = {
    posts:Post[]
    onEdit: (post: Post) => void;
};
export default function PostLists({ posts, onEdit }:Props ) {
    const updateDate = (date:null|string) => !date ? '' : new Intl.DateTimeFormat('ko-KR').format(new Date(date))
    const caption = (post:Post) =>{
        const width = post.width || ''
        const height = post.height || ''
        const size = width !== '' && height !=='' ? `, ${width} X ${height}` : ''
        return `${post.medium}${size}`
    }
    return (
        <div>
            {posts.map((post) => (
                <div className={styles.postList} key={post.postId}>
                    <PostImage src={post.images[0].thumbnailUrl} alt={post.title} />
                    <article onClick={() => onEdit(post)}>
                        <h2 className={styles.imgTitle}>{post.title}</h2>
                        <div className={styles.updatedAt}>{updateDate(post.updatedAt)}</div>
                        <span>{caption(post)}</span>
                    </article>
                </div>
            ))}
        </div>
    );
}