export type Webinar = {
  id: number;
  title: string;
  type: string;
  image: string;
  date: string;
  time: string;
};

export const WEBINAR: Webinar[] = [
  {
    id: 1,
    title: "Lima Destinasi yang Wajib Anda Kunjungi di Jepang",
    type: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    date: "17 Agustus 2024",
    time: "19:30 WIB",
  },
  {
    id: 2,
    title: "Tips Traveling Hemat ke Korea Selatan",
    type: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    date: "24 Agustus 2024",
    time: "20:00 WIB",
  },
  {
    id: 3,
    title: "Panduan Liburan ke Eropa untuk Pemula",
    type: "Recorded",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
    date: "10 Agustus 2024",
    time: "18:30 WIB",
  },
];
