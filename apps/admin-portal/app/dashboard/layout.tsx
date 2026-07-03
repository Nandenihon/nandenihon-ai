"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-neutral-10 overflow-x-hidden relative">
            {/* Sidebar container */}
            <div
                className={`fixed inset-y-0 left-0 w-[260px] z-30 transform transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <DashboardSidebar />
            </div>

            {/* Mobile backdrop overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-neutral-90/40 z-20 lg:hidden"
                />
            )}

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px] transition-all duration-300">
                <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
