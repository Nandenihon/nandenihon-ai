import React from "react";

const topics = [
  {
    image: "/images/benefit/0.png",
    title: "Pendidikan",
    description: "Mengurangi beban di tengah tuntutan akademik",
  },
  {
    image: "/images/benefit/1.png",
    title: "Pribadi",
    description: "Berdamai dengan pikiran yang tak kunjung tenang",
  },
  {
    image: "/images/benefit/2.png",
    title: "Sosial",
    description: "Membangun hubungan yang lebih sehat",
  },
  {
    image: "/images/benefit/2.png",
    title: "Karier",
    description: "Menghadapi tekanan kerja dan mengatasi kelelahan mental",
  },
];

function TopicSection() {
  return (
    <section className="py-20 px-6 lg:px-0 max-w-7xl mx-auto text-center">
      <div className="inline-block bg-primary-20 border border-primary-50 text-primary-50 font-semibold text-sm px-4 py-1.5 rounded-full mb-4">
        Ngobrol Yuk
      </div>
      <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
        Mulai dari mana kita berdiskusi?
      </h2>
      <p className="text-gray-500 mb-20">
        Pilih topik yang paling relate sama kebutuhan kamu saat ini.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-24 mt-20">
        {topics.map((topic) => (
          <div
            key={topic.title}
            className="relative flex flex-col items-center bg-[#F0F0F0] px-8 pb-10 pt-24 rounded-[40px] text-center hover:shadow-lg transition-shadow duration-300"
          >
            <div className="absolute -top-16">
              <img
                src={topic.image}
                alt={topic.title}
                className="w-40 h-40 object-contain drop-shadow-lg"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
              {topic.title}
            </h3>
            <p className="text-gray-600 text-[14px] leading-relaxed">
              {topic.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TopicSection;
