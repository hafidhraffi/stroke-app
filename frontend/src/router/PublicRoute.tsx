import { useContext } from "react";
import { Navigate } from "react-router";
import { RoleContext } from "../context/RoleContext";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
    const { currentRole } = useContext(RoleContext)!;

    if (currentRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}