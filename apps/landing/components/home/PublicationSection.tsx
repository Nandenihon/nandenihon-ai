import React from "react";

const publications = Array(6).fill({
  title: "Lima Destinasi yang Wajib Anda Kunjungi di Jepang",
  author: "Dwi Anissa",
  date: "17 Agustus 2024",
  image:
    "https://blog.bankmega.com/wp-content/uploads/2024/12/8-Rekomendasi-Tempat-Wisata-di-Jepang-yang-Wajib-Dikunjungi.jpg",
});

const badges = [
  { title: "Semua Kategori", color: "#F6C9C9", text: "#DC2626", active: true },
  { title: "Life Style", color: "#F6C9C9", text: "#DC2626" },
  { title: "Teknologi", color: "#F9A8D4", text: "#F9A8D4" },
  { title: "Budaya", color: "#FFFBFD", text: "#F9A8D4" },
  { title: "Makanan", color: "#FDE7C2", text: "#F59E0B" },
  { title: "Travel", color: "#F0F0F0", text: "#4D4D4D" },
  { title: "Edukasi", color: "#C5E8D2", text: "#16A34A" },
  { title: "Filosofi", color: "#F4F7FE", text: "#2563EB" },
];

// Badge tombol kategori
const Badge = ({ item }: { item: (typeof badges)[0] }) => {
  const base =
    "px-6 py-1.5 rounded-full text-nowrap border-2 cursor-pointer whitespace-nowrap";

  if (item.active) {
    return (
      <div
        className={`${base} bg-primary-50 border-primary-80 text-white font-bold`}
      >
        {item.title}
      </div>
    );
  }

  return (
    <div className={`${base} border-[#A8C1F7] text-primary-base`}>
      {item.title}
    </div>
  );
};

// Kartu publikasi
const PublicationCard = ({
  publication,
  badge,
}: {
  publication: (typeof publications)[0];
  badge: (typeof badges)[0];
}) => {
  return (
    <div className="p-3 rounded-lg bg-white shadow-[0_0_20px_2px_#0000001A] relative">
      <img
        src={publication.image}
        alt={publication.title}
        className="rounded-lg"
      />

      <div className="absolute top-6 left-6">
        <label
          style={{ backgroundColor: badge.color, color: badge.text }}
          className="px-4 py-2 rounded-full text-sm"
        >
          {badge.title}
        </label>
      </div>

      <div className="flex items-center mt-2 space-x-2 text-gray-600 text-sm">
        <p>{publication.author}</p>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <p>{publication.date}</p>
      </div>

      <h3 className="text-base font-bold text-gray-900 mt-2">
        {publication.title}
      </h3>
    </div>
  );
};

const PublicationSection = () => {
  const category = badges[6];

  return (
    <div className="py-12 bg-[#FBFCFF]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <div className="flex justify-between items-center mb-15">
          <h2 className="lg:text-4xl  text-2xl font-bold text-gray-900">
            Publikasi
          </h2>
          <a
            href="#"
            className="text-primary-base lg:text-lg  text-base font-bold"
          >
            Lihat Semua
          </a>
        </div>

        <div className="flex overflow-x-auto space-x-5">
          {badges.map((item, idx) => (
            <Badge key={idx} item={item} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-6 mt-15">
          {publications.map((item, idx) => (
            <PublicationCard key={idx} publication={item} badge={category} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicationSection;
