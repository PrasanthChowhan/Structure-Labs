import { VideoPlayer } from "../components/VideoPlayer";
import { ProportionalTimeline } from "../components/ProportionalTimeline";
import { BlueprintDraftView } from "../components/BlueprintDraftView";
import { MediaPaths } from "../../../types";
import { cn } from "../../../lib/utils";

interface TimelineViewProps {
  media: MediaPaths | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  highlightedSegmentId: number | null;
  seekTo: (seconds: number, index: number) => void;
  isFocusMode: boolean;
  error: string | null;
}

export function TimelineView({ 
  media, 
  videoRef, 
  currentTime, 
  highlightedSegmentId, 
  seekTo,
  isFocusMode,
  error,
}: TimelineViewProps) {  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className={cn(
          "flex flex-col min-h-0",
          isFocusMode ? "h-full" : "flex-1"
        )}>
          {/* Video Area */}
          <VideoPlayer 
            media={media} 
            videoRef={videoRef} 
            error={error} 
            isFocusMode={isFocusMode}
          />
          
          {/* High-Density Timeline Header */}
          <div className="border-b border-border-cream shrink-0 z-30 bg-white">
            <ProportionalTimeline 
              currentTime={currentTime} 
              seekTo={seekTo} 
              isFocusMode={isFocusMode}
            />
          </div>
          
          {/* Content Columns: Seamless Join */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <BlueprintDraftView 
              currentTime={currentTime} 
              highlightedSegmentId={highlightedSegmentId} 
              seekTo={seekTo} 
              isFocusMode={isFocusMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
