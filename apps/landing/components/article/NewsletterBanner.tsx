"use client";

import { useState } from "react";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section className="mt-16 mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-base via-primary-80 to-primary-100 px-6 py-12 md:px-12 md:py-16">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-tertiary-base rounded-full animate-pulse" />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-secondary-base rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-pulse delay-700" />

        {/* Japanese pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles size={16} className="text-tertiary-base" />
            <span className="text-white/90 text-sm font-medium">
              Dapatkan update terbaru
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
            Jangan Lewatkan Artikel Terbaru! 🇯🇵
          </h2>
          <p className="text-white/70 mb-8 text-sm md:text-base max-w-lg mx-auto">
            Dapatkan artikel menarik seputar budaya, bahasa, dan kehidupan Jepang
            langsung ke inbox Anda setiap minggu.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <div className="relative flex-1">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-neutral-80 placeholder-neutral-30 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary-base shadow-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitted}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                isSubmitted
                  ? "bg-success-base text-white"
                  : "bg-tertiary-base text-neutral-90 hover:bg-tertiary-50 hover:shadow-xl hover:scale-[1.02]"
              }`}
            >
              {isSubmitted ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Berhasil!
                </>
              ) : (
                <>
                  Berlangganan
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-white/40 text-xs mt-4">
            Tidak ada spam. Berhenti berlangganan kapan saja.
          </p>
        </div>
      </div>
    </section>
  );
}
