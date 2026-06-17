"use client"

import { useState } from "react";

export default function KonselingForm() {

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

  const isFormComplete = 
    nama.trim() !== "" &&
    email.trim() !== "" && 
    nomorHP.trim() !== "" && 
    tempatLahir.trim() !== "" && 
    tanggalLahir.trim() !== "" && 
    domisili.trim() !== "" && 
    pendidikan.trim() !== "" && 
    tema.trim() !== "" && 
    cerita.trim() !== "" && 
    waktu.trim() !== "";

  return (
    <section
      className="min-h-screen bg-cover bg-center px-4 py-10"
      style={{
        backgroundImage: "url('/images/vector-hero.png')",
      }}
    >

      <div className="mt-[100px] flex flex-col items-center">
        <div
          className="w-[720px] rounded-[16px] p-8"
          style={{
            backgroundColor: "#FFFFFF99",
            backdropFilter: "blur(3px)",
          }}
        >
          {/* Judul */}
          <h1 className="text-center text-[32px] font-bold">
            Formulir Konseling
          </h1>
        </div>

        <div className="h-[40px]"/>
        
        <div 
          className="w-[720px] rounded-[16px]" 
          style={{ 
            backgroundColor: "#FFFFFF99", 
            backdropFilter: "blur(3px)",
          }}
        >
          <form className="space-y-5">
            {/* Nama */}
              <label className="block mb-2 font-medium">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Isi Nama Lengkapmu"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Email */}
              <label className="block mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email kamu"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Nomor HP */}
              <label className="block mb-2 font-medium">
                Nomor Handphone
              </label>
              <input
                type="text"
                value={nomorHP}
                onChange={(e) => setNomorHP(e.target.value)}
                placeholder="Tulis nomor handphone kamu"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Tempat Lahir */}
              <label className="block mb-2 font-medium">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                placeholder="Tempat lahir kamu"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Tanggal Lahir */}
              <label className="block mb-2 font-medium">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Domisili */}
              <label className="block mb-2 font-medium">
                Domisili
              </label>
              <input
                type="text"
                value={domisili}
                onChange={(e) => setDomisili(e.target.value)}
                placeholder="Kamu tinggal di mana"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Pendidikan */}
              <label className="block mb-2 font-medium">
                Pendidikan Terakhir
              </label>
              <input
                type="text"
                value={pendidikan}
                onChange={(e) => setPendidikan(e.target.value)}
                placeholder="Kamu lulusan apa"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Tema */}
              <label className="block mb-2 font-medium">
                Tema
              </label>
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400" 
              >
                <option>Pilih tema konseling</option>
                <option>Pendidikan</option>
                <option>Karir</option>
                <option>Keluarga</option>
                <option>Relationship</option>
              </select>

            {/* Cerita */}
              <label className="block mb-2 font-medium">
                Ceritakan Diri dan Tentang Kamu
              </label>
              <textarea
                rows={5}
                value={cerita}
                onChange={(e) => setCerita(e.target.value)}
                placeholder="Apa yang ingin kamu sampaikan"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Waktu */}
              <label className="block mb-2 font-medium">
                Waktu Konsultasi
              </label>
              <input
                type="datetime-local"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

            {/* Tombol */}
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-full rounded-xl py-3 font-semibold text-white ${
                isFormComplete
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-[#CCCCCC] cursor-not-allowed"
              }`}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}