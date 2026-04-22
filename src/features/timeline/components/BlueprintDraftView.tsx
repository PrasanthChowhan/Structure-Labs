import { Sparkles } from "lucide-react";
import { useTimeline } from "../context/TimelineContext";
import { cn, getSegmentStyle } from "../../../lib/utils";

interface BlueprintDraftViewProps {
  currentTime: number;
  highlightedSegmentId: number | null;
  seekTo: (seconds: number, index: number) => void;
  isFocusMode: boolean;
}

export function BlueprintDraftView({ 
  currentTime, 
  highlightedSegmentId, 
  seekTo,
  isFocusMode
}: BlueprintDraftViewProps) {
  const { 
    result, 
    drafts, 
    setDrafts, 
    targetAudience, 
    setTargetAudience 
  } = useTimeline();

  return (
    <div className="flex-1 overflow-y-auto bg-white border border-border-cream rounded-hero shadow-whisper">
      {/* Sticky Header Row */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-border-cream">
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-4 transition-all",
          isFocusMode ? "p-3 px-4" : "p-4 px-6"
        )}>
          {/* Left Header */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={cn("font-serif text-near-black", isFocusMode ? "text-lg" : "text-xl")}>The Blueprint</h3>
              <span className="text-[9px] font-bold text-olive-gray uppercase tracking-widest bg-warm-sand/30 px-1.5 py-0.5 rounded">
                {result?.video_structure.length || 0} SECTIONS
              </span>
            </div>
            <p className="text-[10px] text-stone-gray">Original structure logic.</p>
          </div>
          {/* Right Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className={cn("font-serif text-near-black", isFocusMode ? "text-lg" : "text-xl")}>Adaptation Script</h3>
              <p className="text-[10px] text-stone-gray">Drafting area.</p>
            </div>
            <select 
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="bg-warm-sand/20 border border-border-cream rounded-comfort px-2.5 py-1 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all cursor-pointer"
            >
              <option>SaaS Founders</option>
              <option>Creators</option>
              <option>Marketers</option>
              <option>Agency Owners</option>
            </select>
          </div>
        </div>
      </div>

      <div className={cn(
        "space-y-4 transition-all",
        isFocusMode ? "p-4" : "p-6"
      )}>
        {result ? (
          result.video_structure.map((section, index) => {
            const isActive = currentTime >= section.seconds && 
              (index === result.video_structure.length - 1 || currentTime < result.video_structure[index + 1].seconds);
            const isHighlighted = highlightedSegmentId === index;
            const style = getSegmentStyle(section.segment_type);
            const draft = drafts[index] || "";
            const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
            const estDuration = Math.ceil((wordCount / 150) * 60); // 150 wpm

            return (
              <div 
                key={index} 
                id={`segment-${index}`} 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 relative group/row"
              >
                {/* Left Column: Blueprint Card */}
                <button
                  onClick={() => seekTo(section.seconds, index)}
                  className={cn(
                    "text-left transition-all rounded-generous border-l-4 flex flex-col gap-3",
                    isFocusMode ? "p-4" : "p-5",
                    isActive ? "bg-parchment/50 border-terracotta" : "bg-parchment/20 border-transparent hover:bg-parchment/30",
                    isHighlighted && "ring-2 ring-inset ring-terracotta/20 bg-terracotta/[0.03] scale-[1.01] z-10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-mono",
                      isActive ? "text-terracotta font-bold" : "text-stone-gray"
                    )}>
                      {section.timestamp}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border",
                      style.bg, style.text, style.border
                    )}>
                      {section.segment_type}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className={cn(
                      "font-serif transition-colors",
                      isFocusMode ? "text-base" : "text-lg",
                      isActive ? "text-near-black font-semibold" : "text-olive-gray group-hover/row:text-near-black"
                    )}>
                      {section.title}
                    </h4>
                    <p className="text-xs text-stone-gray leading-relaxed italic line-clamp-3">
                      "{section.description}"
                    </p>
                  </div>

                  <div className="mt-auto pt-3 border-t border-border-cream/50">
                     <div className="text-[9px] font-bold text-olive-gray uppercase tracking-widest mb-0.5">Why it works</div>
                     <p className="text-[11px] text-olive-gray/80 leading-relaxed line-clamp-2">
                       This segment establishes {section.segment_type.toLowerCase()} by focusing on {section.title.toLowerCase()}.
                     </p>
                  </div>
                </button>

                {/* Right Column: Draft Area */}
                <div className={cn(
                  "bg-white border-2 rounded-generous flex flex-col gap-3 transition-all shadow-sm",
                  isFocusMode ? "p-4" : "p-5",
                  isActive ? style.border : "border-border-cream",
                  "focus-within:border-terracotta/30 focus-within:shadow-md"
                )}>
                  <div className="flex items-center justify-between">
                     <h4 className="text-[11px] font-bold text-near-black uppercase tracking-wider">
                       {index + 1}. {section.segment_type} Draft
                     </h4>
                     <div className={cn("w-1.5 h-1.5 rounded-full", style.indicator)} />
                  </div>

                  <textarea
                    placeholder={`Draft your ${section.segment_type.toLowerCase()} here...`}
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [index]: e.target.value })}
                    className={cn(
                      "flex-1 w-full text-sm text-near-black bg-transparent border-none focus:outline-none resize-none placeholder:text-stone-gray/50 leading-relaxed",
                      isFocusMode ? "min-h-[80px]" : "min-h-[100px]"
                    )}
                  />

                  <div className="flex items-center justify-between pt-3 border-t border-border-cream">
                    <div className="flex gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-stone-gray uppercase font-bold tracking-tighter">Words</span>
                        <span className="text-[11px] font-mono">{wordCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-stone-gray uppercase font-bold tracking-tighter">Est. Time</span>
                        <span className="text-[11px] font-mono">{estDuration}s</span>
                      </div>
                    </div>
                    <button 
                      className="px-3 py-1.5 bg-near-black text-ivory rounded-comfort text-[11px] font-medium hover:bg-near-black/90 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-stone-gray italic text-sm">
            Analyze a video to see the structural breakdown here.
          </div>
        )}
      </div>
    </div>
  );
}
