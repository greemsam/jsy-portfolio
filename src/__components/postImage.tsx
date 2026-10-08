'use client';

import { useState } from 'react';
import styles from "@/__cssModules/admin/postImage.module.css";

export default function ImageWithDivFallback({ src, alt }:{src:string, alt:string}) {
    const [isError, setIsError] = useState(false);

    // 에러 발생 시 상태를 true로 변경하여 리렌더링 유도
    const handleError = () => setIsError(true);

    if (isError) {
        return (
            <div className={`${styles.postThumbnailWrapper} ${styles.noImg}`}>
                이미지 준비 중
            </div>
        );
    }

    return (
        <div className={styles.postThumbnailWrapper}>
            <img
                className={styles.postThumbnail}
                src={src}
                alt={alt}
                onError={handleError}
            />
        </div>

    );
}