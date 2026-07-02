import StudentNavbar from "../components/StudentNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-neutral-0">
            <StudentNavbar />
            <main>{children}</main>
        </div>
    );
}
