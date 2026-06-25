import React from "react";

export type ClassItemProps = {
  id: number;
  title: string;
  type: string;
  image: string;
  price: string;
  description: string;
  slot: boolean;
};

const ClassItem = (props: ClassItemProps) => {
  return (
    <div className="bg-white p-5 shadow-[0px_0px_20px_2px_#0000001A] rounded-2xl ">
      <div className="relative h-52.5 w-auto">
        <img
          src={props.image}
          className=" h-full rounded-lg object-cover w-full"
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
      </div>
      {props.slot ? (
        <button className="btn block w-full mt-10">Amankan Slot Kamu!</button>
      ) : (
        <div className="flex space-x-2">
          <button className="btn block w-full mt-10">Buka Akses</button>
          <button className="btn block bg-white text-primary-base border-2 border-primary-base w-full mt-10">
            Detail Kelas
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassItem;
