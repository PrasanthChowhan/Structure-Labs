import { Tooltip } from "../../../components/ui/Tooltip";
import { useTimeline } from "../context/TimelineContext";
import { cn, getSegmentStyle, SEGMENT_COLORS } from "../../../lib/utils";

interface ProportionalTimelineProps {
  currentTime: number;
  seekTo: (seconds: number, index: number) => void;
  isFocusMode: boolean;
}

export function ProportionalTimeline({ currentTime, seekTo, isFocusMode }: ProportionalTimelineProps) {
  const { result, media } = useTimeline();

  return (
    <div className={cn(
      "bg-white border border-border-cream rounded-generous shadow-whisper flex flex-col relative transition-all duration-500",
      isFocusMode ? "h-14 p-0.5" : "h-24 p-1"
    )}>
      <div className="flex-1 flex gap-px rounded-[10px] overflow-hidden bg-border-cream/30 relative">
         {result && media ? (
           result.video_structure.map((section, index) => {
              const nextSection = result.video_structure[index + 1];
              const endSec = nextSection ? nextSection.seconds : media.duration;
              const duration = endSec - section.seconds;
              const widthPercent = (duration / media.duration) * 100;
              const style = getSegmentStyle(section.segment_type);

              return (
                <Tooltip 
                  key={index} 
                  content={`${section.segment_type}: ${section.title}`} 
                  className="max-w-xs whitespace-normal"
                  style={{ width: `${widthPercent}%` }}
                >
                  <button
                    onClick={() => seekTo(section.seconds, index)}
                    className={cn(
                      "h-full transition-all flex flex-col justify-center px-3 overflow-hidden text-left relative group/seg",
                      style.bg,
                      "hover:brightness-95 border-x border-border-cream/50"
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.indicator)} />
                    {!isFocusMode && (
                      <span className="text-[9px] font-mono text-stone-gray block mb-0.5 opacity-70 uppercase tracking-tighter">
                        {section.segment_type}
                      </span>
                    )}
                    <span className={cn(
                      "font-serif font-medium text-near-black truncate",
                      isFocusMode ? "text-[10px]" : "text-[11px]"
                    )}>
                      {section.title}
                    </span>
                  </button>
                </Tooltip>
              );
           })
         ) : (
           <div className="w-full h-full flex items-center justify-center text-stone-gray/30 text-xs italic tracking-wider">
              Timeline will appear after analysis
           </div>
         )}

         {/* Live Current-Time Indicator (Handle) */}
         {media && (
           <div 
             className="absolute top-0 bottom-0 w-0.5 bg-near-black z-10 pointer-events-none transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(0,0,0,0.3)]"
             style={{ left: `${(currentTime / media.duration) * 100}%` }}
           >
             <div className={cn(
               "absolute top-0 left-1/2 -translate-x-1/2 bg-near-black rounded-full shadow-md border-2 border-white",
               isFocusMode ? "w-2 h-2" : "w-3 h-3"
             )} />
             <div className={cn(
               "absolute bottom-0 left-1/2 -translate-x-1/2 bg-near-black rounded-full shadow-md border-2 border-white",
               isFocusMode ? "w-2 h-2" : "w-3 h-3"
             )} />
           </div>
         )}
      </div>
      {!isFocusMode && (
        <div className="flex items-center gap-4 mt-2 px-2 overflow-x-auto no-scrollbar">
           {Object.entries(SEGMENT_COLORS).map(([type, colors]) => (
             <div key={type} className="flex items-center gap-1.5 shrink-0">
                <div className={cn("w-2 h-2 rounded-full", colors.indicator)} />
                <span className="text-[10px] font-medium text-stone-gray uppercase tracking-wider">{type}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
