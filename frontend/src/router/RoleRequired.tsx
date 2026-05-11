import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";
import { Navigate } from "react-router";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

function RoleRequired({ expectedRole, children }: { expectedRole: string; children: React.ReactNode }) {

    const { currentRole } = useContext(RoleContext)!

    if (!currentRole) {
        return <Navigate to="/login" replace />
    }

    if (currentRole != expectedRole) {
        return (
            <div className="flex flex-col items-center mt-20 gap-5">
                <div className="bg-red-100 border rounded-2xl w-fit border-red-500 text-2xl font-semibold px-10 py-14">Sorry, you do not have permission to access this page.</div>
                <button
                    className="border rounded pr-3 pl-1 py-2 hover:bg-gray-200 active:scale-95 cursor-pointer flex items-center"
                    onClick={() => history.back()}
                >
                    <ChevronLeftIcon className="h-6" />
                    Back
                </button>
            </div>
        )
    }

    return (
        children
    )
}

export default RoleRequired