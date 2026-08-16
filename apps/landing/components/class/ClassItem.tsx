import React from "react";
import Image from "next/image";
import type { LandingTranslations } from "@/lib/i18n";
import { getStudentPortalUrl } from "@/lib/studentPortal";

export type ClassItemProps = {
  id: number;
  title: string;
  type: string;
  image: string;
  price: string;
  description: string;
  slot: boolean;
  registrationStart?: string;
  registrationEnd?: string;
};

type ClassItemComponentProps = ClassItemProps & {
  t: LandingTranslations["classPage"]["classes"];
};

const ClassItem = (props: ClassItemComponentProps) => {
  const registerHref = `${getStudentPortalUrl()}/register`;

  return (
    <div className="bg-white p-5 shadow-[0px_0px_20px_2px_#0000001A] rounded-2xl ">
      <div className="relative h-52.5 w-auto">
        <Image
          src={props.image}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="rounded-lg object-cover"
          alt="placeholder"
        />
        <div className="absolute  right-1.5 top-1.5 border border-primary-100 bg-primary-30 text-primary-100 text-xs font-bold rounded-full px-3 py-1">
          {props.price}
        </div>
        <div className="absolute  left-1.5 bottom-1.5 bg-primary-100 text-white text-xs font-bold rounded-full px-3 py-1">
          {props.type}
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-lg font-semibold">{props.title}</h4>
        <p className="mt-4 leading-6 text-neutral-80">{props.description}</p>
        {(props.registrationStart || props.registrationEnd) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-70">
            <svg
              className="h-4 w-4 flex-shrink-0 text-primary-base"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>
              {props.t.registrationLabel}: {props.registrationStart} - {props.registrationEnd}
            </span>
          </div>
        )}
      </div>
      {props.slot ? (
        <a href={registerHref} className="btn block w-full mt-10 text-center">
          {props.t.availableButton}
        </a>
      ) : (
        <div className="flex space-x-2">
          <a href={registerHref} className="btn block w-full mt-10 text-center">
            {props.t.openButton}
          </a>
          <a
            href={registerHref}
            className="btn block bg-white text-primary-base border-2 border-primary-base w-full mt-10 text-center"
          >
            {props.t.detailButton}
          </a>
        </div>
      )}
    </div>
  );
};

export default ClassItem;
