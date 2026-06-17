export type Class = {
  id: number;
  title: string;
  type: string;
  image: string;
  price: string;
  description: string;
  slot: boolean;
};

export const CLASSES: Class[] = [
  {
    id: 1,
    title: "N5 Intensive Class",
    type: "N5",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    price: "Rp 20.000",
    description:
      "Kelas intensif 3 bulan untuk mengenal dasar dasar bahasa. Fokus pada Hiragana, Katakana, dan tata bahasa dasar",
    slot: true,
  },
  {
    id: 2,
    title: "N4 Master Class",
    type: "N4",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    price: "Rp 20.000",
    description:
      "Tingkatkan kemampuan bahasa Jepangmu ke level dasar-menengah. Fokus pada 300 Kanji baru dan pola kalimat yang lebih kompleks.",
    slot: false,
  },
  {
    id: 4,
    title: "N4 Master Class",
    type: "N4",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    price: "Rp 20.000",
    description:
      "Tingkatkan kemampuan bahasa Jepangmu ke level dasar-menengah. Fokus pada 300 Kanji baru dan pola kalimat yang lebih kompleks.",
    slot: false,
  },
];
