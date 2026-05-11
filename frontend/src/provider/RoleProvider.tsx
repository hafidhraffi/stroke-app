import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { RoleContext } from "../context/RoleContext";

export type TokenPayload = {
    sub: string;
    user_id: number;
    role: string;
}

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentRole, setCurrentRole] = useState<string | null>(() => {
        const token = localStorage.getItem("token")

        if (!token) return null

        try {
            const payload = jwtDecode<TokenPayload>(token)
            return payload.role
        } catch {
            return null
        }
    })

    return (
        <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
            {children}
        </RoleContext.Provider>
    );
};
