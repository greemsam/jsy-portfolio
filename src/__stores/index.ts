import { create } from "zustand";
import type { Artwork } from "@/__types/artwork";
import type { DriveFile, DriveYearGroup } from "@/__types/drive";



type AdminStore = {
    // Firestore에 등록된 작품
    artworks: Artwork[];

    // Google Drive에서 가져온 연도별 원본 파일
    driveFiles: DriveYearGroup[];

    // 등록 폼 상태
    selectedYear: string;
    selectedDriveFiles: DriveFile[];
    title: string;
    description: string;

    // actions
    setArtworks: (artworks: Artwork[]) => void;
    setDriveFiles: (driveFiles: DriveYearGroup[]) => void;

    setSelectedYear: (year: string) => void;
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    loadArtworks:() => void
    handleDriveFileCheck: (
        file: DriveFile,
        checked: boolean
    ) => void;

    resetRegisterForm: () => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
    artworks: [],
    driveFiles: [],

    selectedYear: "",
    selectedDriveFiles: [],
    title: "",
    description: "",

    setArtworks: (artworks) => set({ artworks }),
    setDriveFiles: (driveFiles) => set({ driveFiles, selectedYear: driveFiles[0]?.year ?? "",}),
    setSelectedYear: (selectedYear) => set({ selectedYear }),
    setTitle: (title) => set({ title }),
    setDescription: (description) => set({ description }),
    loadArtworks: async () => {
        // 브라우저에서는 backend service에 직접 접근할 수 없으므로 API 호출
        const response = await fetch("/api/artworks");
        const artworks = await response.json();

        set({ artworks });
    },
    handleDriveFileCheck: (file, checked) =>
        set((state) => ({
            selectedDriveFiles: checked
                ? [...state.selectedDriveFiles, file]
                : state.selectedDriveFiles.filter(
                      (item) => item.id !== file.id
                  ),
        })),

    resetRegisterForm: () =>
        set({
            selectedDriveFiles: [],
            title: "",
            description: "",
        }),
}));