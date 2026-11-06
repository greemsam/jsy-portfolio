export const MAX_POST_IMAGES = 4;

export type ArtworkImage = {
    description?: string;
    caption?: string;
    medium?: string;
    width?: number;
    height?: number;
    sizeUnit?: string;
    driveFileId: string;
    thumbnailPath: string;
    displayPath: string;
    thumbnailUrl: string;
    displayUrl?: string;
};

export type Post = {
    postId: string;
    year: string;
    title: string;
    description: string;
    additionalDescription: string;
    medium: string;
    width: number;
    height: number;
    sizeUnit: string;
    tags: string[];
    images: ArtworkImage[];
    published: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};
