"use client";

import { useCallback, useEffect, useState } from "react";
import type { DriveYearGroup, DriveFile } from "@/__types/drive";
import styles from "@/__cssModules/admin/postForm.module.css";

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

function ArtworkOption({
    file,
    selected,
    disabled,
    onChange,
}: {
    file: DriveFile;
    selected: boolean;
    disabled: boolean;
    onChange: (file: DriveFile, checked: boolean) => void;
}) {
    return (
        <div>
            <input
                id={`drive-${file.id}`}
                className={styles.fileCheckbox}
                name="files"
                type="checkbox"
                aria-label={`${file.name} 선택`}
                checked={selected}
                disabled={disabled}
                onChange={(event) => onChange(file, event.target.checked)}
            />
            <label htmlFor={`drive-${file.id}`} title={file.name}>
                <span className={styles.fileCheck} aria-hidden="true">
                    <span className="material-icons">done</span>
                </span>
                <span className={styles.fileName}>{file.name}</span>
            </label>
        </div>
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

export default function PostRegister({ driveFiles, onClose }: Props) {
    const sortedDriveFiles = [...driveFiles].sort((a, b) => {
        const aBefore = /^before\s*2012$/i.test(a.year.trim());
        const bBefore = /^before\s*2012$/i.test(b.year.trim());
        return (
            Number(aBefore) - Number(bBefore) ||
            b.year.localeCompare(a.year, undefined, { numeric: true })
        );
    });
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [sizeUnit, setSizeUnit] = useState("mm");
    const [medium, setMedium] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [published, setPublished] = useState(false);
    const [selectedYear, setSelectedYear] = useState(
        sortedDriveFiles[0]?.year ?? "",
    );
    const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFile[]>(
        [],
    );
    const handleDriveFileCheck = (file: DriveFile, checked: boolean) => {
        setSettledIds((prev) => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
        });
        setSelectedDriveFiles((prev) =>
            checked
                ? [...prev, file]
                : prev.filter((item) => item.id !== file.id),
        );
    };
    const selectedYearGroup = driveFiles.find(
        (item) => item.year === selectedYear,
    );
    const [settledIds, setSettledIds] = useState<Set<string>>(() => new Set());
    const handleSettled = useCallback((id: string) => {
        setSettledIds((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    }, []);
    const isLoading = selectedDriveFiles.some(
        (file) => !settledIds.has(file.id),
    );
    const inputsDisabled = isLoading || isSaving || isSuccess;
    const handleRegister = async () => {
        if (inputsDisabled) return;
        setIsSaving(true);
        setFeedback("");
        setIsSuccess(false);
        try {
            // 서버에 전달할 작품 등록 데이터
            const post = {
                year: selectedYear,
                title,
                description,
                medium,
                width,
                height,
                sizeUnit,
                images: selectedDriveFiles,
                published,
            };

            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(post),
            });
            const result = await response.json();
            if (!response.ok || !result.success)
                throw new Error(
                    result.message ||
                        "등록하지 못했습니다. 다시 시도해 주세요.",
                );
            setIsSuccess(true);
            setFeedback(
                "등록되었습니다. 목록을 새로고침하면 확인할 수 있습니다.",
            );
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
                                className={`material-icons ${styles.loadingIcon}`}
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
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        <span className="material-icons" aria-hidden="true">
                            close
                        </span>
                    </button>
                </div>
                <div className={styles.registerBody}>
                    <div className={styles.yearSelection}>
                        <select
                            aria-label="제작년도"
                            id="yearSelector"
                            className={styles.yearSelector}
                            value={selectedYear}
                            disabled={isSaving}
                            onChange={(event) =>
                                setSelectedYear(event.target.value)
                            }
                        >
                            {sortedDriveFiles.map((item) => (
                                <option key={item.year}>{item.year}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.imgSelection} aria-busy={isLoading}>
                        <div className={styles.fileList} key={selectedYear}>
                            {selectedYearGroup?.files.map((file) => (
                                <ArtworkOption
                                    key={file.id}
                                    file={file}
                                    selected={selectedDriveFiles.some(
                                        (item) => item.id === file.id,
                                    )}
                                    disabled={inputsDisabled}
                                    onChange={handleDriveFileCheck}
                                />
                            ))}
                        </div>
                        {!selectedYearGroup?.files.length && (
                            <p className={styles.selectionEmpty}>작품 없음</p>
                        )}
                    </div>
                    <section
                        className={styles.artworkPreview}
                        aria-label="작품 미리보기"
                        aria-busy={isLoading}
                    >
                        {selectedDriveFiles.length ? (
                            selectedDriveFiles.map((file) => (
                                <ArtworkPreview
                                    key={file.id}
                                    file={file}
                                    onSettled={handleSettled}
                                />
                            ))
                        ) : (
                            <p className={styles.selectionEmpty}>
                                이미지를 선택해주세요.
                            </p>
                        )}
                    </section>
                    <fieldset
                        className={styles.registerFields}
                        disabled={inputsDisabled}
                    >
                        <div className={styles.textInfo}>
                            <input
                                type="text"
                                aria-label="제목"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={"제목 입력"}
                            />
                            <br />
                            <textarea
                                value={description}
                                aria-label="설명"
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={"설명 입력"}
                            />
                        </div>
                        <ul>
                            <li className={styles.postEditMedium}>
                                <input
                                    type="text"
                                    placeholder="재료"
                                    value={medium}
                                    onChange={(e) => setMedium(e.target.value)}
                                />
                            </li>
                            <li className={styles.postEditSize}>
                                <input
                                    type="text"
                                    placeholder="가로"
                                    value={width}
                                    onChange={(e) =>
                                        setWidth(Number(e.target.value))
                                    }
                                />
                                <span>X</span>
                                <input
                                    type="text"
                                    placeholder="세로"
                                    value={height}
                                    onChange={(e) =>
                                        setHeight(Number(e.target.value))
                                    }
                                />
                                <select
                                    name="size-unit"
                                    id="size-unit"
                                    value={sizeUnit}
                                    onChange={(e) =>
                                        setSizeUnit(e.target.value)
                                    }
                                >
                                    <option value="mm">mm</option>
                                    <option value="cm">cm</option>
                                    <option value="px">px</option>
                                </select>
                            </li>
                        </ul>
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
                    </fieldset>
                    {feedback && (
                        <p
                            className={
                                isSuccess ? styles.success : styles.error
                            }
                            role={isSuccess ? "status" : "alert"}
                        >
                            {feedback}
                        </p>
                    )}
                </div>
                <div className={styles.registerFooter}>
                    <button
                        className={styles.registerPost}
                        disabled={inputsDisabled}
                        type="button"
                        onClick={handleRegister}
                    >
                        {isSaving
                            ? "등록 중…"
                            : isSuccess
                              ? "등록 완료"
                              : "등록"}
                    </button>
                </div>
            </div>
        </div>
    );
}
