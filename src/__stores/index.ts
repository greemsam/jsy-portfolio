import { create } from "zustand";
import type { Post } from "@/__types/artwork";
import type { DriveFile, DriveYearGroup } from "@/__types/drive";



type AdminStore = {
    // Firestore에 등록된 작품
    posts: Post[];

    // Google Drive에서 가져온 연도별 원본 파일
    driveFiles: DriveYearGroup[];

    // 등록 폼 상태
    selectedYear: string;
    selectedDriveFiles: DriveFile[];
    title: string;
    description: string;
    medium:string

    // actions
    setPosts: (post: Post[]) => void;
    setDriveFiles: (driveFiles: DriveYearGroup[]) => void;

    setSelectedYear: (year: string) => void;
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    setMedium : (medium: string) => void
    loadPosts:() => void
    handleDriveFileCheck: (
        file: DriveFile,
        checked: boolean
    ) => void;

    resetRegisterForm: () => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
    posts: [],
    driveFiles: [],

    selectedYear: "",
    selectedDriveFiles: [],
    title: "",
    description: "",
    medium:"",
    setPosts: (posts) => set({ posts }),
    setDriveFiles: (driveFiles) => set({ driveFiles, selectedYear: driveFiles[0]?.year ?? "",}),
    setSelectedYear: (selectedYear) => set({ selectedYear }),
    setTitle: (title) => set({ title }),
    setDescription: (description) => set({ description }),
    setMedium: (medium) => set({ medium }),
    loadPosts: async () => {
        // 브라우저에서는 backend service에 직접 접근할 수 없으므로 API 호출
        const response = await fetch("/api/posts");
        const posts = await response.json();

        set({ posts });
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