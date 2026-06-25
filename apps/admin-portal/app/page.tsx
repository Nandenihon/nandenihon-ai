"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./components/LoginForm";

export default function HomePage() {
    const router = useRouter();
    const [loginError, setLoginError] = useState("");

    const handleLogin = async (email: string, password: string) => {
        setLoginError("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setLoginError(data.error || "Login gagal. Periksa email dan password Anda.");
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setLoginError("Terjadi kesalahan jaringan. Coba lagi.");
        }
    };

    return <LoginForm onLogin={handleLogin} externalError={loginError} />;
}
