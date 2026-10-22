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
    const handlePostUpdate = (updatedPost:Post) =>{
        const prevPosts = (prev:Post[]) => prev.map((post)=> post.postId === updatedPost.postId ? updatedPost : post)
        setPosts(prevPosts)
    }
    const handlePostDelete = (postIds: string[]) => {
        const deletedIds = new Set(postIds);
        setPosts((prev) => prev.filter((post) => !deletedIds.has(post.postId)));
    };
    return (
        <>
            <div className={styles.postSearch}>
                <input type="text" placeholder="작품검색" />
                <button>검색</button>
                <button onClick={() => setIsRegisterOpen(true)}>
                    포스팅 작성
                </button>
            </div>

            <PostLists posts={posts} onEdit={setEditingPost} onDelete={handlePostDelete}/>
            {isRegisterOpen && (
                <PostRegister driveFiles={initialData.driveFiles} onClose={() => setIsRegisterOpen(false)}/>
            )}
            {editingPost && (
                <PostEdit post={editingPost} onClose={() => setEditingPost(null)} onUpdate={handlePostUpdate}/>
            )}
        </>
    );
}
