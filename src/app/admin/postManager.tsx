'use client'
import { useState } from "react";
import PostLists from './postLists'
import PostRegister from "./postRegister";
import type { ArtInfoFromGoogleDrive,  DriveFile} from "@/types/artwork"
export default function postManager({ data }:{data:ArtInfoFromGoogleDrive[]}) {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    return (
        <div>
            <PostLists data={[]} onRegister={() => setIsRegisterOpen(true)}/>
            {isRegisterOpen && (
                <PostRegister 
                    data={data}
                    onClose={() => setIsRegisterOpen(false)}
                />
            )}
        </div>
    )
}