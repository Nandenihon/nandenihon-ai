import { redirect } from "next/navigation";

// Root "/" is handled by middleware:
// - logged-in students → /dashboard
// - everyone else     → /login
export default function RootPage() {
    redirect("/login");
}
