export type DriveFile = {
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