"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

export default function CommentLikeButton({ likes }: { likes: number }) {
  const [liked, setLiked] = useState(false);

  return (
    <button
      onClick={() => setLiked(!liked)}
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        liked
          ? "text-primary-base font-semibold"
          : "text-neutral-40 hover:text-neutral-60"
      }`}
    >
      <ThumbsUp size={14} />
      <span>{likes + (liked ? 1 : 0)}</span>
    </button>
  );
}
