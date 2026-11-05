"use client";

import { useState } from "react";
import type { Post } from "@/__types/artwork";
import styles from "@/__cssModules/service/latestArtwork.module.css";

export type Candidate = Pick<
    Post,
    "title" | "medium" | "width" | "height" | "sizeUnit" | "year"
> & {
    id: string;
    src: string;
};

export default function LatestArtwork({
    candidates,
}: {
    candidates: Candidate[];
}) {
    const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
    const artwork = candidates.find((item) => !failedIds.has(item.id));
    const markFailed = (id: string) =>
        setFailedIds((previous) =>
            previous.has(id) ? previous : new Set([...previous, id]),
        );

    return (
        <>
            <section className={styles.gallery} aria-label="작품 갤러리">
                {artwork ? (
                    <figure className={styles.artwork}>
                        <img
                            key={artwork.id}
                            className={styles.image}
                            src={artwork.src}
                            alt={artwork.title}
                            fetchPriority="high"
                            onError={() => markFailed(artwork.id)}
                            ref={(image) => {
                                if (image?.complete && image.naturalWidth === 0)
                                    markFailed(artwork.id);
                            }}
                        />
                        
                    </figure>
                ) : (
                    <p className={styles.empty}>표시할 수 있는 작품이 없습니다.</p>
                )}
                {artwork ? (
                    <div className={styles.artworkInfo}>
                        <h3>{`${artwork.title} (${artwork.year})`}</h3>
                        <span>
                            {`${artwork.medium}, ${artwork.width} X ${artwork.height}${artwork.sizeUnit}`}
                        </span>
                    </div>
                ):('')}
                <div className={styles.artistInfo}>
                    <h1>Vulyeppun Art</h1>
                </div>
            </section>
        </>
    );
}
