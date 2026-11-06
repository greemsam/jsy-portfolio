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
                            {post.description && (
                                <p className={styles.prose}>
                                    {post.description}
                                </p>
                            )}
                            {(post.images.length ? post.images : [null]).map(
                                (image, index) => (
                                    <figure key={index}>
                                        {image ? (
                                            <img
                                                src={
                                                    image.thumbnailUrl ||
                                                    image.displayUrl
                                                }
                                                alt={post.title}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className={styles.placeholder}>
                                                이미지 없음
                                            </div>
                                        )}
                                        <figcaption>
                                            {image?.description && (
                                                <p className={styles.prose}>
                                                    {image.description}
                                                </p>
                                            )}
                                            <p>
                                                {image?.medium !== undefined
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
                                ),
                            )}
                            {post.additionalDescription && (
                                <p className={styles.prose}>
                                    {post.additionalDescription}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
