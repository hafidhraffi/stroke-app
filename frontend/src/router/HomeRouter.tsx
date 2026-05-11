import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";
import DoctorHomePage from "../pages/doctor_page/LogPage"
import UserHomePage from "../pages/user_page/LogPage"
import AdminHomePage from "../pages/admin_page/LogPage"
import { Navigate } from "react-router";

export default function HomeRouter() {
    const { currentRole } = useContext(RoleContext)!;

    if (currentRole === "doctor") {
        return <DoctorHomePage />;
    }

    if (currentRole === "user") {
        return <UserHomePage />;
    }

    if (currentRole === "admin") {
        return <AdminHomePage />;
    }

    return <Navigate to="/login" replace />
}