"use client";

import { useRef, useState } from "react";
import type { Post } from "@/__types/artwork";
import LatestArtwork, { type Candidate } from "./latestArtwork";
import ArtworkList from "./artworkList";
import styles from "@/__cssModules/service/artworkGallery.module.css";

export default function ArtworkGallery({
    years,
    candidates,
}: {
    years: string[];
    candidates: Candidate[];
}) {
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [cache, setCache] = useState<Record<string, Post[]>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const pending = useRef(new Set<string>());
    const selectYear = async (year: string) => {
        setSelectedYear(year);
        if (cache[year] || pending.current.has(year)) return;
        pending.current.add(year);
        setErrors((previous) => ({ ...previous, [year]: "" }));
        try {
            const response = await fetch(
                `/api/posts/published?year=${encodeURIComponent(year)}`,
            );
            if (!response.ok) throw new Error("Failed to load artworks");
            const posts: Post[] = await response.json();
            setCache((previous) => ({ ...previous, [year]: posts }));
        } catch {
            setErrors((previous) => ({
                ...previous,
                [year]: "작품 목록을 불러오지 못했습니다.",
            }));
        } finally {
            pending.current.delete(year);
        }
    };

    return (
        <div className={styles.gallery}>
            <nav className={styles.years} aria-label="작품 연도 선택">
                <button
                    type="button"
                    aria-pressed={selectedYear === null}
                    onClick={() => setSelectedYear(null)}
                >
                    최신작
                </button>
                {years.map((year) => (
                    <button
                        key={year}
                        type="button"
                        aria-pressed={selectedYear === year}
                        onClick={() => void selectYear(year)}
                    >
                        {year}
                    </button>
                ))}
            </nav>
            <div className={styles.content}>
                {selectedYear === null ? (
                    <LatestArtwork candidates={candidates} />
                ) : errors[selectedYear] ? (
                    <div className={styles.list} role="alert">
                        <p>{errors[selectedYear]}</p>
                        <button
                            type="button"
                            onClick={() => void selectYear(selectedYear)}
                        >
                            다시 시도
                        </button>
                    </div>
                ) : cache[selectedYear] ? (
                    <ArtworkList
                        year={selectedYear}
                        posts={cache[selectedYear]}
                    />
                ) : (
                    <p className={styles.list} role="status">
                        작품을 불러오는 중입니다.
                    </p>
                )}
            </div>
        </div>
    );
}
