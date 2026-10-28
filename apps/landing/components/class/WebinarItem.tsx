import React from "react";
import Image from "next/image";

export type WebinarItemProps = {
  id: number;
  title: string;
  type: string;
  image: string;
  date: string;
  time: string;
  isFinished?: boolean;
  /** WhatsApp registration link; omitted for finished webinars. */
  registerHref?: string;
  registerLabel?: string;
};

const WebinarItem = (props: WebinarItemProps) => {
  return (
    <div className={`flex flex-col bg-white p-5 shadow-[0px_0px_20px_2px_#0000001A] rounded-2xl ${props.isFinished ? "opacity-75" : ""}`}>
      <div className="relative h-52.5 w-auto">
        <Image
          src={props.image}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="rounded-lg object-cover"
          alt={props.title}
        />
        <div className={`absolute left-1.5 top-1.5 border text-xs font-bold rounded-full px-3 py-1 ${props.isFinished ? "border-neutral-40 bg-neutral-10 text-neutral-60" : "border-primary-100 bg-primary-30 text-primary-100"}`}>
          {props.type}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center mt-2 text-sm space-x-2 text-gray-600">
          <p>{props.date}</p>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <p>{props.time}</p>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-2">
          {props.title}
        </h3>
      </div>
      {props.registerHref && (
        <a
          href={props.registerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn mt-6 block w-full text-center"
        >
          {props.registerLabel}
        </a>
      )}
    </div>
  );
};

export default WebinarItem;
