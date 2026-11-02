"use client";

import { useState } from "react";
import PostLists from "./postLists";
import PostRegister from "./postRegister";
import PostEdit from "./postEdit";
import type { Post } from "@/__types/artwork";
import type { DriveYearGroup } from "@/__types/drive";
import styles from '@/__cssModules/admin/postManager.module.css'

type Props = {
    initialData: {
        posts: Post[];
        driveFiles: DriveYearGroup[];
    };
};

export default function PostManager({ initialData }: Props) {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>(initialData.posts);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const visiblePosts = posts.filter((post) =>
        `${post.title} ${post.medium} ${post.year}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    );
    const handlePostUpdate = (updatedPost:Post) =>{
        const prevPosts = (prev:Post[]) => prev.map((post)=> post.postId === updatedPost.postId ? updatedPost : post)
        setPosts(prevPosts)
    }
    const handlePostDelete = (postIds: string[]) => {
        const deletedIds = new Set(postIds);
        setPosts((prev) => prev.filter((post) => !deletedIds.has(post.postId)));
    };
    return (
        <div className={styles.postManager}>
            <form className={styles.postSearch} onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }} role="search">
                <input type="search" aria-label="작품 검색" placeholder="제목, 재료, 제작년도 검색" value={query} onChange={(event) => { setQuery(event.target.value); if (!event.target.value) setSearch(''); }} />
                <button type="submit">검색</button>
                <button type="button" className={styles.postUpload} onClick={() => setIsRegisterOpen(true)}>
                    포스팅 작성
                </button>
            </form>

            <PostLists key={search} posts={visiblePosts} onEdit={setEditingPost} onDelete={handlePostDelete}/>
            {isRegisterOpen && (
                <PostRegister driveFiles={initialData.driveFiles} onClose={() => setIsRegisterOpen(false)}/>
            )}
            {editingPost && (
                <PostEdit post={editingPost} onClose={() => setEditingPost(null)} onUpdate={handlePostUpdate}/>
            )}
        </div>
    );
}
