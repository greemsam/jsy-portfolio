"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/__stores";
import PostLists from "./postLists";
import PostRegister from "./postRegister";
import type { Artwork } from "@/__types/artwork";
import type { DriveYearGroup } from "@/__types/drive";

type Props = {
    initialData: {
        artworks: Artwork[];
        driveFiles: DriveYearGroup[];
    };
};

export default function PostManager({ initialData }: Props) {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const setArtworks = useAdminStore((state) => state.setArtworks);
    const setDriveFiles = useAdminStore((state) => state.setDriveFiles);

    useEffect(() => {
        setArtworks(initialData.artworks);
        setDriveFiles(initialData.driveFiles);
    }, [initialData, setArtworks, setDriveFiles]);

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