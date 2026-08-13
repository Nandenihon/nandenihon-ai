import { MessageCircle, Reply } from "lucide-react";
import CommentForm from "./CommentForm";
import CommentLikeButton from "./CommentLikeButton";

interface CommentReply {
  id: number;
  author: string;
  avatar: string;
  date: string;
  text: string;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies: CommentReply[];
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    author: "Sakura Tanaka",
    avatar: "ST",
    date: "2 hari lalu",
    text: "Artikel yang sangat informatif! Saya sudah pernah ke Kyoto dan memang keindahannya luar biasa. Kuil Fushimi Inari adalah favorit saya. Terima kasih sudah berbagi pengalaman ini! 🇯🇵",
    likes: 12,
    replies: [
      {
        id: 11,
        author: "Annisa Dwi",
        avatar: "AD",
        date: "1 hari lalu",
        text: "Terima kasih Sakura-san! Fushimi Inari memang ikonik sekali. Sudah coba naik sampai puncak? Pemandangannya worth it banget! 😊",
      },
      {
        id: 12,
        author: "Budi Santoso",
        avatar: "BS",
        date: "12 jam lalu",
        text: "Setuju! Kalau ke Kyoto, jangan lupa mampir ke Arashiyama Bamboo Grove juga ya. Suasananya sangat menenangkan.",
      },
    ],
  },
  {
    id: 2,
    author: "Ren Nakamura",
    avatar: "RN",
    date: "5 hari lalu",
    text: "Wah, saya jadi makin semangat belajar bahasa Jepang supaya bisa jalan-jalan ke sana tanpa kesulitan komunikasi. Arigatou gozaimasu untuk artikelnya! 🙏",
    likes: 8,
    replies: [
      {
        id: 21,
        author: "Citra Lestari",
        avatar: "CL",
        date: "4 hari lalu",
        text: "Ganbatte ne! Kalau butuh rekomendasi kelas bahasa Jepang, cek halaman Kelas di website ini ya 📚",
      },
    ],
  },
  {
    id: 3,
    author: "Dewi Sartika",
    avatar: "DS",
    date: "1 minggu lalu",
    text: "Pengen banget ke Hokkaido! Dengar-dengar pemandangan musim dinginnya cantik sekali. Ada yang punya tips perjalanan musim dingin ke sana?",
    likes: 5,
    replies: [],
  },
];

const AVATAR_COLORS = [
  "bg-primary-50 text-white",
  "bg-secondary-base text-white",
  "bg-success-base text-white",
  "bg-warning-base text-white",
  "bg-error-50 text-white",
  "bg-primary-80 text-white",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function AvatarCircle({ initials, name }: { initials: string; name: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(name)}`}
    >
      {initials}
    </div>
  );
}

function CommentCard({
  comment,
  isReply = false,
}: {
  comment: Comment | CommentReply;
  isReply?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${isReply ? "ml-12" : ""}`}>
      <AvatarCircle initials={comment.avatar} name={comment.author} />
      <div className="flex-1 min-w-0">
        <div className="bg-neutral-0 rounded-2xl p-4 border border-neutral-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-neutral-80">
              {comment.author}
            </span>
            <span className="text-xs text-neutral-40">{comment.date}</span>
          </div>
          <p className="text-sm text-neutral-70 leading-relaxed">
            {comment.text}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2 ml-2">
          {"likes" in comment && (
            <CommentLikeButton likes={(comment as Comment).likes} />
          )}
          <button className="flex items-center gap-1.5 text-xs text-neutral-40 hover:text-neutral-60 transition-colors">
            <Reply size={14} />
            <span>Balas</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection() {
  const totalComments = MOCK_COMMENTS.reduce(
    (sum, c) => sum + 1 + c.replies.length,
    0
  );

  return (
    <section className="mt-12 pt-10 border-t border-neutral-10">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle size={24} className="text-primary-base" />
        <h2 className="text-2xl font-bold text-neutral-90">
          Komentar
        </h2>
        <span className="bg-primary-10 text-primary-base text-sm font-bold px-3 py-1 rounded-full">
          {totalComments}
        </span>
      </div>

      {/* Comment Form */}
      <CommentForm />

      {/* Comment List */}
      <div className="space-y-6">
        {MOCK_COMMENTS.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <CommentCard comment={comment} />
            {comment.replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} isReply />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
