export type Article = {
  id: number;
  slug: string;
  title: string;
  author?: string;
  date: string;
  image?: string;
  category: string;
  description?: string;
  content?: string;
};

export const FEATURED_ARTICLES = [
  {
    id: 1,
    slug: "lima-destinasi-wajib-kunjungi-jepang",
    title: "Lima Destinasi yang Wajib Anda Kunjungi di Jepang",
    author: "Annisa Dwi",
    date: "17 Agustus 2025",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    category: "Travel",
    description: "Jepang menawarkan keindahan alam dan budaya yang tak tertandingi. Dari Tokyo hingga Kyoto, temukan spot terbaik untuk liburan Anda.",
    content: "Jepang adalah negeri yang menakjubkan dengan perpaduan sempurna antara tradisi kuno dan teknologi modern. Dalam perjalanan ini, kita akan menjelajahi lima destinasi yang wajib dikunjungi: Tokyo dengan kesibukannya, Kyoto dengan kuil-kuilnya, Osaka dengan kulinernya, Nara dengan rusanya, dan Hokkaido dengan keindahan alamnya."
  },
  {
    id: 2,
    slug: "budaya-minum-teh-sadou-makna",
    title: "Mengenal Budaya Minum Teh (Sadou) yang Penuh Makna",
    author: "Budi Santoso",
    date: "20 Agustus 2025",
    image: "https://images.unsplash.com/photo-1545048702-79362596cdc9?q=80&w=2070&auto=format&fit=crop",
    category: "Budaya",
    description: "Sadou bukan sekadar minum teh, melainkan seni meditasi dan estetika yang telah diwariskan turun-temurun selama berabad-abad.",
    content: "Upacara teh Jepang, atau Sadou, adalah ritual yang sangat dihargai dalam budaya Jepang. Ini bukan hanya tentang menikmati secangkir teh hijau matcha, tetapi tentang harmoni (wa), rasa hormat (kei), kemurnian (sei), dan ketenangan (jaku)."
  },
  {
    id: 3,
    slug: "kuliner-malam-osaka-surga-makanan",
    title: "Kuliner Malam di Osaka: Surga bagi Pecinta Makanan",
    author: "Citra Lestari",
    date: "25 Agustus 2025",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    category: "Makanan",
    description: "Jelajahi Dotonbori dan nikmati Takoyaki, Okonomiyaki, serta berbagai jajanan jalanan yang menggugah selera.",
    content: "Osaka dikenal sebagai 'dapur bangsa' di Jepang. Dotonbori adalah pusat dari semua itu, di mana lampu neon yang terang dan aroma makanan yang lezat akan menyambut Anda di setiap sudut."
  },
  {
    id: 4,
    slug: "musim-sakura-2026-prediksi-spot",
    title: "Musim Sakura 2026: Prediksi dan Spot Terbaik",
    author: "Dewi Ayu",
    date: "1 September 2025",
    image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop",
    category: "Lifestyle",
    description: "Siapkan perjalanan Anda menyambut musim semi dengan panduan lengkap menikmati bunga sakura di seluruh Jepang.",
    content: "Musim semi di Jepang identik dengan bunga sakura yang bermekaran. Tahun 2026 diprediksi akan menjadi salah satu musim tercantik dengan prakiraan mekarnya bunga yang tepat waktu."
  },
  {
    id: 5,
    slug: "minimalisme-gaya-hidup-jepang-mendunia",
    title: "Minimalisme: Gaya Hidup Orang Jepang yang Mendunia",
    author: "Rina S.",
    date: "5 September 2025",
    image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2070&auto=format&fit=crop",
    category: "Lifestyle",
    description: "Belajar hidup cukup dan bahagia dengan konsep Danshari yang populer di Jepang.",
    content: "Danshari adalah seni membuang yang tidak perlu dan menghargai apa yang kita miliki. Gaya hidup minimalis ini telah menginspirasi banyak orang di seluruh dunia untuk hidup lebih sederhana."
  },
  {
    id: 6,
    slug: "teknologi-shinkansen-terbaru-kereta-cepat",
    title: "Teknologi Kereta Cepat Shinkansen Terbaru",
    author: "Hiro Tanaka",
    date: "10 September 2025",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Teknologi",
    description: "Mengupas tuntas inovasi maglev terbaru yang akan menghubungkan Tokyo dan Osaka dalam waktu singkat.",
    content: "Shinkansen terus berevolusi. Inovasi terbaru mencakup kereta maglev yang mampu melaju dengan kecepatan luar biasa, memangkas waktu perjalanan secara signifikan."
  },
  {
    id: 7,
    slug: "filosofi-ikigai-menemukan-tujuan-hidup",
    title: "Filosofi Ikigai: Menemukan Tujuan Hidup",
    author: "Kenji Sato",
    date: "12 September 2025",
    image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?q=80&w=876&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Filosofi",
    description: "Rahasia umur panjang dan kebahagiaan masyarakat Okinawa yang bisa kita terapkan sehari-hari.",
    content: "Ikigai adalah konsep Jepang yang berarti 'alasan untuk bangun di pagi hari'. Dengan menemukan pertemuan antara apa yang Anda cintai, apa yang Anda kuasai, apa yang dunia butuhkan, dan apa yang Anda bisa dibayar untuk itu, Anda akan menemukan Ikigai Anda."
  },
  {
    id: 8,
    slug: "panduan-belajar-bahasa-jepang-pemula",
    title: "Panduan Belajar Bahasa Jepang untuk Pemula",
    author: "Siti Rahma",
    date: "15 September 2025",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Edukasi",
    description: "Tips dan trik menguasai Hiragana, Katakana, dan Kanji dasar dengan mudah dan menyenangkan.",
    content: "Belajar bahasa Jepang dimulai dengan menguasai sistem tulisan dasar: Hiragana dan Katakana. Setelah itu, Anda bisa mulai mempelajari Kanji dan tata bahasa dasar."
  },
  {
    id: 9,
    slug: "ramen-vs-udon-populer-mana",
    title: "Ramen vs Udon: Mana yang Lebih Populer?",
    author: "Foodie J",
    date: "18 September 2025",
    image: "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1964&auto=format&fit=crop",
    category: "Makanan",
    description: "Perdebatan abadi mie Jepang. Simak sejarah dan perbedaan karakteristik keduanya.",
    content: "Ramen adalah mie gandum tipis yang disajikan dalam kaldu gurih, sementara Udon adalah mie gandum tebal yang lebih kenyal. Keduanya memiliki penggemar setia di seluruh dunia."
  }
];

