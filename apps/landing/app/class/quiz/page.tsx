"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface QuestionData {
  id: string;
  text: string;
  options: string[];
  timeLimit: number;
  category: string;
}

interface ProgressData {
  current: number;
  total: number;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const level = searchParams.get("level");

  const INITIAL_TIME = 30 * 60;

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [progress, setProgress] = useState<ProgressData>({ current: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);

  useEffect(() => {
    if (studentId && level) {
      fetchQuestion();
    }
  }, [studentId, level]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isSubmitting) {
          handleFinish();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting]); 

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")} : ${s
      .toString()
      .padStart(2, "0")}`;
  };

  const fetchQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/test/question/${level}/${studentId}`);
      const data = await res.json();

      if (data.success) {
        setQuestion(data.data.question);
        setProgress(data.data.progress);
        if (data.data.timeLeft !== undefined) {
          setTimeLeft(data.data.timeLeft);
        }
        setSelectedAnswer(null);
      } else {
        setError(data.error || "Gagal memuat soal.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !question || !studentId) return;

    setIsSubmitting(true);
    try {
      const submitRes = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          questionId: question.id,
          selectedValue: selectedAnswer,
        }),
      });
      const submitData = await submitRes.json();

      if (!submitData.success) {
        throw new Error(submitData.error || "Gagal mengirim jawaban.");
      }

      if (progress.current >= progress.total) {
        await handleFinish();
      } else {
        await fetchQuestion();
      }
    } catch (err: any) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    try {
      const res = await fetch("/api/test/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      
      if (data.success) {
          router.push(`/class/result?studentId=${studentId}`);
      } else {
           router.push(`/class/result?studentId=${studentId}`);
      }
    } catch (err) {
      console.error("Finish error:", err);
      router.push(`/class/result?studentId=${studentId}`);
    }
  };

  const getLabeledOptions = (options: string[]) => {
    const labels = ["A", "B", "C", "D"]; 
    return options.map((text, index) => ({
      label: labels[index] || "?",
      text,
    }));
  };

  if (!studentId || !level) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan. Silakan login ulang.</div>;
  }

  if (isLoading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-base"></div>
            <p className="text-gray-500">Memuat soal {level}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="p-10 text-center text-red-600">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button onClick={fetchQuestion} className="mt-4 text-blue-500 underline">Coba Lagi</button>
        </div>
    )
  }

  if (!question) return null;

  const labeledOptions = getLabeledOptions(question.options);

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="p-6 bg-basic/60 shadow-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-gray-900 font-mono tracking-wider">
             {formatTime(timeLeft)}
          </h2>

          <span className="text-sm font-bold text-gray-600">
            Soal {progress.current} dari {progress.total}
          </span>
        </div>

        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-base transition-all duration-300 ease-out"
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-basic/60 shadow-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          <p className="text-sm font-bold text-gray-500 mb-2 uppercase">
            {question.category}
          </p>

          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
            {question.text}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labeledOptions.map((opt) => {
              const isSelected = selectedAnswer === opt.text; 
              return (
                <button
                  key={opt.label}
                  onClick={() => setSelectedAnswer(opt.text)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group
                    ${
                      isSelected
                        ? "border-primary-base bg-blue-50/50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }
                  `}
                >
                  <div
                    className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border transition-colors
                    ${
                      isSelected
                        ? "bg-primary-base text-white border-primary-base"
                        : "bg-gray-100 text-gray-500 border-gray-200 group-hover:border-blue-300"
                    }
                  `}
                  >
                    {opt.label}
                  </div>

                  <span
                    className={`font-medium ${
                      isSelected ? "text-blue-900" : "text-gray-700"
                    }`}
                  >
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end items-center bg-white/40">
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className={`
                bg-primary-base hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95
                ${(!selectedAnswer || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSubmitting ? "Memproses..." : (progress.current === progress.total ? "Selesai" : "Selanjutnya")}
            {!isSubmitting &&  <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.25 12C3.25 11.8011 3.32902 11.6103 3.46967 11.4697C3.61032 11.329 3.80109 11.25 4 11.25H13.25V12.75H4C3.80109 12.75 3.61032 12.671 3.46967 12.5303C3.32902 12.3897 3.25 12.1989 3.25 12Z"
                  fill="#F4F7FE"
                />
                <path
                  d="M13.25 12.7498V17.9998C13.2501 18.1481 13.2942 18.2929 13.3766 18.4162C13.459 18.5394 13.5761 18.6354 13.7131 18.6921C13.85 18.7488 14.0007 18.7637 14.1461 18.7348C14.2915 18.7059 14.4251 18.6346 14.53 18.5298L20.53 12.5298C20.6705 12.3892 20.7493 12.1986 20.7493 11.9998C20.7493 11.8011 20.6705 11.6105 20.53 11.4698L14.53 5.46983C14.4251 5.36507 14.2915 5.29375 14.1461 5.26486C14.0007 5.23598 13.85 5.25083 13.7131 5.30754C13.5761 5.36425 13.459 5.46028 13.3766 5.5835C13.2942 5.70671 13.2501 5.85159 13.25 5.99983V12.7498Z"
                  fill="#F4F7FE"
                />
              </svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizContent />
        </Suspense>
    )
}
