import Link from "next/link";

export const metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-40 pb-24 text-center">
      <p className="text-6xl font-bold text-primary-base">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 lg:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-gray-600">
        Halaman yang kamu cari mungkin sudah dipindahkan atau alamatnya salah ketik.
      </p>
      <p className="mt-1 text-sm text-gray-500" lang="en">The page you are looking for could not be found.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn justify-center">Kembali ke Beranda</Link>
        <Link href="/article" className="btn justify-center bg-white text-primary-base border border-primary-base">Lihat Artikel</Link>
      </div>
    </section>
  );
}
