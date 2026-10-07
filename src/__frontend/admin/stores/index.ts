import { create } from "zustand";
import type { Artwork } from "@/types/artwork";
import type { DriveFile, DriveYearGroup } from "@/types/drive";



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
    loadAdminData:() => void
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
    loadAdminData: async () => {
        // 관리자 화면에 필요한 초기 데이터를 서버에서 조회
        const response = await fetch("/api/admin/artworks");

        // 서버에서 반환한 작품 목록과 Drive 파일 목록
        const data = await response.json();

        set({
            artworks: data.artworks,
            driveFiles: data.driveFiles,
            selectedYear: data.driveFiles[0]?.year ?? "",
        });
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