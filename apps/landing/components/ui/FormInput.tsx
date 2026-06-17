import React, { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs font-bold text-gray-500 ml-1">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full bg-gray-100/80 border text-gray-900
              ${error ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'}
              focus:bg-white rounded-lg py-3 outline-none transition-all placeholder:text-gray-400
              ${icon ? 'pl-11 pr-4' : 'px-4'} 
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

FormInput.displayName = 'FormInput';
export default FormInput;