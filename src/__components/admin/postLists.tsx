"use client";

import styles from "@/__cssModules/admin/postLists.module.css";
import PostImage from "./postImage";
import LayerPopup from "./layerPopup";
import type { Post } from "@/__types/artwork";
import { useState } from "react";

type Props = {
    posts: Post[];
    onEdit: (post: Post) => void;
    onDelete: (postIds: string[]) => void;
    onPublishedChange: (postIds: string[], published: boolean) => void;
};
export default function PostLists({
    posts,
    onEdit,
    onDelete,
    onPublishedChange,
}: Props) {
    const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false);
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    const [pendingPostIds, setPendingPostIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [publishRequest, setPublishRequest] = useState<{
        postIds: string[];
        published: boolean;
    } | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const isBusy = isDeleting || isPublishing;
    const confirmPublish = (postIds: string[], published: boolean) => {
        setError("");
        if (!postIds.length || postIds.length > 100) {
            setError("한 번에 최대 100개까지 변경할 수 있습니다.");
            return;
        }
        setPublishRequest({ postIds, published });
    };
    const handlePublish = async () => {
        if (!publishRequest || isBusy) return;
        setIsPublishing(true);
        setError("");
        try {
            const response = await fetch("/api/posts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(publishRequest),
            });
            const result = await response.json();
            if (!response.ok || !result.success)
                throw new Error(
                    result.message ||
                        "공개 여부를 변경하지 못했습니다. 다시 시도해 주세요.",
                );
            onPublishedChange(publishRequest.postIds, publishRequest.published);
            setPublishRequest(null);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "공개 여부 변경 중 오류가 발생했습니다.",
            );
        } finally {
            setIsPublishing(false);
        }
    };
    const confirmDelete = (postIds: string[]) => {
        if (postIds.length > 100) {
            setError("한 번에 최대 100개까지 삭제할 수 있습니다.");
            return;
        }
        setPendingPostIds(postIds);
        setError("");
        setIsDeleteConfirmOpened(true);
    };
    const updateDate = (date: null | string) =>
        !date ? "" : new Intl.DateTimeFormat("ko-KR").format(new Date(date));
    const caption = (post: Post) => {
        const width = post.width || "";
        const height = post.height || "";
        const size =
            width !== "" && height !== ""
                ? `${width} X ${height}${post.sizeUnit ? ` ${post.sizeUnit}` : ""}`
                : "";
        return [post.medium, size].filter(Boolean).join(", ");
    };
    const handleDelete = async () => {
        if (isDeleting || !pendingPostIds.length) return;
        setIsDeleting(true);
        setError("");
        try {
            const response = await fetch("/api/posts", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ postIds: pendingPostIds }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                        "삭제하지 못했습니다. 다시 시도해 주세요.",
                );
            }
            onDelete(result.deletedPostIds);
            const deletedIds = new Set<string>(result.deletedPostIds);
            setSelectedPostIds((prev) =>
                prev.filter((id) => !deletedIds.has(id)),
            );
            setIsDeleteConfirmOpened(false);
            setPendingPostIds([]);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "삭제 중 오류가 발생했습니다.",
            );
        } finally {
            setIsDeleting(false);
        }
    };
    return (
        <div className={styles.postListWrapper}>
            <div className={styles.postListDelete}>
                <input
                    type="checkbox"
                    disabled={isBusy || !posts.length}
                    id="all-lists"
                    className={styles.allLists}
                    checked={
                        posts.length > 0 &&
                        posts.every((post) =>
                            selectedPostIds.includes(post.postId),
                        )
                    }
                    onChange={(event) =>
                        setSelectedPostIds(
                            event.target.checked
                                ? posts.map((post) => post.postId)
                                : [],
                        )
                    }
                />
                <label className={styles.deleteSelectAll} htmlFor="all-lists">
                    <span className="material-icons" aria-hidden="true">
                        done
                    </span>
                </label>
                <label
                    htmlFor="all-lists"
                    className={styles.deleteSelectAllText}
                >
                    전체 선택
                </label>
                <div className={styles.selectionActions}>
                    <button
                        className={`${styles.deleteSelected} ${isBusy || !selectedPostIds.length ? "" : styles.deleteActive}`}
                        title="선택 삭제"
                        aria-label={`선택 삭제(${selectedPostIds.length})`}
                        disabled={isBusy || !selectedPostIds.length}
                        onClick={() => confirmDelete(selectedPostIds)}
                    >
                        <span className="material-icons" aria-hidden="true">
                            delete
                        </span>
                        <span className={styles.actionText}>선택 삭제</span>(
                        {selectedPostIds.length})
                    </button>
                    <button
                        className={styles.publishSelected}
                        disabled={isBusy || !selectedPostIds.length}
                        title="선택 비공개"
                        aria-label={`선택 비공개(${selectedPostIds.length})`}
                        onClick={() => confirmPublish(selectedPostIds, false)}
                    >
                        <span className="material-icons" aria-hidden="true">
                            visibility_off
                        </span>
                        <span className={styles.actionText}>선택 비공개</span>(
                        {selectedPostIds.length})
                    </button>
                    <button
                        className={styles.publishSelected}
                        disabled={isBusy || !selectedPostIds.length}
                        title="선택 공개"
                        aria-label={`선택 공개(${selectedPostIds.length})`}
                        onClick={() => confirmPublish(selectedPostIds, true)}
                    >
                        <span className="material-icons" aria-hidden="true">
                            visibility
                        </span>
                        <span className={styles.actionText}>선택 공개</span>(
                        {selectedPostIds.length})
                    </button>
                </div>
            </div>
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
            {!posts.length && (
                <div className={styles.empty}>표시할 작품이 없습니다.</div>
            )}
            <ul className={styles.postList}>
                {posts.map((post) => (
                    <li className={styles.postItem} key={post.postId}>
                        <input
                            id={`list-${post.postId}`}
                            className={styles.postCheck}
                            type="checkbox"
                            aria-label={`${post.title} 선택`}
                            disabled={isBusy}
                            checked={selectedPostIds.includes(post.postId)}
                            onChange={(event) =>
                                setSelectedPostIds((prev) =>
                                    event.target.checked
                                        ? [...prev, post.postId]
                                        : prev.filter(
                                              (id) => id !== post.postId,
                                          ),
                                )
                            }
                        />
                        <label htmlFor={`list-${post.postId}`}>
                            <span className="material-icons" aria-hidden="true">
                                done
                            </span>
                        </label>
                        {post.images[0] && (
                            <button
                                type="button"
                                className={styles.thumbnailButton}
                                onClick={() => onEdit(post)}
                                aria-label={`${post.title} 수정`}
                            >
                                <PostImage
                                    src={post.images[0].thumbnailUrl}
                                    alt={post.title}
                                />
                            </button>
                        )}
                        <article className={styles.postWrapper}>
                            <button
                                type="button"
                                className={styles.postInfo}
                                onClick={() => onEdit(post)}
                                aria-label={`${post.title} 수정`}
                            >
                                <h2 className={styles.imgTitle}>
                                    {post.title}
                                </h2>
                                <div className={styles.updatedAt}>
                                    <i>제작년도: {post.year}</i>
                                    <br />
                                    <i>등록일: {updateDate(post.updatedAt)}</i>
                                </div>
                                <span className={styles.caption}>
                                    {caption(post)}
                                </span>
                            </button>
                            <button
                                className={styles.deleteButton}
                                aria-label={`${post.title} 삭제`}
                                disabled={isBusy}
                                onClick={() => confirmDelete([post.postId])}
                            >
                                <span
                                    className="material-icons"
                                    aria-hidden="true"
                                >
                                    delete
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.visibilityButton} ${post.published ? styles.published : styles.unpublished}`}
                                aria-label={`${post.title}: 현재 ${post.published ? "공개" : "비공개"}, ${post.published ? "비공개" : "공개"}로 전환`}
                                title={
                                    post.published
                                        ? "비공개로 전환"
                                        : "공개로 전환"
                                }
                                disabled={isBusy}
                                onClick={() =>
                                    confirmPublish(
                                        [post.postId],
                                        !post.published,
                                    )
                                }
                            >
                                <span
                                    className="material-icons-outlined"
                                    aria-hidden="true"
                                >
                                    {post.published
                                        ? "visibility"
                                        : "visibility_off"}
                                </span>
                            </button>
                        </article>
                    </li>
                ))}
            </ul>
            {publishRequest && (
                <LayerPopup
                    title="공개 여부 변경"
                    sentence={`${publishRequest.postIds.length > 1 ? `${publishRequest.postIds.length}개 작품을 ` : ""}${publishRequest.published ? "공개" : "비공개"}로 전환하시겠습니까?${error ? ` ${error}` : ""}`}
                    cancelButtonText="취소"
                    acceptButtonText={
                        isPublishing
                            ? "변경 중…"
                            : publishRequest.published
                              ? "공개로 전환"
                              : "비공개로 전환"
                    }
                    disabled={isPublishing}
                    onClose={() => {
                        if (!isPublishing) setPublishRequest(null);
                    }}
                    onAccept={handlePublish}
                />
            )}
            {isDeleteConfirmOpened && (
                <LayerPopup
                    sentence={`${pendingPostIds.length}개 작품을 삭제하시겠습니까?`}
                    destructive
                    title="작품 삭제"
                    cancelButtonText="취소"
                    acceptButtonText={isDeleting ? "삭제 중…" : "삭제"}
                    disabled={isBusy}
                    onClose={() => {
                        if (!isDeleting) setIsDeleteConfirmOpened(false);
                    }}
                    onCancel={() => {
                        if (!isDeleting) setIsDeleteConfirmOpened(false);
                    }}
                    onAccept={handleDelete}
                />
            )}
        </div>
    );
}
