"use client";

import { useState } from "react";
import type { Post } from "@/__types/artwork";
import type { DriveYearGroup, DriveFile } from "@/__types/drive";
import styles from "@/__cssModules/admin/postRegister.module.css";

type Props = {
    driveFiles:DriveYearGroup[];
    onClose: () => void;
};
export default function postRegister({ driveFiles, onClose }: Props) {
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [sizeUnit, setSizeUnit] = useState('mm')
    const [medium, setMedium] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedYear, setSelectedYear] = useState(
        driveFiles[0]?.year ?? ""
    );
    const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFile[]>([]);
    const handleDriveFileCheck = (file: DriveFile, checked: boolean) => {
        setSelectedDriveFiles((prev) =>
            checked ? [...prev, file] : prev.filter((item) => item.id !== file.id)
        );
    };
    const selectedYearGroup = driveFiles.find(
        (item) => item.year === selectedYear
    );
    const handleRegister = async () => {
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
        };
        
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(post),
        });
        const result = await response.json();
        console.log(result);
    };
    return (
        <div className={styles.postRegisterCover}>
            <div className={styles.postRegisterDialog}>
                <div className={styles.postRegisterHeader}>
                    <h2>포스팅 등록</h2>
                    <button onClick={onClose}>닫기</button> 
                </div>
                <div className={styles.textInfo}>
                    <input type="text" 
                        value={title} 
                        onChange={(e)=> setTitle(e.target.value)} 
                        placeholder={'제목 입력'}
                    />
                    <br/>
                    <textarea value={description} 
                        onChange={(e)=> setDescription(e.target.value)} 
                        placeholder={'설명 입력'}
                    />
                </div>
                <div className={styles.imgSelection}>
                    <select id="yearSelector" className={styles.yearSelector} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        {driveFiles.map((item) => (
                            <option key={item.year}>
                                {item.year}
                            </option>
                        ))}
                    </select>
                    <div className={styles.fileList}>
                        {selectedYearGroup?.files.map((file) => (
                            <div key={file.id}>
                                <input
                                    id={file.id}
                                    className={styles.fileCheckbox}
                                    name="files"
                                    type="checkbox"
                                    onChange={(e) => handleDriveFileCheck(file, e.target.checked)}
                                />

                                <label htmlFor={file.id}>
                                    {file.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <ul>
                    <li className={styles.postEditMedium}>
                        <input type="text" placeholder="재료" value={medium} onChange={(e) => setMedium(e.target.value)}/>
                    </li>
                    <li className={styles.postEditSize}>
                        <input type="text" placeholder="가로" value={width} onChange={(e) => setWidth(Number(e.target.value))}/>
                        <span>X</span>
                        <input type="text" placeholder="세로" value={height} onChange={(e) => setHeight(Number(e.target.value))}/>
                        <select name="size-unit" id="size-unit" value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="px">px</option>
                        </select>
                    </li>
                </ul>
                <button className={styles.registerPost} type="button" onClick={handleRegister}>등록</button>
            </div>
        </div>
    );
}