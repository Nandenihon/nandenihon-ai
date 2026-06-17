"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

// Reuse ResultData interface if we want strict typing or define locally
interface ResultData {
  score: number;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const totalQuestions = 25;
  const POINTS_PER_QUESTION = 4; // Assuming this constant

  useEffect(() => {
    if (studentId) {
      const fetchScore = async () => {
        try {
            const res = await fetch(`/api/student/result/${studentId}`);
            const data = await res.json();
            if (data.success) {
                // Calculate correct count from score
                const calculatedCorrect = Math.floor(data.data.score / POINTS_PER_QUESTION);
                setCorrectCount(calculatedCorrect);
            }
        } catch (error) {
            console.error("Failed to fetch score", error);
        }
      };
      
      fetchScore();
    }
  }, [studentId]);

  return (
    <div className="w-full flex justify-center">
      <div className="bg-basic/60 rounded-2xl text-black p-8 md:p-12 max-w-2xl w-full text-center flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Selamat Atas Hasil Testnya!</h1>

        <p className="text-gray-700 font-medium mb-8 max-w-md leading-relaxed text-base">
          <span className="font-bold text-black">Kamu lulus dengan skor {correctCount !== null ? correctCount : "-"} / {totalQuestions}</span>
          <br />
          Silakan lakukan pembayaran komitmen fee agar dapat melanjutkan ke
          pembagian kelas.
        </p>

        <div className="w-full max-w-sm aspect-square bg-gray-300 rounded-lg flex items-center justify-center mb-8 relative overflow-hidden group">
          <Image src="/images/qris.png" alt="qris-nandenihon" width={400} height={100} />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white font-medium">Scan Code Ini</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 font-medium mb-6">
          Lakukan pembayaran melalui QRIS di atas, lalu upload bukti pembayaran
          pada link dibawah
        </p>

        <Link
          className="
            flex items-center gap-2 px-6 py-3 
            bg-white border-2 border-primary-base 
            text-primary-base font-bold rounded-lg 
            hover:bg-blue-50 transition-all 
            shadow-sm hover:shadow-md active:scale-95
          "
          href={`/class/confirm?studentId=${studentId}`}
        >
          <span>Upload Bukti Pembayaran</span>
          <Upload className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentContent />
        </Suspense>
    )
}
