import LecturerSidebar from "../../components/LecturerSidebar";
import DashboardHeader from "../../components/DashboardHeader";

export default function LecturerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-neutral-10">
            <LecturerSidebar />
            <div className="flex-1 flex flex-col ml-[260px]">
                <DashboardHeader />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
