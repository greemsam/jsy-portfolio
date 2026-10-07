'use client'
import { useEffect } from 'react';
import { useAdminStore } from "@/__frontend/admin/stores";
import PostLists from './postLists'
import PostRegister from './postRegister';

export default function PostManager() {
    const loadAdminData = useAdminStore(
        (state) => state.loadAdminData
    );

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    return (
        <>
            <PostLists />
            <PostRegister />
        </>
    );
}