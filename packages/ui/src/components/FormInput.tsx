import React, { forwardRef } from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    error?: string;
    helperText?: string;
    variant?: 'subtle' | 'primary';
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, leftIcon, rightIcon, error, helperText, variant = 'subtle', className, ...props }, ref) => {
        const baseInputClasses = `
            w-full bg-neutral-0 rounded-lg py-3 outline-none transition-all text-base font-medium
            text-neutral-90 placeholder:text-neutral-50
            disabled:bg-neutral-30 disabled:border-neutral-40 disabled:cursor-not-allowed
            focus:border-primary-30 focus:border-2 focus:placeholder:text-neutral-30
        `;

        const variantClasses = variant === 'primary' 
            ? 'border-primary-base border' 
            : 'border-neutral-30 border';

        const errorClasses = error 
            ? 'border-error-base text-error-base placeholder:text-error-base focus:border-error-base' 
            : '';

        return (
            <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-semibold text-neutral-50 ml-1">
                    {label}
                </label>
                <div className="relative">
                    {leftIcon && (
                        <div className={`
                            absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none h-5 w-5
                            ${error ? 'text-error-base' : 'text-primary-base'}
                        `}>
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        className={`
                            ${baseInputClasses}
                            ${variantClasses}
                            ${errorClasses}
                            ${leftIcon ? 'pl-11' : 'pl-4'} 
                            ${rightIcon ? 'pr-11' : 'pr-4'}
                            ${className}
                        `}
                        {...props}
                    />

                    {rightIcon && (
                        <div className={`
                            absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none h-5 w-5
                            ${error ? 'text-error-base' : 'text-primary-base'}
                        `}>
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-error-base font-normal ml-1">{error}</p>}
                {helperText && !error && <p className="text-xs text-neutral-50 font-normal ml-1">{helperText}</p>}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
export default FormInput;
