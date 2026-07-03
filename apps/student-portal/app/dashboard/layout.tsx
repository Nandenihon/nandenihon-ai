import StudentNavbar from "../components/StudentNavbar";
import StudentSidebar from "../components/StudentSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-neutral-0 lg:flex">
            <StudentSidebar />
            <div className="min-w-0 flex-1">
                <StudentNavbar />
                <main>{children}</main>
            </div>
        </div>
    );
}