export const POPULAR_ARTICLES = [
  {
    id: 101,
    slug: "anime-fall-2025-nonton-wajib",
    title: "Anime Fall 2025: Daftar Tontonan Wajib",
    author: "Otaku Indo",
    date: "20 September 2025",
    image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop",
    category: "Lifestyle",
    description: "Deretan judul anime terbaru yang diprediksi akan hits di musim gugur tahun ini.",
    content: "Musim gugur 2025 menjanjikan banyak anime menarik, mulai dari kembalinya serial populer hingga adaptasi manga baru yang sangat dinantikan."
  },
  {
    id: 102,
    slug: "tips-hemat-liburan-tokyo-backpacker",
    title: "Tips Hemat Liburan ke Tokyo untuk Backpacker",
    author: "Jalan Jalan",
    date: "22 September 2025",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop",
    category: "Travel",
    description: "Panduan lengkap keliling Tokyo dengan budget minim tapi tetap puas dan nyaman.",
    content: "Tokyo tidak harus mahal. Dengan menginap di hostel, makan di kedai lokal, dan menggunakan transportasi umum secara efisien, Anda bisa menikmati Tokyo dengan budget terbatas."
  },
  {
    id: 103,
    slug: "sejarah-samurai-fakta-menarik",
    title: "Sejarah Samurai yang Tidak Banyak Orang Tahu",
    author: "Sejarahwan",
    date: "24 September 2025",
    image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=2069&auto=format&fit=crop",
    category: "Budaya",
    description: "Fakta-fakta menarik tentang kehidupan samurai yang jarang diungkap di buku sejarah.",
    content: "Samurai bukan hanya pejuang, tetapi juga penikmat seni dan budaya. Mereka sangat menghargai disiplin, kehormatan, dan pengabdian."
  },
  {
    id: 104,
    slug: "resep-sushi-rumahan-mudah",
    title: "Resep Sushi Rumahan yang Mudah dan Lezat",
    author: "Chef Kita",
    date: "26 September 2025",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
    category: "Makanan",
    description: "Cara membuat sushi enak di rumah dengan bahan-bahan lokal yang mudah didapat.",
    content: "Membuat sushi di rumah sebenarnya cukup sederhana asalkan Anda memiliki nasi sushi yang tepat dan bahan-bahan segar."
  }
];

export const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    "Travel": "bg-[#F0F0F0] text-[#4D4D4D  ]",
    "Lifestyle": "bg-[#F6C9C9] text-[#DC2626]",
    "Makanan": "bg-[#FDE7C2] text-[#F59E0B]",
    "Budaya": "bg-[#FFFBFD] text-[#F9A8D4]",
    "Teknologi": "bg-purple-50 text-purple-500",
    "Filosofi": "bg-primary/10 text-primary-base",
    "Edukasi": "bg-[#C5E8D2] text-[#16A34A]",
  };
  return map[category] || "bg-blue-100 text-blue-600";
};

export const getAllArticles = () => {
  return [...FEATURED_ARTICLES, ...POPULAR_ARTICLES];
};

export const getArticleById = (id: number) => {
  return getAllArticles().find((a) => a.id === id);
};

export const getArticleBySlug = (slug: string) => {
  return getAllArticles().find((a) => a.slug === slug);
};