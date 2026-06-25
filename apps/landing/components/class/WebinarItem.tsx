import React from "react";

export type WebinarItemProps = {
  id: number;
  title: string;
  type: string;
  image: string;
  date: string;
  time: string;
};

const WebinarItem = (props: WebinarItemProps) => {
  return (
    <div className="bg-white p-5 shadow-[0px_0px_20px_2px_#0000001A] rounded-2xl ">
      <div className="relative h-52.5 w-auto">
        <img
          src={props.image}
          className=" h-full rounded-lg object-cover w-full"
          alt="placeholder"
        />
        <div className="absolute  left-1.5 top-1.5 border border-primary-100 bg-primary-30 text-primary-100 text-xs font-bold rounded-full px-3 py-1">
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
    </div>
  );
};

export default WebinarItem;
