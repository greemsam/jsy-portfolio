import type { Post } from "@/__types/artwork";
import styles from "@/__cssModules/service/artworkGallery.module.css";

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
                {posts.map((post) => {
                    const size =
                        post.width && post.height
                            ? `${post.width} X ${post.height}${post.sizeUnit ? ` ${post.sizeUnit}` : ""}`
                            : "";
                    return (
                        <li key={post.postId} className={styles.card}>
                            <h3>{post.title}</h3>
                            {(post.images.length
                                ? post.images.slice(0, 1)
                                : [null]
                            ).map((image, index) => (
                                <figure key={index}>
                                    {image?.thumbnailUrl ? (
                                        <img
                                            src={image.thumbnailUrl}
                                            alt={post.title}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            이미지 없음
                                        </div>
                                    )}
                                    <figcaption>
                                        <p>
                                            {post.images.length > 1
                                                ? `+${post.images.length - 1}개의 사진`
                                                : image?.medium !== undefined
                                                  ? [
                                                        image.medium,
                                                        image.width &&
                                                        image.height
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
