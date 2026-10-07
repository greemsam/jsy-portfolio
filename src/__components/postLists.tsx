"use client";

import { useAdminStore } from "@/__stores";

export default function PostLists() {
    const artworks = useAdminStore((state) => state.artworks);
    return (
        <div>
            {artworks.map((artwork) => (
                <div key={artwork.artId}>
                    {artwork.title}
                </div>
            ))}
        </div>
    );
}