import { redirect } from "next/navigation";
import { Analytics } from '@vercel/analytics/next';


// Root "/" is handled by middleware:
// - logged-in students → /dashboard
// - everyone else     → /login
export default function RootPage() {
    redirect("/login");
    <Analytics />
}

