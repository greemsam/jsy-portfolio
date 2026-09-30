import { google, drive_v3 } from "googleapis";

export type DriveFile = drive_v3.Schema$File
export type ArtInfoFromGoogleDrive = {
    year: string
    files: DriveFile[]
}

export type ArtworkSize = {
    width: number;
    height: number;
    unit: "mm" | "cm" | "px" | "inch";
};

export type ArtworkImage = {
    driveFileId: string;
    thumbnailUrl: string;
    displayUrl: string;
};

export type Artwork = {
    artId: string;
    year: string;
    title: string;
    description: string;
    medium: string;
    size: ArtworkSize | null;
    tags: string[];
    images: ArtworkImage[];
    published: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};