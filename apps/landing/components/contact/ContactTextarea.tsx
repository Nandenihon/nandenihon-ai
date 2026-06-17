type ContactTextareaProps = {
  label: string;
  placeholder: string;
};

export default function ContactTextarea({
  label,
  placeholder,
}: ContactTextareaProps) {
  return (
    <div className="w-full">
      <label className="mb-1 flex items-start gap-1 text-sm font-semibold text-[#808080]">
        {label}
      </label>

      <div className="flex w-full rounded-[8px] border border-[#B3B3B3] bg-[#F9F9F9] px-3 py-2">
        <textarea
          placeholder={placeholder}
          className="h-[143px] w-full min-w-0 resize-none bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}