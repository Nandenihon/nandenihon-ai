"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function KonselingRegisterPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <main
      className="min-h-screen pt-28 lg:pt-48 pb-24 px-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/vector-hero.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "cover",
        backgroundPosition: "left top",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="max-w-5xl mx-auto relative z-10">
        <div
          className="w-full rounded-2xl mb-8 px-8 py-7"
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <h1 className="text-2xl lg:text-2xl font-bold text-center text-gray-800 tracking-widest">
            SYARAT & KETENTUAN KONSELING
          </h1>
        </div>

        <div
          className="w-full rounded-2xl border-l-[6px] border-[#F59E0B] p-8 mb-6"
          style={{ backgroundColor: "#FDE7C2" }}
        >
          <p className="text-gray-700 text-sm leading-relaxed">
            Mohon baca dan konfirmasi pemahaman anda sebelum mengisi formulir.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mt-1">
            Formulir bertujuan untuk mendapatkan persetujuan klien sebelum
            proses konseling dimulai dengan Komunitas Nande Nihon. Mohon diisi
            dengan sebenar-benarnya.
          </p>
        </div>

        <div
          className="w-full rounded-2xl p-8 mb-6"
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="text-gray-700 text-sm leading-relaxed space-y-5">
            <p>
              Saya yang bertanda tangan di bawah ini menyatakan bahwa saya{" "}
              <strong>SETUJU</strong> dan <strong>BERSEDIA</strong> menjadi
              klien dalam proses konseling yang disediakan oleh Komunitas Nande
              Nihon.
            </p>
            <div>
              <p>
                Dalam kegiatan ini saya menyadari, memahami, dan menerima bahwa:
              </p>
              <ol className="list-none mt-2 space-y-2 pl-2">
                <li>
                  1. Saya terlibat penuh dan aktif selama proses konseling
                  berlangsung.
                </li>
                <li>
                  2. Saya diminta untuk memberikan informasi yang
                  sejujur-jujurnya berkaitan dengan masalah yang saya hadapi.
                </li>
                <li>
                  3. Identitas dan informasi yang saya berikan akan{" "}
                  <strong>DIRAHASIAKAN</strong> dan tidak akan disampaikan
                  secara terbuka kepada umum.
                </li>
                <li>
                  4. Saya menyetujui adanya perekaman proses konseling berupa
                  tulisan, rekaman percakapan, dan dokumentasi lainnya selama
                  proses konseling berlangsung dengan jaminan informasi pribadi
                  saya dirahasiakan.
                </li>
              </ol>
            </div>
            <p>
              Saya, dalam keadaan <strong>SADAR</strong> dan{" "}
              <strong>TIDAK ADA PAKSAAN</strong> dari pihak mana pun dalam
              menandatangani surat persetujuan ini. Apabila terjadi hal yang
              tidak terduga nantinya terhadap saya seperti bahaya bagi diri
              sendiri atau orang lain setelah konseling selesai, maka sepenuhnya
              akan menjadi tanggung jawab saya.
            </p>
          </div>
        </div>

        <div
          className="w-full rounded-2xl px-6 py-4 mb-8 flex items-center gap-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            autoComplete="off"
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-400 accent-[#2563EB] cursor-pointer flex-shrink-0"
          />
          <label
            htmlFor="agree"
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            Saya <strong>SETUJU</strong> dan <strong>BERSEDIA</strong> menjadi
            klien dalam proses konseling
          </label>
        </div>

        <div className="flex justify-center">
          {agreed ? (
            <Link
              href="/information/konseling/formulir"
              className="inline-flex items-center gap-2 px-20 py-3 rounded-lg font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              Lanjut
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-20 py-3 rounded-lg font-semibold text-white bg-[#B3B3B3] cursor-not-allowed"
            >
              Lanjut
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
