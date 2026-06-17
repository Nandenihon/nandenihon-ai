import React, { forwardRef } from "react";
import { Upload } from "lucide-react";

interface FormFileProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const FormFile = forwardRef<HTMLInputElement, FormFileProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                <label className="text-xs font-bold text-gray-500 ml-1">{label}</label>
                <div className="relative group">
                    <input
                        type="file"
                        ref={ref}
                        className={`
              w-full bg-gray-100/80 border 
              ${error ? "border-red-500" : "border-transparent"}
              text-gray-500 text-sm rounded-lg cursor-pointer
              
              file:pl-10 file:pr-4 
              file:py-3 
              file:mr-4

              file:rounded-l-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-300 file:text-primary-base
              hover:file:bg-blue-200
              file:transition-colors
              py-0 pl-0 pr-10
              ${className}
            `}
                        {...props}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <Upload className="text-primary-base w-5 h-5" />
                    </div>
                </div>
                {error && <p className="text-xs text-red-500 ml-1 mt-1">{error}</p>}
            </div>
        );
    }
);

FormFile.displayName = "FormFile";
export default FormFile;
