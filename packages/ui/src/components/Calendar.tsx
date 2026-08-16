"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

// Monday-first, matching the Figma design (Sen ... Min).
const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export interface CalendarProps {
  /** Selected date as an ISO string (YYYY-MM-DD). */
  value?: string;
  /** Called with the selected date as an ISO string (YYYY-MM-DD). */
  onChange?: (value: string) => void;
  /** Earliest selectable date (YYYY-MM-DD). */
  min?: string;
  /** Latest selectable date (YYYY-MM-DD). */
  max?: string;
  /** Render without the card container (border/rounded/shadow/fixed width) for embedding. */
  bare?: boolean;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

function parseISO(value?: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

export default function Calendar({ value, onChange, min, max, bare = false, className }: CalendarProps) {
  const selected = parseISO(value);
  const now = new Date();
  const todayISO = toISO(now.getFullYear(), now.getMonth(), now.getDate());

  const [view, setView] = useState(() => ({
    year: selected ? selected.year : now.getFullYear(),
    month: selected ? selected.month : now.getMonth(),
  }));

  const goToMonth = (delta: number) => {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // getDay(): 0=Sun..6=Sat -> convert to Monday-first offset (0=Mon..6=Sun).
  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  const containerClasses = bare
    ? "w-full bg-absolute-white pt-2 pb-4"
    : "w-[340px] rounded-2xl border border-neutral-10 bg-absolute-white pt-2 pb-4 shadow-[0_0_20px_2px_#0000001A]";

  return (
    <div className={`${containerClasses} ${className || ""}`}>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => goToMonth(-1)}
          className="rounded-lg p-1 text-neutral-90 transition-colors hover:bg-neutral-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-neutral-90">
          {MONTHS_ID[view.month]} {view.year}
        </span>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => goToMonth(1)}
          className="rounded-lg p-1 text-neutral-90 transition-colors hover:bg-neutral-10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="border-t border-neutral-10" />

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-4 pt-2">
        {DAYS_ID.map((day) => (
          <div
            key={day}
            className="flex h-9 items-center justify-center text-xs font-semibold text-neutral-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 px-4">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="size-11" aria-hidden />;
          }

          const iso = toISO(view.year, view.month, day);
          const disabled = isDisabled(iso);
          const isSelected =
            !!selected &&
            selected.year === view.year &&
            selected.month === view.month &&
            selected.day === day;
          const isToday = iso === todayISO;

          let stateClasses =
            "text-neutral-90 hover:bg-primary-10 active:bg-primary-80 active:text-absolute-white";
          if (disabled) {
            stateClasses = "text-neutral-20";
          } else if (isSelected) {
            stateClasses = "bg-primary-base text-absolute-white";
          } else if (isToday) {
            stateClasses = "border-2 border-primary-base text-primary-base hover:bg-primary-10";
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange?.(iso)}
              className="flex size-11 items-center justify-center p-0.5 disabled:cursor-not-allowed"
            >
              <span
                className={`flex h-full w-full items-center justify-center rounded-full text-sm font-semibold transition-colors ${stateClasses}`}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
