import React, { forwardRef } from "react";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, icon, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs font-bold text-gray-500 ml-1">{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
              {icon}
            </div>
          )}
        <textarea
          ref={ref}
          className={`
            w-full bg-gray-100/80 border 
            ${
              error
                ? "border-red-500 focus:border-red-500"
                : "border-transparent focus:border-blue-500"
            }
            focus:bg-white text-gray-900 rounded-lg px-4 py-3 outline-none transition-all placeholder:text-gray-400 min-h-[100px] resize-y
            ${className}
          `}
          {...props}
        />
        </div>
        {error && <p className="text-xs text-red-500 ml-1 mt-1">{error}</p>}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
export default FormTextarea;
