"use client";

import { useAdminStore } from "@/__stores";
import styles from '@/__cssModules/admin/postLists.module.css'
import PostImage from "./postImage"
import type { Post } from "@/__types/artwork";
export default function PostLists() {
    const posts = useAdminStore((state) => state.posts);
    const updateDate = (date:null|string) => !date ? '' : new Intl.DateTimeFormat('ko-KR').format(new Date(date))
    const caption = (artwork:Post) =>{

    }

    return (
        <div>
            {posts.map((post) => (
                <div className={styles.postList} key={post.postId}>
                    <PostImage src={post.images[0].thumbnailUrl} alt={post.title} />
                    <article>
                        <h2 className={styles.imgTitle}>{post.title}</h2>
                        <p>{post.description}</p>
                        <div className={styles.updatedAt}>업로드 날짜: {updateDate(post.updatedAt)}</div>
                        <span>재료: {post.medium}</span>
                        <span>크기: {post.size?.width} X {post.size?.height}</span>
                    </article>
                </div>
            ))}
        </div>
    );
}