"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/__stores";
import PostLists from "./postLists";
import PostRegister from "./postRegister";
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
    const setPosts = useAdminStore((state) => state.setPosts);
    const setDriveFiles = useAdminStore((state) => state.setDriveFiles);

    useEffect(() => {
        setPosts(initialData.posts);
        setDriveFiles(initialData.driveFiles);
    }, [initialData, setPosts, setDriveFiles]);

    return (
        <>
            <button onClick={() => setIsRegisterOpen(true)}>
                작품 등록
            </button>
            <PostLists />
            {isRegisterOpen && (
                <PostRegister
                    onClose={() => setIsRegisterOpen(false)}
                />
            )}
        </>
    );
}