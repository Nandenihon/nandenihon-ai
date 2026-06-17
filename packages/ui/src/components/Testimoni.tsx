import Image from "next/image";

export interface TestimoniProps {
  content: string;
  name: string;
  age: number | string;
  photo?: string;
  className?: string;
}

export const Testimoni = ({
  content,
  name,
  age,
  photo,
  className = "",
}: TestimoniProps) => {
  return (
    <div className={`bg-absolute-white rounded-2xl w-full sm:w-[494px] overflow-hidden shadow-sm flex flex-col ${className}`}>
      <div className="p-6 pb-12 flex-grow">
        <p className="text-neutral-60 font-medium text-lg leading-relaxed">
          {content}
        </p>
      </div>

      <div className="bg-neutral-10 p-6 flex items-center justify-between relative">
        <div className="flex flex-col">
          <h4 className="text-xl font-bold text-neutral-90">{name}</h4>
          <p className="text-neutral-50 text-base">{age} tahun</p>
        </div>

        <div className="absolute right-6 -top-10">
          <div className="relative h-24 w-24 rounded-full border-[8px] border-absolute-white shadow-sm overflow-hidden bg-neutral-20">
            <Image
              src={photo || "/images/placeholder.jpg"}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimoni;