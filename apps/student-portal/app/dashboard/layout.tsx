import StudentNavbar from "../components/StudentNavbar";
import StudentSidebar from "../components/StudentSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="student-shell min-h-screen lg:flex">
            <StudentSidebar />
            <div className="min-w-0 flex-1 pb-24 lg:pb-0">
                <StudentNavbar />
                <main>{children}</main>
            </div>
        </div>
    );
}
