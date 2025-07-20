"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MainNav from "./custom/Navbar";
import Footer from "./custom/Footer";

// Main client layout component that handles navigation for non-dashboard routes
export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Routes that should hide navigation and footer completely
    const hideNavAndFooter = pathname === "/kyb-form" ||
                            pathname === "/sign-in" ||
                            pathname === "/sign-up" ||
                            pathname.includes("/seller") ||
                            pathname.includes("/buyer") ||
                            pathname.includes("/logistics");
    
    // If it's a dashboard route, just return children (handled by dedicated layouts)
    if (pathname.includes("/seller") || pathname.includes("/buyer") || pathname.includes("/logistics")) {
        return <>{children}</>;
    }

    return (
        <div className="relative flex min-h-screen flex-col">
            {!hideNavAndFooter && <MainNav />}
            <main className="flex-1">
                {children}
            </main>
            <div className="mt-6">
                {!hideNavAndFooter && <Footer />}
            </div>
        </div>
    );
}
