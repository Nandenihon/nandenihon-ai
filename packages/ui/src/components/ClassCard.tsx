import Image from "next/image";
import Button from "./Button";

export interface ClassCardProps {
  title: string;
  description: string;
  image?: string;
  price: string;
  duration: string; 
  onStart?: () => void;
  onDetail?: () => void;
  className?: string;
}

export const ClassCard = ({
  title,
  description,
  image,
  price,
  duration,
  onStart,
  onDetail,
  className = "",
}: ClassCardProps) => {
  return (
    <div className={`bg-absolute-white rounded-2xl p-5 shadow-lg flex flex-col gap-4 border border-neutral-10 w-full max-w-[360px] ${className}`}>
      <div className="relative h-48 w-full rounded-xl overflow-hidden">
        <Image
          src={image || "/images/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-primary-20 text-neutral-90 px-3 py-1 rounded-full text-xs font-bold border border-primary-30 backdrop-blur-sm">
          {price}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-neutral-90">{title}</h3>
          <p className="text-neutral-80 text-base font-normal leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-neutral-90">Durasi</span>
          <ul className="list-disc list-inside text-base font-normal text-neutral-80 pl-1">
             <li>{duration}</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <div className="flex-1">
            <Button 
                variant="primary" 
                size="medium" 
                className="w-full justify-center"
                onClick={onStart}
            >
                Mulai Belajar
            </Button>
        </div>
        <div className="flex-1">
            <Button 
                variant="secondary" 
                size="medium" 
                className="w-full justify-center"
                onClick={onDetail}
            >
                Detail Kelas
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
