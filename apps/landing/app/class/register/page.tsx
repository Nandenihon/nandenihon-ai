"use client";

import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

interface RegisterFormProps {
  name: string;
  email: string;
  japaneseLevel?: string;
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelRaw = searchParams.get("level");
  const level = levelRaw === "N4" || levelRaw === "N5" ? levelRaw : "N5";
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormProps>();

  const onSubmit = async (data: any) => {
    console.log('data:', data)
    setIsLoading(true);
    setApiError(null);

    try {
      // Step 1: Check if email already exists and get status
      const checkResponse = await fetch("/api/student/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          level: level,
        }),
      });

      if (!checkResponse.ok) {
        throw new Error("Terjadi kesalahan saat memeriksa email. Silakan coba lagi.");
      }

      const checkResult = await checkResponse.json();

      if (!checkResult.success) {
        throw new Error(checkResult.error || "Gagal memeriksa status email");
      }

      const emailStatus = checkResult.data;

      // Handle different email status scenarios
      if (emailStatus.exists) {
        if (emailStatus.status === "passed") {
          // Redirect to result page with studentId
          router.push(`/class/result?studentId=${emailStatus.studentId}`);
          return;
        }

        if (emailStatus.status === "failed") {
          setError("email", {
            type: "manual",
            message: "Hasil kuis anda sebelumnya gagal. Silakan menggunakan email lain jika ingin mengikuti kuis kembali.",
          });
          setApiError("Hasil kuis anda sebelumnya gagal. Silakan menggunakan email lain jika ingin mengikuti kuis kembali.");
          return;
        }

        if (emailStatus.status === "level_mismatch") {
          setError("email", {
            type: "manual",
            message: `Email ini sudah terdaftar di kelas ${emailStatus.registeredLevel}. Silakan gunakan email lain jika ingin mengambil kelas ini.`,
          });
          setApiError(`Email ini sudah terdaftar di kelas ${emailStatus.registeredLevel}. Silakan gunakan email lain jika ingin mengambil kelas ini.`);
          return;
        }

        // For in_progress status, allow retry (continue to registration)
      }

      // Step 2: Proceed with registration if email check passed
      const response = await fetch("/api/register/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          level: level,
          japaneseLevel: data.japaneseLevel,
        }),
      });

      const result = await response.json();
      console.log('regis:', result)

      if (!result.success) {
        if (result.error && result.error.includes("lulus kuis")) {
          setError("email", {
            type: "manual",
            message: result.error,
          });
          return;
        }
        throw new Error(result.error || "Gagal melakukan pendaftaran");
      }

      const studentId = result.data.studentId;
      router.push(`/class/quiz?studentId=${studentId}&level=${level}`);

    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setApiError("Terjadi kesalahan koneksi. Silakan periksa jaringan internet Anda dan coba lagi.");
      } else {
        setApiError(error.message || "Terjadi kesalahan pada server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-10 max-w-3xl mx-auto">
        <div className="bg-basic/60 p-6 rounded-2xl flex flex-col gap-2 items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Formulir Pendaftaran Siswa Baru Kelas {level}
          </h1>
          <p className="text-gray-600 font-medium">
            Silakan Isi data diri Berikut untuk melanjutkan pendaftaran
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-basic/60 p-6 rounded-2xl space-y-6"
        >
          {apiError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error!</span> {apiError}
            </div>
          )}

          <FormInput
            label="Nama Lengkap"
            placeholder="Masukkan Nama lengkap"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.99984 8.33341C11.8408 8.33341 13.3332 6.84103 13.3332 5.00008C13.3332 3.15913 11.8408 1.66675 9.99984 1.66675C8.15889 1.66675 6.6665 3.15913 6.6665 5.00008C6.6665 6.84103 8.15889 8.33341 9.99984 8.33341Z"
                  fill="#2563EB"
                />
                <path
                  opacity="0.5"
                  d="M16.6668 14.5833C16.6668 16.6541 16.6668 18.3333 10.0002 18.3333C3.3335 18.3333 3.3335 16.6541 3.3335 14.5833C3.3335 12.5124 6.3185 10.8333 10.0002 10.8333C13.6818 10.8333 16.6668 12.5124 16.6668 14.5833Z"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("name", { required: "Nama wajib diisi" })}
            error={errors.name?.message}
          />

          <FormInput
            label="Email"
            type="email"
            placeholder="Masukkan Email"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.99984 10.8333L1.6665 4.99992L2.49984 3.33325H17.4998L18.3332 4.99992L9.99984 10.8333Z"
                  fill="#9DC1FB"
                />
                <path
                  d="M3.33317 3.33325H16.6665C17.5832 3.33325 18.3332 4.08325 18.3332 4.99992V14.9999C18.3332 15.9166 17.5832 16.6666 16.6665 16.6666H3.33317C2.4165 16.6666 1.6665 15.9166 1.6665 14.9999V4.99992C1.6665 4.08325 2.4165 3.33325 3.33317 3.33325Z"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.3332 5L9.99984 10.8333L1.6665 5"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            {...register("email", {
              required: "Email wajib diisi",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Format email tidak valid",
              },
            })}
            error={errors.email?.message}
          />

          <FormSelect
            label="Pengalaman Belajar Bahasa Jepang"
            options={[
              { label: "Belum pernah", value: "Belum Pernah" },
              { label: "Pernah Kursus Dasar", value: "Pernah Kursus Dasar" },
              { label: "Belajar Otodidak", value: "Belajar Otodidak" },
              { label: "Pernah Ikut Kelas Lain", value: "Pernah Ikut Kelas Lain" },
            ]}
            {...register("japaneseLevel", {
              required: "Silakan pilih pengalaman anda",
            })}
            defaultValue=""
            error={errors.japaneseLevel?.message}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-primary-base hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-4 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : "SUBMIT"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  )
}
