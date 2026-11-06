"use client";
import styles from "@/__cssModules/admin/postForm.module.css";
export type ImageMetadata = {
    description: string;
    medium: string;
    width: number;
    height: number;
    sizeUnit: string;
};
export default function ImageMetadataFields({
    label,
    value,
    disabled,
    onChange,
}: {
    label: string;
    value: ImageMetadata;
    disabled: boolean;
    onChange: (value: ImageMetadata) => void;
}) {
    return (
        <fieldset
            className={styles.imageMetadata}
            disabled={disabled}
            aria-label={label}
        >
            <label>
                설명
                <textarea
                    value={value.description}
                    placeholder="설명을 입력하세요."
                    onChange={(e) =>
                        onChange({ ...value, description: e.target.value })
                    }
                />
            </label>
            <label className={styles.materialRow}>
                재료
                <input
                    value={value.medium}
                    placeholder="재료"
                    onChange={(e) =>
                        onChange({ ...value, medium: e.target.value })
                    }
                />
            </label>
            <div className={styles.imageSize}>
                <span>크기</span>
                <input
                    aria-label="가로"
                    type="number"
                    min="0"
                    value={value.width || ""}
                    onChange={(e) =>
                        onChange({
                            ...value,
                            width: Number(e.target.value),
                        })
                    }
                />
                <span aria-hidden="true">X</span>
                <input
                    aria-label="세로"
                    type="number"
                    min="0"
                    value={value.height || ""}
                    onChange={(e) =>
                        onChange({
                            ...value,
                            height: Number(e.target.value),
                        })
                    }
                />
                <label className={styles.unitRow}>
                    단위
                    <select
                        aria-label="단위"
                        value={value.sizeUnit}
                        onChange={(e) =>
                            onChange({ ...value, sizeUnit: e.target.value })
                        }
                    >
                        <option>mm</option>
                        <option>cm</option>
                        <option>px</option>
                    </select>
                </label>
            </div>
        </fieldset>
    );
}
