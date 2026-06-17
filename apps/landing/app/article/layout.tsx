import React from "react";

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full flex justify-center py-24 bg-white text-black">
      <div className="w-full px-4 md:px-6 pt-20 max-w-7xl">{children}</div>
    </div>
  );
}
