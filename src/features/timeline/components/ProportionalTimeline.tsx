import { Tooltip } from "../../../components/ui/Tooltip";
import { useTimeline } from "../context/TimelineContext";
import { cn, getSegmentStyle } from "../../../lib/utils";

interface ProportionalTimelineProps {
  currentTime: number;
  seekTo: (seconds: number, index: number) => void;
  isFocusMode: boolean;
}

export function ProportionalTimeline({ currentTime, seekTo, isFocusMode }: ProportionalTimelineProps) {
  const { result, media } = useTimeline();

  return (
    <div className={cn(
      "bg-border-cream flex flex-col relative transition-all duration-500 w-full overflow-hidden select-none border-b border-border-cream",
      isFocusMode ? "h-10" : "h-12"
    )}>
      {/* Background Track */}
      <div className="flex-1 flex gap-0 relative h-full">
         {result && media ? (
           result.video_structure.map((section, index) => {
              const nextSection = result.video_structure[index + 1];
              const endSec = nextSection ? nextSection.seconds : media.duration;
              const duration = endSec - section.seconds;
              const widthPercent = (duration / media.duration) * 100;
              const style = getSegmentStyle(section.segment_type);
              
              const isActive = currentTime >= section.seconds && currentTime < endSec;

              return (
                <Tooltip 
                  key={index} 
                  content={`${section.segment_type}: ${section.title} (${duration.toFixed(1)}s)`} 
                  className="max-w-xs whitespace-normal"
                  style={{ width: `${widthPercent}%` }}
                  containerClassName="h-full"
                >
                  <button
                    onClick={() => seekTo(section.seconds, index)}
                    className={cn(
                      "h-full w-full transition-all flex items-center justify-center px-1 overflow-hidden relative group/seg border-r border-black/5",
                      // Use the indicator color as the main background for a "Block" feel
                      style.indicator,
                      isActive ? "brightness-105" : "brightness-95 hover:brightness-100",
                      isActive && "z-10 shadow-[inset_0_0_0_2px_rgba(20,20,19,0.3)]"
                    )}
                  >
                    <span className={cn(
                      "font-mono font-black uppercase tracking-tighter truncate leading-none text-center",
                      isFocusMode ? "text-[9px]" : "text-[10px]",
                      // Ensure text remains readable on solid backgrounds
                      "text-near-black/80"
                    )}>
                      {section.segment_type}
                    </span>
                  </button>
                </Tooltip>
              );
           })
         ) : (
           <div className="w-full h-full flex items-center justify-center text-stone-gray/30 text-[10px] italic tracking-wider bg-white">
              Timeline will appear after analysis
           </div>
         )}

         {/* ── Playhead (Precision Needle) ────────────────────── */}
         {media && (
           <div 
             className="absolute top-0 bottom-0 w-0.5 bg-near-black z-40 pointer-events-none transition-all duration-75 ease-linear"
             style={{ left: `${(currentTime / media.duration) * 100}%` }}
           >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-near-black" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-near-black" />
           </div>
         )}
      </div>

      {/* ── Progress Underline ──────────────────────────────── */}
      {media && (
        <div className="h-1 w-full bg-black/5 relative shrink-0">
          <div 
            className="absolute inset-y-0 left-0 bg-near-black/20 transition-all duration-75 ease-linear"
            style={{ width: `${(currentTime / media.duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
