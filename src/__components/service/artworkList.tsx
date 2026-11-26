"use client";

import { useState } from "react";
import type { Post } from "@/__types/artwork";
import styles from "@/__cssModules/service/artworkGallery.module.css";

function ArtworkThumbnail({
    src,
    title,
    eager,
}: {
    src: string;
    title: string;
    eager: boolean;
}) {
    const [status, setStatus] = useState("loading");
    return (
        <div
            className={styles.thumbnail}
            data-status={status}
            aria-busy={status === "loading"}
        >
            {status === "error" ? (
                <p role="status">이미지를 불러오지 못했습니다.</p>
            ) : (
                <img
                    src={src}
                    alt={title}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={() => setStatus("loaded")}
                    onError={() => setStatus("error")}
                />
            )}
        </div>
    );
}

export default function ArtworkList({
    year,
    posts,
}: {
    year: string;
    posts: Post[];
}) {
    return (
        <section className={styles.list} aria-label={`${year} 작품 목록`}>
            <h2>{year}</h2>
            {posts.length === 0 && <p>공개된 작품이 없습니다.</p>}
            <ul className={styles.grid}>
                {posts.map((post, postIndex) => {
                    const size =
                        post.width > 0 && post.height > 0
                            ? `${post.width} X ${post.height}${post.sizeUnit ? ` ${post.sizeUnit}` : ""}`
                            : "";
                    return (
                        <li key={post.postId} className={styles.card}>
                            {(post.images.length
                                ? post.images.slice(0, 1)
                                : [null]
                            ).map((image, index) => (
                                <figure key={index}>
                                    {image?.thumbnailUrl ? (
                                        <ArtworkThumbnail
                                            key={image.thumbnailUrl}
                                            src={image.thumbnailUrl}
                                            title={post.title}
                                            eager={postIndex < 4}
                                        />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            이미지 없음
                                        </div>
                                    )}
                                    <figcaption>
                                        <h3>{post.title}</h3>
                                        <p>
                                            {post.images.length > 1
                                                ? `+${post.images.length - 1}개의 사진`
                                                : image?.medium !== undefined
                                                  ? [
                                                        image.medium,
                                                        (image.width ?? 0) >
                                                            0 &&
                                                        (image.height ?? 0) > 0
                                                            ? `${image.width} X ${image.height}${image.sizeUnit ?? ""}`
                                                            : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")
                                                  : (image?.caption ??
                                                    [post.medium, size]
                                                        .filter(Boolean)
                                                        .join(", "))}
                                        </p>
                                    </figcaption>
                                </figure>
                            ))}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
