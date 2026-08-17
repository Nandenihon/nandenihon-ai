import Link from "next/link";
import { getStudentPortalUrl } from "@/lib/studentPortal";

export default function RetiredFlowNotice() {
  const studentPortalUrl = getStudentPortalUrl();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="rounded-2xl bg-basic/60 p-8">
        <h1 className="text-2xl font-bold text-gray-900">Alur ini sudah tidak tersedia</h1>
        <p className="mt-3 text-sm font-medium text-gray-700">
          Pendaftaran dan tes penempatan sekarang dilakukan melalui Student Portal. Daftar akun di sana untuk
          melanjutkan.
        </p>
        <a
          href={`${studentPortalUrl}/register`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-base px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-blue-700"
        >
          Buka Student Portal
        </a>
        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-gray-500 underline">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
