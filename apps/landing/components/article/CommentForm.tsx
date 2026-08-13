"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function CommentForm() {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="flex gap-3 mb-10">
      <div className="w-10 h-10 rounded-full bg-neutral-10 flex items-center justify-center flex-shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.99984 8.33341C11.8408 8.33341 13.3332 6.84103 13.3332 5.00008C13.3332 3.15913 11.8408 1.66675 9.99984 1.66675C8.15889 1.66675 6.6665 3.15913 6.6665 5.00008C6.6665 6.84103 8.15889 8.33341 9.99984 8.33341Z"
            fill="#999999"
          />
          <path
            opacity="0.5"
            d="M16.6668 14.5833C16.6668 16.6541 16.6668 18.3333 10.0002 18.3333C3.3335 18.3333 3.3335 16.6541 3.3335 14.5833C3.3335 12.5124 6.3185 10.8333 10.0002 10.8333C13.6818 10.8333 16.6668 12.5124 16.6668 14.5833Z"
            fill="#999999"
          />
        </svg>
      </div>
      <div className="flex-1 relative">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Tulis komentar Anda..."
          rows={3}
          className="w-full bg-neutral-0 border border-neutral-10 rounded-2xl px-4 py-3 text-sm text-neutral-80 placeholder-neutral-30 resize-none focus:outline-none focus:ring-2 focus:ring-primary-30 focus:border-primary-base transition-all"
        />
        <button
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 ${
            commentText.trim()
              ? "bg-primary-base text-white hover:bg-primary-80 shadow-md shadow-primary-base/20 scale-100"
              : "bg-neutral-10 text-neutral-30 scale-90"
          }`}
          disabled={!commentText.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
