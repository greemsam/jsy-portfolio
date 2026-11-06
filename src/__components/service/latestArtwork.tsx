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
    const images = candidates.slice(0, 4);
    const artwork = images.find((item) => !failedIds.has(item.id));
    const isMultiple = images.length > 1;
    const markFailed = (id: string) =>
        setFailedIds((previous) =>
            previous.has(id) ? previous : new Set([...previous, id]),
        );

    return (
        <>
            <section className={styles.gallery} aria-label="작품 갤러리">
                {artwork ? (
                    <figure
                        className={
                            isMultiple
                                ? styles.artwork +
                                  " " +
                                  styles.multiple +
                                  " " +
                                  (images.length === 3
                                      ? styles.threeImages
                                      : "")
                                : styles.artwork
                        }
                    >
                        {images.map((image, index) => (
                            <div
                                className={
                                    isMultiple
                                        ? styles.imageSlot
                                        : styles.singleImage
                                }
                                key={image.id}
                            >
                                {failedIds.has(image.id) ? (
                                    <p className={styles.empty}>
                                        이미지를 불러오지 못했습니다.
                                    </p>
                                ) : (
                                    <img
                                        className={styles.image}
                                        src={image.src}
                                        alt={
                                            image.title +
                                            (isMultiple
                                                ? " " + (index + 1)
                                                : "")
                                        }
                                        fetchPriority={
                                            index === 0 ? "high" : "auto"
                                        }
                                        onError={() => markFailed(image.id)}
                                        ref={(element) => {
                                            if (
                                                element?.complete &&
                                                element.naturalWidth === 0
                                            )
                                                markFailed(image.id);
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </figure>
                ) : (
                    <p className={styles.empty}>
                        표시할 수 있는 작품이 없습니다.
                    </p>
                )}
                {artwork ? (
                    <div className={styles.artworkInfo}>
                        <h3>{`${artwork.title} (${artwork.year})`}</h3>
                        {!isMultiple && (
                            <span>
                                {`${artwork.medium}, ${artwork.width} X ${artwork.height}${artwork.sizeUnit}`}
                            </span>
                        )}
                    </div>
                ) : (
                    ""
                )}
                <div className={styles.artistInfo}>
                    <h1>Vulyeppun Art</h1>
                </div>
            </section>
        </>
    );
}
