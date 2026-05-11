import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import Menu from "./components/Menu";

function Layout() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <div className=" flex w-full justify-center">
                <div className="relative w-full max-w-325">
                    <Menu />
                    <Outlet />
                </div>
            </div>
        </>
    );
}

export default Layout;
