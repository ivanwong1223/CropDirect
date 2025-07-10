"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MainNav from "./custom/Navbar";
import SellerSidebar from "./custom/SellerSidebar";
import BuyerNavbar from "./custom/BuyerNavbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isCustomNav = pathname.includes("/donors") || pathname.includes("/organizations");
    const hideNavAndFooter = pathname === "/register" || pathname === "/login" || pathname === "/create-profile" || pathname === "/kyb-form";

    return (
        <div className="relative flex min-h-screen flex-col">
            {!hideNavAndFooter && (isCustomNav ? <SellerSidebar /> : <MainNav />)}
            <main className="flex-1">{children}</main>
            {!hideNavAndFooter && <BuyerNavbar />}
        </div>
    );
}
