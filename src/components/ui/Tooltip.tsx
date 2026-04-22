import { useState } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Tooltip({ content, children, className, style }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      style={style}
    >
      {children}
      {isVisible && (
        <div 
          role="tooltip"
          className={cn(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50",
            "px-2.5 py-1.5 bg-near-black text-warm-silver text-[10px] font-sans font-medium rounded-comfort shadow-whisper whitespace-nowrap",
            "animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-200",
            className
          )}
        >
          {content}
          {/* Subtle arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-near-black" />
        </div>
      )}
    </div>
  );
}
