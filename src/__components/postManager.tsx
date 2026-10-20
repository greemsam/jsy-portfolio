"use client";

import { useEffect, useState } from "react";
import PostLists from "./postLists";
import PostRegister from "./postRegister";
import PostEdit from "./postEdit";
import type { Post } from "@/__types/artwork";
import type { DriveYearGroup } from "@/__types/drive";

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
    const handlePostDelete = (postId: string[]) => {
        setPosts((prev) =>{
            const nextArr = []
            prev.forEach(postId => {
                if(prev.postId !== postId)
            })
            prev.filter((post) => post.postId !== postId)
        );
    };
    return (
        <>
            <button onClick={() => setIsRegisterOpen(true)}>
                작품 등록
            </button>
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