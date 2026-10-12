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

    return (
        <>
            <button onClick={() => setIsRegisterOpen(true)}>
                작품 등록
            </button>
            <PostLists posts={posts} onEdit={setEditingPost}/>
            {isRegisterOpen && (
                <PostRegister driveFiles={initialData.driveFiles} onClose={() => setIsRegisterOpen(false)}/>
            )}
            {editingPost && (
                <PostEdit post={editingPost} onClose={() => setEditingPost(null)}/>
            )}
        </>
    );
}