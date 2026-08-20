"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import Calendar from "./Calendar";

export interface DateTimePickerProps {
  /** Selected value in `datetime-local` format (YYYY-MM-DDTHH:mm). */
  value?: string;
  /** Called with the new value in `datetime-local` format (YYYY-MM-DDTHH:mm). */
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Earliest selectable date (YYYY-MM-DD or full datetime; only the date part bounds the calendar). */
  min?: string;
  max?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function splitValue(value?: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function combine(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatDisplay(value?: string): string {
  const { date, time } = splitValue(value);
  if (!date) return "";
  const parsed = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!parsed) return value || "";
  const d = new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]));
  const dateLabel = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
  return time ? `${dateLabel} · ${time}` : dateLabel;
}

export default function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Pilih tanggal & waktu",
  min,
  max,
  error,
  helperText,
  disabled = false,
  required = false,
  id,
  name,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const { date, time } = splitValue(value);
  const display = formatDisplay(value);

  const borderClasses = error
    ? "border-error-base focus:border-error-base"
    : isOpen
    ? "border-primary-base"
    : "border-neutral-20 hover:border-primary-base";

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className || ""}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-neutral-70">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Hidden field so the value participates in native form submission/validation. */}
        <input type="hidden" name={name} value={value || ""} required={required} readOnly />

        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-neutral-0 px-4 py-2.5 text-left text-sm outline-none transition-all disabled:cursor-not-allowed disabled:bg-neutral-10 disabled:text-neutral-40 ${borderClasses}`}
        >
          <span className={display ? "text-neutral-80" : "text-neutral-40"}>
            {display || placeholder}
          </span>
          <CalendarIcon
            className={`h-4 w-4 shrink-0 ${error ? "text-error-base" : "text-primary-base"}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-2 w-[340px] rounded-2xl border border-neutral-10 bg-absolute-white shadow-[0_0_20px_2px_#0000001A]"
            role="dialog"
          >
            <Calendar
              bare
              value={date}
              min={min ? min.slice(0, 10) : undefined}
              max={max ? max.slice(0, 10) : undefined}
              onChange={(nextDate) => onChange?.(combine(nextDate, time))}
            />

            <div className="flex items-center gap-2 border-t border-neutral-10 px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-primary-base" />
              <label htmlFor={id ? `${id}-time` : undefined} className="text-sm font-semibold text-neutral-70">
                Waktu
              </label>
              <input
                id={id ? `${id}-time` : undefined}
                type="time"
                value={time}
                onChange={(event) => onChange?.(combine(date || todayISO(), event.target.value))}
                className="ml-auto rounded-lg border border-neutral-20 bg-neutral-0 px-3 py-1.5 text-sm text-neutral-80 outline-none transition-all focus:border-primary-base"
              />
            </div>

            <div className="px-4 pb-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg bg-primary-base py-2 text-sm font-semibold text-absolute-white transition-colors hover:bg-primary-80"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="ml-1 text-xs font-normal text-error-base">{error}</p>}
      {helperText && !error && (
        <p className="ml-1 text-xs font-normal text-neutral-50">{helperText}</p>
      )}
    </div>
  );
}
