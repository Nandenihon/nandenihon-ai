"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export default function FilterSelect({
    options,
    value,
    buildUrl,
    className = "",
}: {
    options: Option[];
    value: string;
    buildUrl: string; // URL template with "__VALUE__" placeholder for the selected option's value
    className?: string;
}) {
    const router = useRouter();

    return (
        <select
            defaultValue={value}
            onChange={(event) => router.push(buildUrl.replace("__VALUE__", encodeURIComponent(event.target.value)))}
            className={`text-sm bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-neutral-70 outline-none focus:border-primary-base transition-all ${className}`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );
}
