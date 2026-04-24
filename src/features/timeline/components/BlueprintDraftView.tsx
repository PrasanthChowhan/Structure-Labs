import { useTimeline } from "../context/TimelineContext";
import { cn, getSegmentStyle } from "../../../lib/utils";
import { ScriptEditor } from "../../scripting/components/editor/ScriptEditor";

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
    targetAudience, 
    setTargetAudience 
  } = useTimeline();

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left Column: The Blueprint */}
      <div className="w-1/2 flex flex-col border-r border-border-cream min-w-0">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-border-cream p-4 px-6 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={cn("font-serif text-near-black", isFocusMode ? "text-lg" : "text-xl")}>The Blueprint</h3>
            <span className="text-[9px] font-bold text-olive-gray uppercase tracking-widest bg-warm-sand/30 px-1.5 py-0.5 rounded">
              {result?.video_structure.length || 0} SECTIONS
            </span>
          </div>
          <p className="text-[10px] text-stone-gray">Original structure logic.</p>
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all",
          isFocusMode ? "p-4 space-y-3" : "p-6 space-y-4"
        )}>
          {result ? (
            result.video_structure.map((section, index) => {
              const isActive = currentTime >= section.seconds && 
                (index === result.video_structure.length - 1 || currentTime < result.video_structure[index + 1].seconds);
              const isHighlighted = highlightedSegmentId === index;
              const style = getSegmentStyle(section.segment_type);

              return (
                <button
                  key={index}
                  id={`segment-${index}`}
                  onClick={() => seekTo(section.seconds, index)}
                  className={cn(
                    "w-full text-left transition-all rounded-generous border-l-4 flex flex-col gap-3 relative group/row shadow-sm",
                    isFocusMode ? "p-3" : "p-4",
                    isActive ? "bg-parchment/50 border-terracotta" : "bg-parchment/20 border-transparent hover:bg-parchment/30",
                    isHighlighted && "ring-2 ring-inset ring-terracotta/20 bg-terracotta/[0.03] scale-[1.01] z-10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-mono",
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
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className={cn(
                      "font-serif transition-colors",
                      isFocusMode ? "text-sm" : "text-base",
                      isActive ? "text-near-black font-semibold" : "text-olive-gray group-hover/row:text-near-black"
                    )}>
                      {section.title}
                    </h4>
                    
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold text-stone-gray uppercase tracking-tighter">What was said</div>
                      <p className="text-[11px] text-near-black/80 leading-relaxed italic line-clamp-3">
                        "{section.description}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border-cream/50">
                      <div className="text-[9px] font-bold text-terracotta uppercase tracking-tighter mb-0.5">Why it works</div>
                      <p className="text-[10px] text-olive-gray leading-relaxed">
                        This {section.segment_type.toLowerCase()} establishes retention by {section.title.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-12 text-center text-stone-gray italic text-sm">
              Analyze a video to see the structural breakdown here.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Adaptation Script */}
      <div className="w-1/2 flex flex-col min-w-0 bg-ivory/30">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-border-cream p-4 px-6 shrink-0 flex items-center justify-between">
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

        <div className="flex-1 overflow-y-auto custom-scrollbar py-12">
          <div className="max-w-3xl mx-auto">
            <ScriptEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
