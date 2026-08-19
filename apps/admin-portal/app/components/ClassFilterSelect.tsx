"use client";

import { useRouter } from "next/navigation";

type ClassOption = { id: number; code: string; name: string };

export default function ClassFilterSelect({
    classOptions,
    value,
    buildUrl,
}: {
    classOptions: ClassOption[];
    value: string;
    buildUrl: string; // URL template with "__CLASS_ID__" placeholder for the selected value
}) {
    const router = useRouter();

    return (
        <select
            defaultValue={value}
            onChange={(event) => router.push(buildUrl.replace("__CLASS_ID__", event.target.value))}
            className="text-sm bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-neutral-70 outline-none focus:border-primary-base transition-all"
        >
            <option value="">Semua kelas</option>
            {classOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.code} — {option.name}</option>
            ))}
        </select>
    );
}
