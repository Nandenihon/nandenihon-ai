import { headers } from "next/headers";
import StudentNavbar from "../components/StudentNavbar";
import StudentSidebar from "../components/StudentSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const role = headersList.get("x-user-role") === "pre_student" ? "pre_student" : "student";

    return (
        <div className="student-shell min-h-screen lg:flex">
            <StudentSidebar role={role} />
            <div className="min-w-0 flex-1 pb-24 lg:pb-0">
                <StudentNavbar />
                <main>{children}</main>
            </div>
        </div>
    );
}
