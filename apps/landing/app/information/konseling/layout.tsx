import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pendaftaran Konseling",
  description: "Daftar sesi konseling online bersama Nande Nihon.",
};

export default function KonselingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
