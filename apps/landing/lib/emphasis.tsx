import { Fragment, type ReactNode } from "react";

/** Renders translation strings that mark emphasis as **word**, e.g. "Saya **SETUJU** dan ...". */
export function renderEmphasis(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>,
  );
}
