"use client";

import { useState } from "react";

interface ImageUploadFieldProps {
    label: string;
    value: string;
    folder: string;
    onChange: (value: string) => void;
}

export default function ImageUploadField({ label, value, folder, onChange }: ImageUploadFieldProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (file: File | undefined) => {
        if (!file) return;

        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload gagal");
            }

            onChange(data.url);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Upload gagal");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-70">{label}</label>
            {value && (
                <div className="flex items-center gap-3 rounded-xl border border-neutral-20 bg-neutral-0 p-2">
                    <img src={value} alt="Preview upload" className="h-14 w-14 rounded-lg object-cover bg-neutral-10" />
                    <span className="min-w-0 flex-1 truncate text-xs text-neutral-50">{value}</span>
                </div>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="/uploads/images/filename.jpg atau https://..."
                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary-10 px-4 py-2.5 text-sm font-semibold text-primary-base hover:bg-primary-20 transition-all">
                    {isUploading ? "Uploading..." : "Upload"}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(event) => {
                            void handleUpload(event.target.files?.[0]);
                            event.target.value = "";
                        }}
                    />
                </label>
            </div>
            {error && <p className="text-xs font-medium text-error-base">{error}</p>}
            <p className="text-xs text-neutral-40">File disimpan di VPS dan bisa diakses via URL di atas.</p>
        </div>
    );
}
