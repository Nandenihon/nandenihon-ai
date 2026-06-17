type Props = {
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
};

export default function ContactField({ label, placeholder, icon }: Props) {
  return (
    <div className="w-full flex-1">
      <label className="mb-1 flex items-start gap-1 text-sm font-semibold text-[#808080]">
        {label}
      </label>

      <div className="flex min-h-[36px] w-full items-center gap-2 rounded-[8px] border border-[#B3B3B3] bg-[#F9F9F9] px-3 py-2">
        {icon && <div className="flex shrink-0 items-center">{icon}</div>}

        <input
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}