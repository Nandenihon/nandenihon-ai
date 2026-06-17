"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface ResultData {
  score: number;
  status: string;
  testStatus: string;
  registrationComplete: boolean;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchResult();
    }
  }, [studentId]);

  const fetchResult = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/result/${studentId}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Gagal memuat hasil.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  if (loading) return <div className="p-10 text-center text-primary-base italic">Memuat hasil...</div>;

  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  if (!result) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-basic/60 p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-white/50">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Hasil Tes</h1>

        <div className="mb-6">
          <div className="text-6xl font-black text-primary-base mb-2">{result.score}</div>
          <p className="text-gray-600 font-medium">Skor Akhir</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-white/50 rounded-xl">
            <span className="text-gray-500 text-sm">Status Kelulusan</span>
            <p className="text-xl font-bold capitalize text-gray-800">{result.status === 'passed' ? "LULUS" : "TIDAK LULUS"}</p>
          </div>
        </div>

        {result.status === 'passed' ? (
          <Link href={`/class/payment?studentId=${studentId}`}
            className="block w-full bg-primary-base hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Yuk, Gabung Kelas Sekarang
          </Link>
        ) : (
          <Link href={"/kelas"}
            className="block w-full bg-primary-base hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Kembali ke Halaman Kelas
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultContent />
    </Suspense>
  )
}
