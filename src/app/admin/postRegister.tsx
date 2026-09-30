"use client";

import { useState } from "react";
import styles from "./postRegister.module.css";
import type { ArtInfoFromGoogleDrive,  DriveFile} from "@/types/artwork"

export default function postRegister({ data, onClose }:{data:ArtInfoFromGoogleDrive[], onClose:()=>void}) {
    
    const [selectedYear, setSelectedYear] = useState(data[0]?.year)
    const [selectedImgFiles, setSelectedImgFiles] = useState<DriveFile[]>([])
    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    const handleImageCheck = (file: DriveFile, checked: boolean) => {
        if (checked) {
            setSelectedImgFiles((prev) => [...prev, file]);
        } else {
            setSelectedImgFiles((prev) =>
                prev.filter((item) => item.id !== file.id)
            );
        }
    };

    const handleRegister = () => {
        const artwork = {
            year: selectedYear,
            title,
            description,
            images: selectedImgFiles,
        };

        console.log(artwork);
    };
    const selectedData = data.find((item) => item.year === selectedYear);
    return (
        <div className={styles.postRegisterCover}>
            <div className={styles.postRegister}>
                <h2>작품 등록 <button onClick={onClose}>닫기</button> </h2>
                <select id="yearSelector" className={styles.yearSelector}>
                    {data.map((item) => (
                        <option key={item.year} onClick={() => setSelectedYear(item.year)}>
                            {item.year}
                        </option>
                    ))}
                </select>
                <div className={styles.fileList}>
                    {selectedData?.files.map((file) => (
                        <div className={styles.fileInfo} key={file.id}>
                            {file.id && (
                                <>
                                    <input id={file.id} 
                                        className={styles.fileCheckbox} 
                                        name={'files'}
                                        type="checkbox" 
                                        onChange={(e)=>handleImageCheck(file, e.target.checked)} 
                                    />
                                    <label htmlFor={file.id}>{file.name}</label>
                                </>
                            )}
                        </div>
                    ))}
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
                <button type="button" onClick={handleRegister}>등록</button>
            </div>
        </div>
    );
}