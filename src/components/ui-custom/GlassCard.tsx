
import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  clickEffect?: boolean;
  variant?: "default" | "primary" | "secondary" | "accent";
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = true,
  clickEffect = true,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-white/40 dark:bg-black/40 border-white/30 dark:border-white/10",
    primary: "bg-primary/10 dark:bg-primary/10 border-primary/30 dark:border-primary/20",
    secondary: "bg-secondary/60 dark:bg-secondary/20 border-secondary/30 dark:border-secondary/10",
    accent: "bg-accent/60 dark:bg-accent/20 border-accent/30 dark:border-accent/10",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl backdrop-blur-md border shadow-sm soft-shadow",
        variantStyles[variant],
        hoverEffect && "transition-all duration-300 ease-out hover:shadow-md hover:bg-white/60 dark:hover:bg-black/60 hover:scale-[1.005]",
        clickEffect && "active:scale-[0.995] active:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
