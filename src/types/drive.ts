export type DriveFile = { //Google Drive 파일 한 장
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    thumbnailLink: string;
};

export type DriveYearGroup = { //DriveYearGroup
    year: string;
    files: DriveFile[];
};