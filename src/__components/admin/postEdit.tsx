"use client";

import ImageMetadataFields from "./imageMetadataFields";
import LoadingLayerPopup from "./loadingLayerPopup";
import YesOnlyLayerPopup from "./yesOnlyLayerPopup";

import { useState } from "react";
import styles from "@/__cssModules/admin/postForm.module.css";
import type { Post } from "@/__types/artwork";
type Props = {
    post: Post;
    onClose: () => void;
    onUpdate: (updatedPost: Post) => void;
};

function EditPreview({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <span
                className={styles.fileFallback}
                role="img"
                aria-label="이미지 없음"
            >
                <span className="material-icons-round" aria-hidden="true">
                    warning_amber
                </span>
            </span>
        );
    }
    return (
        <img
            className={styles.fileImage}
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            ref={(image) => {
                if (image?.complete && image.naturalWidth === 0)
                    setFailed(true);
            }}
        />
    );
}

export default function PostEdit({ post, onClose, onUpdate }: Props) {
    const [title, setTitle] = useState(post.title);
    const description = post.description;
    const [additionalDescription, setAdditionalDescription] = useState(
        post.additionalDescription ?? "",
    );
    const [images, setImages] = useState(
        post.images.map((image) => ({
            ...image,
            description: image.description ?? "",
            medium: image.medium ?? post.medium,
            width: image.width ?? post.width,
            height: image.height ?? post.height,
            sizeUnit: image.sizeUnit ?? post.sizeUnit ?? "mm",
        })),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [published, setPublished] = useState(post.published);
    const handleUpdate = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError("");
        try {
            // 서버에 전달할 작품 등록 데이터
            const params = {
                postId: post.postId,
                title,
                description,
                additionalDescription,
                published,
                images,
            };

            const response = await fetch(`/api/posts`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            });

            const result = await response.json();
            if (!response.ok || !result.success)
                throw new Error(
                    result.message ||
                        "수정하지 못했습니다. 다시 시도해 주세요.",
                );
            if (result.success) {
                onUpdate({
                    ...post,
                    title,
                    description,
                    additionalDescription,
                    published,
                    images,
                });
                setIsSuccess(true);
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "수정 중 오류가 발생했습니다.",
            );
        } finally {
            setIsSaving(false);
        }
    };
    if (isSaving)
        return <LoadingLayerPopup sentence="포스팅을 수정하고 있습니다…" />;
    if (isSuccess) {
        return (
            <YesOnlyLayerPopup
                title="수정 완료"
                sentence="수정되었습니다."
                onClose={onClose}
            />
        );
    }
    return (
        <div className={styles.postEditCover}>
            <div
                className={styles.postEditDialog}
                role="dialog"
                aria-modal="true"
                aria-label="포스팅 수정"
            >
                <div className={styles.postEditHeader}>
                    <h2>
                        <span className="material-icons" aria-hidden="true">
                            edit_note
                        </span>
                        포스팅 수정
                    </h2>
                    <button
                        type="button"
                        className={styles.closeIcon}
                        aria-label="닫기"
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        <span className="material-icons" aria-hidden="true">
                            close
                        </span>
                    </button>
                </div>
                <div className={styles.registerBody}>
                    <fieldset
                        className={styles.publishOptions}
                        aria-label="공개 여부"
                        disabled={isSaving}
                    >
                        <span className={styles.publishStatusLabel}>
                            포스팅 상태:
                        </span>
                        <label title="공개">
                            <input
                                type="radio"
                                name="published"
                                aria-label="공개"
                                checked={published}
                                onChange={() => setPublished(true)}
                            />
                            <span className="material-icons" aria-hidden="true">
                                visibility
                            </span>
                            공개
                        </label>
                        <label title="비공개">
                            <input
                                type="radio"
                                name="published"
                                aria-label="비공개"
                                checked={!published}
                                onChange={() => setPublished(false)}
                            />
                            <span className="material-icons" aria-hidden="true">
                                visibility_off
                            </span>
                            비공개
                        </label>
                    </fieldset>
                    <label
                        className={`${styles.imageMetadata} ${styles.postTitle}`}
                    >
                        포스팅 제목
                        <input
                            aria-label="포스팅 제목"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSaving}
                            placeholder="제목 입력"
                        />
                    </label>
                    <section
                        className={styles.artworkPreview}
                        aria-label="작품 미리보기"
                    >
                        {post.images.length ? (
                            images.map((image, index) => {
                                const src = image.thumbnailUrl;
                                return (
                                    <figure
                                        className={`${styles.previewItem} ${styles.imageGroup}`}
                                        key={`${image.driveFileId}-${index}`}
                                    >
                                        <EditPreview
                                            key={src}
                                            src={src}
                                            alt={`${post.title} ${index + 1}`}
                                        />
                                        <ImageMetadataFields
                                            key={image.driveFileId}
                                            label={"이미지 " + (index + 1)}
                                            value={image}
                                            disabled={isSaving}
                                            onChange={(value) =>
                                                setImages((prev) =>
                                                    prev.map((item, i) =>
                                                        i === index
                                                            ? {
                                                                  ...item,
                                                                  ...value,
                                                              }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </figure>
                                );
                            })
                        ) : (
                            <p className={styles.selectionEmpty}>
                                등록된 이미지가 없습니다.
                            </p>
                        )}
                    </section>

                    <label
                        className={`${styles.imageMetadata} ${styles.additionalDescription}`}
                    >
                        추가 부연설명
                        <textarea
                            value={additionalDescription}
                            onChange={(event) =>
                                setAdditionalDescription(event.target.value)
                            }
                            disabled={isSaving}
                            placeholder="추가 부연설명을 입력하세요."
                        />
                    </label>
                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}
                </div>
                <div className={styles.registerFooter}>
                    <button
                        className={styles.registerPost}
                        disabled={isSaving}
                        type="button"
                        onClick={handleUpdate}
                    >
                        {isSaving ? "저장 중…" : "수정 저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}
