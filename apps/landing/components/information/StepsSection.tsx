import React from "react";

const steps = [
  {
    number: "01",
    title: "Daftar & Pilih Topik",
    description:
      "Pilih topik yang sesuai dengan kondisimu saat ini (masalah pribadi, karir, sosial, atau pendidikan)",
  },
  {
    number: "02",
    title: "Atur Jadwal Sesi",
    description:
      "Tim kami akan membantumu menyesuaikan waktu sesi yang paling nyaman agar kamu bisa bercerita dengan tenang",
  },
  {
    number: "03",
    title: "Mulai Deep-Talk",
    description: "Mulai sesi privat dengan konselor kami",
  },
];

function StepsSection() {
  return (
    <section className="py-16 px-6 lg:px-16 mx-auto max-w-7xl">
      <div
        className="relative rounded-[32px] overflow-hidden px-10 py-14"
        style={{
          background:
            "linear-gradient(to right, #2D3CB0 10%, #2D3CB0 25%, #7B5BA8 35%, #9B6B9A 65%, #2D3CB0 100%)",
        }}
      >
        <h2 className="text-white font-bold text-xl lg:text-2xl mb-10">
          Get Guided in 3 Steps
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number}>
              <div
                className="font-bold text-lg w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-[#3B5FC0]"
                style={{ backgroundColor: "#D3E0FB" }}
              >
                {step.number}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StepsSection;
