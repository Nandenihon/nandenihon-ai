"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";

export interface DatePickerProps {
  /** Selected date as an ISO string (YYYY-MM-DD), same shape as a native date input value. */
  value?: string;
  /** Called with the newly selected date as an ISO string (YYYY-MM-DD). */
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
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

function formatDisplay(value?: string): string {
  if (!value) return "";
  const parsed = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!parsed) return value;
  const date = new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]));
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Pilih tanggal",
  min,
  max,
  error,
  helperText,
  disabled = false,
  required = false,
  id,
  name,
  className,
}: DatePickerProps) {
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
          <div className="absolute left-0 top-full z-50 mt-2" role="dialog">
            <Calendar
              value={value}
              min={min}
              max={max}
              onChange={(next) => {
                onChange?.(next);
                setIsOpen(false);
              }}
            />
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
