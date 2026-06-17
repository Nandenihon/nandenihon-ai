import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Option[];
    error?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, options, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                <label className="text-xs font-bold text-gray-500 ml-1">
                    {label}
                </label>
                <div className="relative">
                    <select
                        ref={ref}
                        className={`
              w-full bg-gray-100/80 border 
              ${error ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'}
              focus:bg-white text-gray-900 invalid:text-gray-400 rounded-lg px-4 py-3 outline-none transition-all appearance-none cursor-pointer text-sm
            `}
                        {...props}
                    >
                        <option value="" disabled>Pilih di sini</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-primary" />
                    </div>
                </div>
                {error && <p className="text-xs text-red-500 ml-1 mt-1">{error}</p>}
            </div>
        );
    }
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
