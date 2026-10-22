"use client";

import { useState } from "react";
import { DatePicker, DateTimePicker } from "@repo/ui";
import { datetimeLocalToJakartaUtc } from "@repo/utils/jakarta-time";
import type { LandingTranslations } from "@/lib/i18n";

type FormTranslations = LandingTranslations["konselingPage"]["form"];

const TODAY_ISO = new Date().toISOString().split("T")[0];

const EDUCATION_OPTIONS = ["SD", "SMP/SLTP", "SMA/SMK/SLTA", "D3", "S1", "S2", "S3"] as const;
// Stored values (kept in Indonesian; "Karir" matches existing registrations). Labels come from translations.
const TOPIC_OPTIONS = ["Pendidikan", "Karir", "Pribadi", "Sosial", "Keluarga", "Relationship"] as const;

interface SuccessData {
  id: number;
  full_name: string;
  email: string;
  topic: string;
  consultation_time: string;
}

function SuccessModal({ data, onClose, t }: { data: SuccessData; onClose: () => void; t: FormTranslations }) {
  const formattedTime = new Date(data.consultation_time).toLocaleString(t.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.success.title} 🎉
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {t.success.thanks.replace("{name}", data.full_name)}
          <br />
          {t.success.followUp}
        </p>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-left space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">📧</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t.success.email}</p>
              <p className="text-sm text-gray-700 font-semibold">{data.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">💬</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t.success.topic}</p>
              <p className="text-sm text-gray-700 font-semibold">{t.topicLabels[data.topic as keyof typeof t.topicLabels] ?? data.topic}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">📅</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t.success.time}</p>
              <p className="text-sm text-gray-700 font-semibold">{formattedTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">🔖</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t.success.number}</p>
              <p className="text-sm text-gray-700 font-semibold">#{String(data.id).padStart(5, "0")}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t.success.close}
        </button>
      </div>
    </div>
  );
}

export default function KonselingForm({ t }: { t: FormTranslations }) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nomorHP, setNomorHP] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [domisili, setDomisili] = useState("");
  const [pendidikan, setPendidikan] = useState("");
  const [tema, setTema] = useState("");
  const [cerita, setCerita] = useState("");
  const [waktu, setWaktu] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const isFormComplete =
    nama.trim() !== "" &&
    email.trim() !== "" &&
    nomorHP.trim() !== "" &&
    tempatLahir.trim() !== "" &&
    tanggalLahir.trim() !== "" &&
    domisili.trim() !== "" &&
    pendidikan !== "" &&
    tema !== "" &&
    cerita.trim() !== "" &&
    waktu.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: nama,
          email,
          phone: nomorHP,
          birth_place: tempatLahir,
          birth_date: tanggalLahir,
          domicile: domisili,
          last_education: pendidikan,
          topic: tema,
          story: cerita,
          consultation_time: datetimeLocalToJakartaUtc(waktu),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || t.genericError);
        return;
      }

      // Show success modal and reset form
      setSuccessData(json.data as SuccessData);
      setNama("");
      setEmail("");
      setNomorHP("");
      setTempatLahir("");
      setTanggalLahir("");
      setDomisili("");
      setPendidikan("");
      setTema("");
      setCerita("");
      setWaktu("");
    } catch {
      setErrorMsg(t.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80";
  const labelClass = "block mb-2 font-medium text-gray-700";

  return (
    <>
      {/* Success Modal */}
      {successData && (
        <SuccessModal data={successData} onClose={() => setSuccessData(null)} t={t} />
      )}

      <section
        className="min-h-screen bg-cover bg-center px-4 py-10"
        style={{ backgroundImage: "url('/images/vector-hero.png')" }}
      >
        <div className="mt-[100px] flex flex-col items-center">
          {/* Header Card */}
          <div
            className="w-full max-w-[720px] rounded-[16px] p-8"
            style={{ backgroundColor: "#FFFFFF99", backdropFilter: "blur(3px)" }}
          >
            <h1 className="text-center text-2xl sm:text-[32px] font-bold text-balance [word-break:auto-phrase]">{t.title}</h1>
          </div>

          <div className="h-[40px]" />

          {/* Form Card */}
          <div
            className="w-full max-w-[720px] rounded-[16px] p-5 sm:p-8"
            style={{ backgroundColor: "#FFFFFF99", backdropFilter: "blur(3px)" }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Nama */}
              <div>
                <label className={labelClass}>{t.fullName}</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className={inputClass}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={inputClass}
                  required
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label className={labelClass}>{t.phone}</label>
                <input
                  type="tel"
                  value={nomorHP}
                  onChange={(e) => setNomorHP(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className={inputClass}
                  required
                />
              </div>

              {/* Tempat & Tanggal Lahir — side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.birthPlace}</label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder={t.birthPlacePlaceholder}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.birthDate}</label>
                  <DatePicker
                    value={tanggalLahir}
                    onChange={setTanggalLahir}
                    max={TODAY_ISO}
                    placeholder={t.birthDatePlaceholder}
                    required
                  />
                </div>
              </div>

              {/* Domisili */}
              <div>
                <label className={labelClass}>{t.domicile}</label>
                <input
                  type="text"
                  value={domisili}
                  onChange={(e) => setDomisili(e.target.value)}
                  placeholder={t.domicilePlaceholder}
                  className={inputClass}
                  required
                />
              </div>

              {/* Pendidikan Terakhir — dropdown */}
              <div>
                <label className={labelClass}>{t.education}</label>
                <select
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>
                    {t.educationPlaceholder}
                  </option>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tema */}
              <div>
                <label className={labelClass}>{t.topic}</label>
                <select
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>
                    {t.topicPlaceholder}
                  </option>
                  {TOPIC_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t.topicLabels[opt]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cerita */}
              <div>
                <label className={labelClass}>{t.story}</label>
                <textarea
                  rows={5}
                  value={cerita}
                  onChange={(e) => setCerita(e.target.value)}
                  placeholder={t.storyPlaceholder}
                  className={inputClass}
                  required
                />
              </div>

              {/* Waktu */}
              <div>
                <label className={labelClass}>{t.time}</label>
                <DateTimePicker
                  value={waktu}
                  onChange={setWaktu}
                  min={TODAY_ISO}
                  placeholder={t.timePlaceholder}
                  required
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormComplete || isSubmitting}
                className={`w-full rounded-xl py-3 font-semibold text-white transition-all ${
                  isFormComplete && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-[#CCCCCC] cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    {t.submitting}
                  </span>
                ) : (
                  t.submit
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}