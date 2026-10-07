"use client";

import { useAdminStore } from "@/__stores";
import styles from "./postRegister.module.css";
type Props = {
    onClose: () => void;
};
export default function postRegister({ onClose }: Props) {
    const {
        driveFiles,
        selectedYear,
        selectedDriveFiles,
        title,
        description,
        setSelectedYear,
        setTitle,
        setDescription,
        handleDriveFileCheck,
    } = useAdminStore();
    const selectedYearGroup = driveFiles.find(
        (item) => item.year === selectedYear
    );
    const handleRegister = async () => {
        // 서버에 전달할 작품 등록 데이터
        const artwork = {
            year: selectedYear,
            title,
            description,
            images: selectedDriveFiles,
        };

        const response = await fetch("/api/artworks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(artwork),
        });

        const result = await response.json();

        console.log(result);
    };
    return (
        <div className={styles.postRegisterCover}>
            <div className={styles.postRegisterDialog}>
                <div className={styles.postRegisterHeader}>
                    <h2>작품 등록</h2>
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
                                    onChange={(e) =>
                                        handleDriveFileCheck(
                                            file,
                                            e.target.checked
                                        )
                                    }
                                />

                                <label htmlFor={file.id}>
                                    {file.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <input type="number" placeholder="제작년도" maxLength={4}/>
                    <input type="text" placeholder="재료"/>
                </div>
                <button className={styles.registerPost} type="button" onClick={handleRegister}>등록</button>
            </div>
        </div>
    );
}