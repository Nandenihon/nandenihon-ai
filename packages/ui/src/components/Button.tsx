import React from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "large" | "medium" | "small";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "medium",
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses =
    "flex items-center justify-center font-semibold transition-all rounded-lg disabled:cursor-not-allowed gap-2";

  const variantClasses = {
    primary: `
      bg-primary-base text-absolute-white border-0
      hover:bg-primary-80
      active:bg-primary-100
      disabled:bg-neutral-30 disabled:border-2 disabled:border-neutral-40
    `,
    secondary: `
      bg-absolute-white text-primary-base border-2 border-primary-base
      hover:bg-primary-20 hover:border
      active:bg-primary-40 active:border
      disabled:bg-neutral-30 disabled:border-2 disabled:border-neutral-40 disabled:text-absolute-white
    `,
    tertiary: `
      bg-transparent text-primary-base border-0
      hover:bg-primary-10
      active:bg-primary-20
      disabled:bg-neutral-30 disabled:border-2 disabled:border-neutral-40 disabled:text-absolute-white
    `,
  };

  const sizeClasses = {
    large: "text-lg py-2 px-6",
    medium: "text-lg py-[6px] px-6",
    small: "text-base py-[4px] px-6",
  };

  const iconSizeClasses = {
    large: "h-6 w-6",
    medium: "h-5 w-5",
    small: "h-4 w-4",
  };

  const currentIconSize = iconSizeClasses[size];

  const renderIcon = (icon: React.ReactNode) => {
    if (!icon) return null;
    return <span className={currentIconSize}>{icon}</span>;
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {renderIcon(leftIcon)}
      {children}
      {renderIcon(rightIcon)}
    </button>
  );
};

export default Button;
