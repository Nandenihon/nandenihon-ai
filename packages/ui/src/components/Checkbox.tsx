import React, { forwardRef } from "react";
import { Checklist } from "../icons/Checklist";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

const CheckIcon = ({ disabled }: { disabled?: boolean }) => (
  <Checklist 
    className={`pointer-events-none transition-opacity duration-200 w-[14px] h-[10px] ${
      disabled ? "text-neutral-50" : "text-primary-base ml-[1px] mt-[1px]"
    }`}
  />
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = "", containerClassName = "", disabled, ...props }, ref) => {
    const checkboxStyles = `
      peer relative appearance-none shrink-0 w-6 h-6 rounded border-2 transition-all cursor-pointer
      outline-none disabled:cursor-not-allowed
      
      /* Unselected State */
      bg-neutral-20 border-neutral-70
      hover:bg-primary-30 hover:border-primary-70
      
      /* Selected State (Checked) */
      checked:bg-primary-30 checked:border-primary-70
      checked:hover:bg-primary-10 checked:hover:border-primary-70

      /* Disabled State */
      disabled:bg-neutral-40 disabled:border-neutral-50
      disabled:hover:bg-neutral-40 disabled:hover:border-neutral-50
      checked:disabled:bg-neutral-40 checked:disabled:border-neutral-50
    `;

    return (
      <label className={`inline-flex items-start gap-3 cursor-pointer group ${disabled ? "cursor-not-allowed" : ""} ${containerClassName}`}>
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={`${checkboxStyles} ${className}`}
            {...props}
          />
          <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
            <CheckIcon disabled={disabled} />
          </div>
        </div>

        {label && (
          <span className={`text-base font-medium select-none ${disabled ? "text-neutral-40" : "text-neutral-90"}`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
