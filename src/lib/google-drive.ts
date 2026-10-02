import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

export const drive = google.drive({
    version: "v3",
    auth,
});

export async function getPortfolioYears() {
    const portfolioFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!portfolioFolderId) {
        throw new Error("GOOGLE_DRIVE_FOLDER_ID is not defined");
    }

    const files = await getDriveFiles(portfolioFolderId);

    return files.filter(
        (file) => file.mimeType === "application/vnd.google-apps.folder"
    );
}

export async function getAllDriveFiles() {
    const years = await getPortfolioYears();

    return Promise.all(
        years.map(async (year) => {
            if (!year.id) {
                return {
                    year: year.name ?? "",
                    files: [],
                };
            }

            const files = await getDriveFiles(year.id);

            return {
                year: year.name ?? "",
                files,
            };
        })
    );
}

export async function getDriveFiles(folderId: string) {
    const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, modifiedTime, thumbnailLink)",
        orderBy: "name",
    });

    return response.data.files ?? [];
}

export async function downloadDriveFile(fileId: string): Promise<Buffer> {
    const response = await drive.files.get(
        {
            fileId,
            alt: "media",
        },
        {
            responseType: "arraybuffer",
        }
    );

    return Buffer.from(response.data as ArrayBuffer);
}
