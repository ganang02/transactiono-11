
import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  clickEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = true,
  clickEffect = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-sm",
        hoverEffect && "transition-all duration-300 ease-out hover:shadow-md hover:bg-white/60 dark:hover:bg-black/60 hover:scale-[1.01]",
        clickEffect && "active:scale-[0.99] active:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
