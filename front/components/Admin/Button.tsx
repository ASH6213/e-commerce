import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
};

const Button: React.FC<Props> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
}) => {
  const baseClasses = "font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue hover:bg-opacity-90 text-white focus:ring-blue",
    secondary: "bg-gray300 hover:bg-gray400 text-gray500 focus:ring-gray400",
    danger: "bg-red hover:bg-opacity-90 text-white focus:ring-red",
    success: "bg-green hover:bg-opacity-90 text-white focus:ring-green",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses}`}
    >
      {children}
    </button>
  );
};

export default Button;
