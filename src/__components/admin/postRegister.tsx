"use client";

import ImageMetadataFields, { type ImageMetadata } from "./imageMetadataFields";
import LoadingLayerPopup from "./loadingLayerPopup";
import YesOnlyLayerPopup from "./yesOnlyLayerPopup";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriveYearGroup, DriveFile } from "@/__types/drive";
import styles from "@/__cssModules/admin/postForm.module.css";
import { MAX_POST_IMAGES } from "@/__types/artwork";

type Props = {
    driveFiles: DriveYearGroup[];
    onClose: () => void;
};

function ArtworkThumbnail({
    src,
    onSettled,
}: {
    src: string;
    onSettled: () => void;
}) {
    const [failed, setFailed] = useState(false);
    const [preview, setPreview] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        let objectUrl = "";
        let active = true;
        if (!src) {
            onSettled();
            return;
        }
        void (async () => {
            try {
                const response = await fetch(src, {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Preview failed");
                const blob = await response.blob();
                if (!active) return;
                objectUrl = URL.createObjectURL(blob);
                setPreview(objectUrl);
            } catch {
                if (active) {
                    setFailed(true);
                    onSettled();
                }
            }
        })();
        return () => {
            active = false;
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, onSettled]);
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
    if (!preview)
        return <span className={styles.fileFallback} aria-hidden="true" />;
    return (
        <img
            className={styles.fileImage}
            src={preview}
            alt=""
            onLoad={onSettled}
            onError={() => {
                setFailed(true);
                onSettled();
            }}
        />
    );
}

function ArtworkPreview({
    file,
    onSettled,
}: {
    file: DriveFile;
    onSettled: (id: string) => void;
}) {
    const settled = useCallback(() => onSettled(file.id), [onSettled, file.id]);
    return (
        <figure className={styles.previewItem}>
            <ArtworkThumbnail
                src={
                    file.mimeType.startsWith("image/")
                        ? `/api/drive/preview/${encodeURIComponent(file.id)}`
                        : ""
                }
                onSettled={settled}
            />
            <figcaption>{file.name}</figcaption>
        </figure>
    );
}

type ImageEntry = {
    id: number;
    year: string;
    file: DriveFile | null;
    metadata: ImageMetadata;
};
const emptyMetadata = (): ImageMetadata => ({
    description: "",
    medium: "",
    width: 0,
    height: 0,
    sizeUnit: "mm",
});

export default function PostRegister({ driveFiles, onClose }: Props) {
    const sortedDriveFiles = [...driveFiles].sort((a, b) => {
        const aBefore = /^before\s*2012$/i.test(a.year.trim());
        const bBefore = /^before\s*2012$/i.test(b.year.trim());
        return (
            Number(aBefore) - Number(bBefore) ||
            b.year.localeCompare(a.year, undefined, { numeric: true })
        );
    });
    const [title, setTitle] = useState("");
    const [additionalDescription, setAdditionalDescription] = useState("");
    const [published, setPublished] = useState(false);
    const [entries, setEntries] = useState<ImageEntry[]>([]);
    const nextEntryId = useRef(0);
    const [selectingId, setSelectingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [settledIds, setSettledIds] = useState<Set<string>>(() => new Set());
    const handleSettled = useCallback((id: string) => {
        setSettledIds((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    }, []);
    const isLoading = entries.some(
        (entry) =>
            entry.file &&
            entry.id !== selectingId &&
            !settledIds.has(entry.file.id),
    );
    const canSave =
        entries.length > 0 &&
        entries.every((entry) => entry.file) &&
        selectingId === null &&
        !isLoading &&
        !isSaving &&
        !isSuccess;
    const addImage = () => {
        if (entries.length >= MAX_POST_IMAGES || selectingId !== null) return;
        const id = nextEntryId.current++;
        setEntries((prev) => [
            ...prev,
            {
                id,
                year: sortedDriveFiles[0]?.year ?? "",
                file: null,
                metadata: emptyMetadata(),
            },
        ]);
        setSelectingId(id);
    };
    const selectImage = (entryId: number, file: DriveFile) => {
        setEntries((prev) =>
            prev.map((entry) =>
                entry.id === entryId ? { ...entry, file } : entry,
            ),
        );
        setSelectingId(null);
    };
    const removeImage = (entryId: number) => {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        if (selectingId === entryId) setSelectingId(null);
    };
    const handleRegister = async () => {
        if (!canSave) return;
        setIsSaving(true);
        setFeedback("");
        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: entries[0].year,
                    title,
                    description: "",
                    additionalDescription,
                    images: entries.map((entry) => ({
                        ...entry.file!,
                        ...entry.metadata,
                    })),
                    published,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success)
                throw new Error(
                    result.message ||
                        "등록하지 못했습니다. 다시 시도해 주세요.",
                );
            setIsSuccess(true);
        } catch (error) {
            setFeedback(
                error instanceof Error
                    ? error.message
                    : "등록 중 오류가 발생했습니다.",
            );
        } finally {
            setIsSaving(false);
        }
    };
    if (isSaving)
        return <LoadingLayerPopup sentence="포스팅을 등록하고 있습니다…" />;
    if (isSuccess)
        return (
            <YesOnlyLayerPopup
                title="등록 완료"
                sentence="등록되었습니다. 목록을 새로고침하면 확인할 수 있습니다."
                onClose={onClose}
            />
        );
    return (
        <div className={styles.postRegisterCover}>
            <div
                className={styles.postRegisterDialog}
                role="dialog"
                aria-modal="true"
                aria-label="포스팅 등록"
            >
                <div className={styles.postRegisterHeader}>
                    <h2>
                        <span className="material-icons" aria-hidden="true">
                            post_add
                        </span>
                        포스팅 등록
                    </h2>
                    {isLoading && (
                        <span
                            className={styles.loadingStatus}
                            role="status"
                            aria-label="작품 이미지 로딩 중"
                        >
                            <span
                                className={
                                    "material-icons " + styles.loadingIcon
                                }
                                aria-hidden="true"
                            >
                                hourglass_empty
                            </span>
                        </span>
                    )}
                    <button
                        type="button"
                        className={styles.closeIcon}
                        aria-label="닫기"
                        onClick={onClose}
                    >
                        <span className="material-icons" aria-hidden="true">
                            close
                        </span>
                    </button>
                </div>
                <div className={styles.registerBody}>
                    <label
                        className={
                            styles.imageMetadata + " " + styles.postTitle
                        }
                    >
                        포스팅 제목
                        <input
                            aria-label="포스팅 제목"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="제목 입력"
                        />
                    </label>
                    {entries.length > 0 && (
                        <section
                            className={styles.artworkPreview}
                            aria-label="이미지 정보 목록"
                        >
                            {entries.map((entry, index) => (
                                <div
                                    className={
                                        styles.imageGroup +
                                        " " +
                                        styles.registerImageGroup
                                    }
                                    key={entry.id}
                                >
                                    <button
                                        type="button"
                                        className={styles.removeImage}
                                        aria-label={
                                            "이미지 " + (index + 1) + " 삭제"
                                        }
                                        onClick={() => removeImage(entry.id)}
                                    >
                                        <span
                                            className="material-icons"
                                            aria-hidden="true"
                                        >
                                            remove
                                        </span>
                                    </button>
                                    {selectingId === entry.id ? (
                                        <div className={styles.imagePicker}>
                                            <label
                                                className={styles.yearSelection}
                                            >
                                                <select
                                                    aria-label="제작년도"
                                                    className={
                                                        styles.yearSelector
                                                    }
                                                    value={entry.year}
                                                    onChange={(event) =>
                                                        setEntries((prev) =>
                                                            prev.map((item) =>
                                                                item.id ===
                                                                entry.id
                                                                    ? {
                                                                          ...item,
                                                                          year: event
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {sortedDriveFiles.map(
                                                        (group) => (
                                                            <option
                                                                key={group.year}
                                                            >
                                                                {group.year}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                            <div
                                                className={styles.imageChoices}
                                            >
                                                {(
                                                    driveFiles.find(
                                                        (group) =>
                                                            group.year ===
                                                            entry.year,
                                                    )?.files ?? []
                                                )
                                                    .filter((file) =>
                                                        file.mimeType.startsWith(
                                                            "image/",
                                                        ),
                                                    )
                                                    .map((file) => (
                                                        <button
                                                            type="button"
                                                            key={file.id}
                                                            aria-label={
                                                                file.name
                                                            }
                                                            disabled={entries.some(
                                                                (other) =>
                                                                    other.id !==
                                                                        entry.id &&
                                                                    other.file
                                                                        ?.id ===
                                                                        file.id,
                                                            )}
                                                            onClick={() =>
                                                                selectImage(
                                                                    entry.id,
                                                                    file,
                                                                )
                                                            }
                                                        >
                                                            <span
                                                                className="material-icons"
                                                                aria-hidden="true"
                                                            >
                                                                done
                                                            </span>
                                                            <span>
                                                                {file.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                            {!driveFiles
                                                .find(
                                                    (group) =>
                                                        group.year ===
                                                        entry.year,
                                                )
                                                ?.files.some((file) =>
                                                    file.mimeType.startsWith(
                                                        "image/",
                                                    ),
                                                ) && (
                                                <p
                                                    className={
                                                        styles.selectionEmpty
                                                    }
                                                >
                                                    작품 없음
                                                </p>
                                            )}
                                            {entry.file && (
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.cancelImageSelection
                                                    }
                                                    onClick={() => {
                                                        setEntries((prev) =>
                                                            prev.map((item) =>
                                                                item.id ===
                                                                entry.id
                                                                    ? {
                                                                          ...item,
                                                                          year:
                                                                              driveFiles.find(
                                                                                  (
                                                                                      group,
                                                                                  ) =>
                                                                                      group.files.some(
                                                                                          (
                                                                                              file,
                                                                                          ) =>
                                                                                              file.id ===
                                                                                              item
                                                                                                  .file
                                                                                                  ?.id,
                                                                                      ),
                                                                              )
                                                                                  ?.year ??
                                                                              item.year,
                                                                      }
                                                                    : item,
                                                            ),
                                                        );
                                                        setSelectingId(null);
                                                    }}
                                                >
                                                    선택 취소
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        entry.file && (
                                            <>
                                                <div
                                                    className={
                                                        styles.reselectPreview
                                                    }
                                                >
                                                    <ArtworkPreview
                                                        file={entry.file}
                                                        onSettled={
                                                            handleSettled
                                                        }
                                                    />
                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.reselectImage
                                                        }
                                                        onClick={() =>
                                                            setSelectingId(
                                                                entry.id,
                                                            )
                                                        }
                                                    >
                                                        다시 선택
                                                    </button>
                                                </div>
                                                <ImageMetadataFields
                                                    label={
                                                        "이미지 " + (index + 1)
                                                    }
                                                    value={entry.metadata}
                                                    disabled={false}
                                                    onChange={(metadata) =>
                                                        setEntries((prev) =>
                                                            prev.map((item) =>
                                                                item.id ===
                                                                entry.id
                                                                    ? {
                                                                          ...item,
                                                                          metadata,
                                                                      }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </>
                                        )
                                    )}
                                </div>
                            ))}
                        </section>
                    )}
                    <button
                        type="button"
                        className={styles.addImage}
                        aria-label="이미지 추가"
                        disabled={
                            selectingId !== null ||
                            !sortedDriveFiles.length ||
                            entries.length >= MAX_POST_IMAGES
                        }
                        onClick={addImage}
                    >
                        <span
                            className="material-icons-outlined"
                            aria-hidden="true"
                        >
                            add_photo_alternate
                        </span>
                        <span>작품사진 추가</span>
                    </button>
                    <label
                        className={
                            styles.imageMetadata +
                            " " +
                            styles.additionalDescription
                        }
                    >
                        추가 부연설명
                        <textarea
                            value={additionalDescription}
                            onChange={(event) =>
                                setAdditionalDescription(event.target.value)
                            }
                            placeholder="추가 부연설명을 입력하세요."
                        />
                    </label>
                    <label className={styles.publishCheckbox}>
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(event) =>
                                setPublished(event.target.checked)
                            }
                        />
                        <span
                            className={styles.publishCheckIcon}
                            aria-hidden="true"
                        >
                            <span className="material-icons">done</span>
                        </span>
                        이 포스팅을 바로 공개합니다
                    </label>
                    {feedback && (
                        <p className={styles.error} role="alert">
                            {feedback}
                        </p>
                    )}
                </div>
                <div className={styles.registerFooter}>
                    <button
                        type="button"
                        className={styles.registerPost}
                        disabled={!canSave}
                        onClick={handleRegister}
                    >
                        등록
                    </button>
                </div>
            </div>
        </div>
    );
}
