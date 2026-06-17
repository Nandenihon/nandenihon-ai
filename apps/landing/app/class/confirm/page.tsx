"use client";

import FormFile from "@/components/ui/FormFile";
import FormInput from "@/components/ui/FormInput";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface ConfirmProps {
  name: string;
  email: string;
  whatsapp: number;
  age: number;
  domicile: string;
  motivation: string;
  paymentProof: FileList;
  nickname: string;
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ConfirmProps>();

  useEffect(() => {
    if (studentId) {
      const fetchStudentData = async () => {
        try {
          const res = await fetch(`/api/student/result/${studentId}`);

          // Check if response is OK and is JSON
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType?.includes("application/json")) {
            console.error("API returned non-JSON response:", res.status, contentType);
            setApiError("Gagal memuat data siswa. Silakan coba lagi.");
            return;
          }

          const data = await res.json();
          if (data.success && data.data.studentInfo) {
            const info = data.data.studentInfo;
            setValue("name", info.fullName);
            setValue("email", info.email);
            if (info.nickname) setValue("nickname", info.nickname);
            if (info.level) setLevel(info.level);
            // Populate additional fields if they exist in DB
            // Use String() to ensure proper format for number input fields
            if (info.whatsapp) setValue("whatsapp", String(info.whatsapp) as unknown as number);
            if (info.age) setValue("age", String(info.age) as unknown as number);
            if (info.domicile) setValue("domicile", info.domicile);
            if (info.motivation) setValue("motivation", info.motivation);
          }
        } catch (error) {
          console.error("Failed to fetch student data", error);
        }
      };

      fetchStudentData();
    }
  }, [studentId, setValue]);

  // Helper function to send logs to server
  const sendLog = async (level: string, message: string, data?: Record<string, unknown>) => {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, source: "confirm/page", message, data }),
      });
    } catch {
      // Silent fail for logging - don't interrupt user flow
    }
  };

  const onSubmit = async (data: ConfirmProps) => {
    // Log submission start
    await sendLog("INFO", "Form submission started", { studentId, level });

    // Validation check
    if (!studentId || !level) {
      await sendLog("WARN", "Validation failed - missing studentId or level", { studentId, level });
      setApiError("Data siswa tidak lengkap.");
      return;
    }

    await sendLog("INFO", "Validation passed", { studentId });

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Step 1: Upload payment proof
      await sendLog("INFO", "Starting payment upload", { studentId });

      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("file", data.paymentProof[0]);

      const uploadRes = await fetch("/api/payment/upload", {
        method: "POST",
        body: formData,
      });

      // Check if response is JSON before parsing
      const uploadContentType = uploadRes.headers.get("content-type");
      if (!uploadContentType?.includes("application/json")) {
        await sendLog("ERROR", "Payment upload returned non-JSON response", {
          studentId,
          status: uploadRes.status,
          contentType: uploadContentType
        });
        throw new Error("Server error saat upload. Silakan coba lagi.");
      }

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        await sendLog("ERROR", "Payment upload failed", { studentId, error: uploadData.error });
        throw new Error(uploadData.error || "Gagal mengunggah bukti pembayaran.");
      }

      await sendLog("INFO", "Payment upload success", { studentId, paymentProofUrl: uploadData.data?.paymentProofUrl });

      // Step 2: Complete registration
      await sendLog("INFO", "Starting registration completion", { studentId });

      const completeRes = await fetch("/api/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId,
          nickname: data.nickname,
          whatsapp: data.whatsapp,
          age: Number(data.age),
          domicile: data.domicile,
          motivation: data.motivation,
          level: level,
        }),
      });

      // Check if response is JSON before parsing
      const completeContentType = completeRes.headers.get("content-type");
      if (!completeContentType?.includes("application/json")) {
        await sendLog("ERROR", "Registration completion returned non-JSON response", {
          studentId,
          status: completeRes.status,
          contentType: completeContentType
        });
        throw new Error("Server error saat pendaftaran. Silakan coba lagi.");
      }

      const completeData = await completeRes.json();

      if (!completeData.success) {
        await sendLog("ERROR", "Registration completion failed", { studentId, error: completeData.error });
        throw new Error(completeData.error || "Gagal menyelesaikan pendaftaran.");
      }

      await sendLog("INFO", "Registration completed successfully", { studentId });

      router.push("/class/submitted");
    } catch (err: any) {
      console.error(err);
      await sendLog("ERROR", "Form submission error", {
        studentId,
        error: err.message,
        stack: err.stack
      });
      setApiError(err.message || "Terjadi kesalahan saat memproses pendaftaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!studentId) {
    return <div className="p-10 text-center">Data pendaftaran tidak ditemukan.</div>;
  }

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

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium">
            {apiError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-basic/60 p-6 rounded-2xl space-y-6"
        >
          <FormInput
            label="Nama Lengkap"
            placeholder="Tulis namamu"
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
            disabled
            {...register("name")}
            error={errors.name?.message}
          />

          <FormInput
            label="Email"
            type="email"
            placeholder="Email kamu apa tuh"
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
            disabled
            {...register("email")}
            error={errors.email?.message}
          />

          <FormFile
            label="Upload Bukti Pembayaran"
            accept="image/*, application/pdf"
            {...register("paymentProof", {
              required: "Bukti pembayaran wajib diupload",
            })}
            error={errors.paymentProof?.message}
          />

          <FormInput
            label="Nama Panggilan"
            placeholder="Kamu akrab dipanggil siapa?"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.99935 18.3332C14.6018 18.3332 18.3327 14.6023 18.3327 9.99984C18.3327 5.39734 14.6018 1.6665 9.99935 1.6665C5.39685 1.6665 1.66602 5.39734 1.66602 9.99984C1.66602 14.6023 5.39685 18.3332 9.99935 18.3332ZM6.99685 12.9607C7.04579 12.8947 7.10725 12.839 7.17772 12.7968C7.2482 12.7546 7.32631 12.7267 7.40757 12.7147C7.48884 12.7027 7.57167 12.7068 7.65134 12.7269C7.731 12.7469 7.80593 12.7825 7.87185 12.8315C8.47852 13.2815 9.21102 13.5415 9.99935 13.5415C10.7877 13.5415 11.5202 13.2807 12.1268 12.8315C12.1926 12.7804 12.2678 12.7429 12.3482 12.7212C12.4286 12.6996 12.5126 12.6942 12.5951 12.7055C12.6776 12.7167 12.757 12.7443 12.8287 12.7867C12.9003 12.8291 12.9628 12.8853 13.0125 12.9522C13.0621 13.019 13.0979 13.0951 13.1177 13.176C13.1375 13.2568 13.141 13.3409 13.1279 13.4231C13.1148 13.5053 13.0854 13.5841 13.0414 13.6548C12.9975 13.7255 12.9398 13.7867 12.8718 13.8348C12.0423 14.4547 11.0349 14.7902 9.99935 14.7915C8.96381 14.7902 7.95635 14.4547 7.12685 13.8348C6.9937 13.7361 6.90521 13.5886 6.88083 13.4247C6.85645 13.2607 6.89819 13.0938 6.99685 12.9607ZM13.3327 8.74984C13.3327 9.43984 12.9593 9.99984 12.4993 9.99984C12.0393 9.99984 11.666 9.43984 11.666 8.74984C11.666 8.05984 12.0393 7.49984 12.4993 7.49984C12.9593 7.49984 13.3327 8.05984 13.3327 8.74984ZM7.49935 9.99984C7.95935 9.99984 8.33268 9.43984 8.33268 8.74984C8.33268 8.05984 7.95935 7.49984 7.49935 7.49984C7.03935 7.49984 6.66602 8.05984 6.66602 8.74984C6.66602 9.43984 7.03935 9.99984 7.49935 9.99984Z"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("nickname", {
              required: "Nama panggilan wajib diisi",
            })}
            error={errors.nickname?.message}
          />

          <FormInput
            label="Nomor WhatsApp Aktif"
            type="number"
            placeholder="Tulis nomor WhatsApp kamu"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.1674 9.99984C15.0735 9.99969 15.9548 9.70417 16.6779 9.15806C17.4009 8.61196 17.9263 7.84504 18.1743 6.97353C18.4222 6.10202 18.3794 5.17343 18.0522 4.32847C17.7249 3.48351 17.1312 2.76825 16.3609 2.29108C15.5906 1.81391 14.6858 1.60084 13.7835 1.68416C12.8812 1.76749 12.0307 2.14266 11.3609 2.75282C10.691 3.36299 10.2383 4.17489 10.0713 5.06548C9.90439 5.95608 10.0323 6.87682 10.4357 7.68817C10.5117 7.83556 10.5316 8.00557 10.4915 8.16651L10.2432 9.09401C10.2186 9.18584 10.2186 9.28252 10.2432 9.37435C10.2679 9.46617 10.3162 9.5499 10.3834 9.61712C10.4506 9.68434 10.5344 9.73269 10.6262 9.7573C10.718 9.78192 10.8147 9.78193 10.9065 9.75734L11.834 9.50901C11.995 9.46896 12.165 9.4888 12.3124 9.56484C12.8888 9.85117 13.5237 10.0001 14.1674 9.99984Z"
                  fill="#2563EB"
                />
                <path
                  d="M6.6974 6.09685L7.23823 7.06602C7.72573 7.94102 7.5299 9.08769 6.76157 9.85685C6.76157 9.85685 5.82823 10.7894 7.5199 12.4802C9.20907 14.1694 10.1424 13.2385 10.1424 13.2385C10.9116 12.4694 12.0591 12.2735 12.9332 12.761L13.9024 13.3027C15.2232 14.0394 15.3791 15.891 14.2182 17.0527C13.5207 17.7494 12.6657 18.2927 11.7216 18.3277C10.1316 18.3885 7.43073 17.986 4.72157 15.2777C2.01323 12.5685 1.61073 9.86769 1.67157 8.27769C1.7074 7.33352 2.2499 6.47852 2.94657 5.78102C4.10823 4.62019 5.9599 4.77602 6.69657 6.09769"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("whatsapp", {
              required: "Nomor WhatsApp wajib diisi", minLength: { value: 10, message: "Nomor WhatsApp minimal 10 digit" }
            })}
            error={errors.whatsapp?.message}
          />

          <FormInput
            label="Usia"
            type="number"
            placeholder="Umur kamu berapa?"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.79935 1.6665C6.14768 1.6665 6.42935 1.92484 6.42935 2.24317V3.40817C6.98768 3.39817 7.61435 3.39817 8.31935 3.39817H11.6793C12.3843 3.39817 13.0102 3.39817 13.5693 3.40817V2.24317C13.5693 1.92484 13.851 1.6665 14.1993 1.6665C14.5477 1.6665 14.8293 1.92484 14.8293 2.24317V3.45817C16.0377 3.5465 16.8318 3.76484 17.4152 4.29817C17.9985 4.83234 18.236 5.559 18.3327 6.6665V7.49984H1.66602V6.6665C1.76268 5.559 2.00018 4.83317 2.58352 4.29817C3.16685 3.76484 3.96018 3.5465 5.16935 3.45817V2.24317C5.16935 1.92484 5.45185 1.6665 5.79935 1.6665Z"
                  fill="#2563EB"
                />
                <path
                  opacity="0.5"
                  d="M18.3325 11.6667V10C18.3325 9.30083 18.3217 8.05417 18.3108 7.5H1.67083C1.66 8.05417 1.67083 9.30083 1.67083 10V11.6667C1.67083 14.8092 1.67083 16.3808 2.64583 17.3567C3.62333 18.3333 5.19416 18.3333 8.33583 18.3333H11.6692C14.8108 18.3333 16.3808 18.3333 17.3575 17.3567C18.3342 16.38 18.3325 14.8092 18.3325 11.6667Z"
                  fill="#2563EB"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.3327 11.0415C13.4984 11.0415 13.6574 11.1074 13.7746 11.2246C13.8918 11.3418 13.9577 11.5007 13.9577 11.6665V12.7082H14.9993C15.1651 12.7082 15.3241 12.774 15.4413 12.8912C15.5585 13.0084 15.6243 13.1674 15.6243 13.3332C15.6243 13.4989 15.5585 13.6579 15.4413 13.7751C15.3241 13.8923 15.1651 13.9582 14.9993 13.9582H13.9577V14.9998C13.9577 15.1656 13.8918 15.3246 13.7746 15.4418C13.6574 15.559 13.4984 15.6248 13.3327 15.6248C13.1669 15.6248 13.008 15.559 12.8907 15.4418C12.7735 15.3246 12.7077 15.1656 12.7077 14.9998V13.9582H11.666C11.5003 13.9582 11.3413 13.8923 11.2241 13.7751C11.1069 13.6579 11.041 13.4989 11.041 13.3332C11.041 13.1674 11.1069 13.0084 11.2241 12.8912C11.3413 12.774 11.5003 12.7082 11.666 12.7082H12.7077V11.6665C12.7077 11.5007 12.7735 11.3418 12.8907 11.2246C13.008 11.1074 13.1669 11.0415 13.3327 11.0415Z"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("age", {
              required: "Usia wajib diisi", min: { value: 5, message: "Usia minimal 5 tahun" }, max: { value: 100, message: "Usia maksimal 100 tahun" }
            })}
            error={errors.age?.message}
          />

          <FormInput
            label="Domisili"
            placeholder="Kamu tinggal di mana?"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.0007 1.6665C6.31898 1.6665 3.33398 5.00234 3.33398 8.74984C3.33398 12.4682 5.46148 16.5098 8.78148 18.0615C9.16308 18.2402 9.57929 18.3328 10.0007 18.3328C10.422 18.3328 10.8382 18.2402 11.2198 18.0615C14.5398 16.5098 16.6673 12.4682 16.6673 8.74984C16.6673 5.00234 13.6823 1.6665 10.0007 1.6665ZM10.0007 9.99984C10.4427 9.99984 10.8666 9.82424 11.1792 9.51168C11.4917 9.19912 11.6673 8.7752 11.6673 8.33317C11.6673 7.89114 11.4917 7.46722 11.1792 7.15466C10.8666 6.8421 10.4427 6.6665 10.0007 6.6665C9.55862 6.6665 9.1347 6.8421 8.82214 7.15466C8.50958 7.46722 8.33398 7.89114 8.33398 8.33317C8.33398 8.7752 8.50958 9.19912 8.82214 9.51168C9.1347 9.82424 9.55862 9.99984 10.0007 9.99984Z"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("domicile", {
              required: "Domisili wajib diisi",
            })}
            error={errors.domicile?.message}
          />

          <FormInput
            label="Alasan Belajar Bahasa Jepang"
            placeholder="Alasan kamu ingin belajar..."
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M18.3327 10.0001C18.3327 14.6026 14.6018 18.3334 9.99935 18.3334C5.39685 18.3334 1.66602 14.6026 1.66602 10.0001C1.66602 5.39758 5.39685 1.66675 9.99935 1.66675C14.6018 1.66675 18.3327 5.39758 18.3327 10.0001Z"
                  fill="#2563EB"
                />
                <path
                  d="M10 6.45843C9.4825 6.45843 9.0625 6.87843 9.0625 7.39593C9.0625 7.56169 8.99665 7.72066 8.87944 7.83787C8.76223 7.95508 8.60326 8.02093 8.4375 8.02093C8.27174 8.02093 8.11277 7.95508 7.99556 7.83787C7.87835 7.72066 7.8125 7.56169 7.8125 7.39593C7.81251 7.03754 7.90058 6.68465 8.06895 6.36828C8.23733 6.05191 8.48085 5.78175 8.77812 5.58157C9.07538 5.38138 9.41728 5.2573 9.77374 5.22023C10.1302 5.18316 10.4903 5.23424 10.8224 5.36898C11.1545 5.50372 11.4484 5.71798 11.6783 5.99294C11.9081 6.2679 12.0669 6.59512 12.1407 6.94584C12.2144 7.29655 12.2009 7.66001 12.1012 8.00427C12.0016 8.34852 11.8189 8.66301 11.5692 8.92009C11.4925 8.99898 11.4192 9.07315 11.3492 9.14259C11.1804 9.30429 11.0215 9.47599 10.8733 9.65676C10.69 9.89176 10.625 10.0643 10.625 10.2084V10.8334C10.625 10.9992 10.5592 11.1582 10.4419 11.2754C10.3247 11.3926 10.1658 11.4584 10 11.4584C9.83424 11.4584 9.67527 11.3926 9.55806 11.2754C9.44085 11.1582 9.375 10.9992 9.375 10.8334V10.2084C9.375 9.66259 9.62917 9.22009 9.88667 8.88926C10.0775 8.64426 10.3167 8.40593 10.5117 8.21093C10.5706 8.15259 10.6242 8.09871 10.6725 8.04926C10.8009 7.91709 10.8876 7.75001 10.9216 7.56888C10.9556 7.38776 10.9354 7.20063 10.8637 7.03089C10.7919 6.86115 10.6717 6.71632 10.5181 6.6145C10.3645 6.51268 10.1843 6.4584 10 6.45843ZM10 14.1668C10.221 14.1668 10.433 14.079 10.5893 13.9227C10.7455 13.7664 10.8333 13.5544 10.8333 13.3334C10.8333 13.1124 10.7455 12.9005 10.5893 12.7442C10.433 12.5879 10.221 12.5001 10 12.5001C9.77899 12.5001 9.56702 12.5879 9.41074 12.7442C9.25446 12.9005 9.16667 13.1124 9.16667 13.3334C9.16667 13.5544 9.25446 13.7664 9.41074 13.9227C9.56702 14.079 9.77899 14.1668 10 14.1668Z"
                  fill="#2563EB"
                />
              </svg>
            }
            {...register("motivation", {
              required: "Motivasi wajib diisi",
            })}
            error={errors.motivation?.message}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-primary-base hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses Pendaftaran...
              </>
            ) : "SUBMIT"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  )
}
