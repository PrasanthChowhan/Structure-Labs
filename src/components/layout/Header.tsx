import { Search, Loader2, Sparkles, User, Info, HelpCircle, Maximize2, Minimize2 } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/utils";

interface HeaderProps {
  url: string;
  setUrl: (url: string) => void;
  niche: string;
  setNiche: (niche: string) => void;
  isLoading: boolean;
  handleAnalyze: (e: React.FormEvent) => void;
  isFocusMode: boolean;
  setIsFocusMode: (value: boolean) => void;
}

export function Header({ 
  url, 
  setUrl, 
  niche, 
  setNiche, 
  isLoading, 
  handleAnalyze,
  isFocusMode,
  setIsFocusMode
}: HeaderProps) {
  return (
    <header className={cn(
      "border-b border-border-cream bg-white/50 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0 transition-all",
      isFocusMode ? "h-11" : "h-12"
    )}>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-terracotta rounded-full flex items-center justify-center">
            <span className="text-[9px] text-ivory font-bold">SL</span>
          </div>
          <span className="font-serif font-medium text-base tracking-tight">Structure Labs</span>
        </div>

        <form onSubmit={handleAnalyze} className="flex items-center gap-2">
          <div className="relative w-64 group">
            <input
              type="text"
              placeholder="Analyze URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-7 bg-warm-sand/30 border border-border-cream rounded-comfort px-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-gray w-3 h-3" />
          </div>

          <div className="relative w-40 group">
            <input
              type="text"
              placeholder="Target niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full h-7 bg-warm-sand/30 border border-border-cream rounded-comfort px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url}
            className="h-7 px-3 bg-terracotta text-ivory rounded-comfort text-[11px] font-medium hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Analyze
          </button>
        </form>
      </div>

      <nav className="flex items-center gap-5">
        <Tooltip content={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}>
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-comfort transition-all",
              isFocusMode ? "bg-terracotta text-ivory" : "bg-warm-sand/50 text-olive-gray hover:bg-warm-sand"
            )}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
        
        <div className="h-4 w-px bg-border-cream" />
        
        <button className="text-[11px] font-medium text-olive-gray hover:text-near-black flex items-center gap-1.5 transition-colors">
          <Info className="w-3 h-3" /> About
        </button>
        <button className="text-[11px] font-medium text-olive-gray hover:text-near-black flex items-center gap-1.5 transition-colors">
          <HelpCircle className="w-3 h-3" /> Help
        </button>
        
        <Tooltip content="Profile">
          <button className="w-7 h-7 bg-warm-sand/50 rounded-full flex items-center justify-center hover:bg-warm-sand transition-colors">
            <User className="w-3.5 h-3.5 text-olive-gray" />
          </button>
        </Tooltip>
      </nav>
    </header>
  );
}
