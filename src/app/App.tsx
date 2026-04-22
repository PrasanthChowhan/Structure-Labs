import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { VideoPlayer } from "../features/timeline/components/VideoPlayer";
import { ProportionalTimeline } from "../features/timeline/components/ProportionalTimeline";
import { BlueprintDraftView } from "../features/timeline/components/BlueprintDraftView";
import { AnalysisView } from "../features/analysis/views/AnalysisView";
import { BriefView } from "../features/analysis/views/BriefView";
import { ExportView } from "../features/export/views/ExportView";
import { TimelineProvider } from "../features/timeline/context/TimelineContext";
import { useVideoAnalyzer } from "../features/analysis/hooks/useVideoAnalyzer";
import { useVideoPlayback } from "../features/timeline/hooks/useVideoPlayback";
import { WorkspaceTab } from "../types";

function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("timeline");
  const [notes, setNotes] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);

  const {
    url, setUrl,
    niche, setNiche,
    isLoading, status,
    result, media, error,
    handleAnalyze
  } = useVideoAnalyzer();

  const {
    currentTime, setCurrentTime,
    highlightedSegmentId,
    videoRef,
    seekTo
  } = useVideoPlayback();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    
    if (media && activeTab === "timeline") {
      video.muted = true;
      video.currentTime = currentTime;
      video.play().catch(e => console.error("Playback failed:", e));
    }

    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [media, activeTab, setCurrentTime, videoRef]);

  return (
    <div className="flex flex-col h-screen bg-parchment text-near-black overflow-hidden font-sans antialiased">
      <Header 
        url={url} 
        setUrl={setUrl} 
        niche={niche} 
        setNiche={setNiche} 
        isLoading={isLoading} 
        handleAnalyze={handleAnalyze}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
      />

      <main className="flex-1 overflow-hidden flex flex-col p-6 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-parchment/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white border border-border-cream p-8 rounded-generous shadow-whisper flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
              <p className="text-sm font-medium text-olive-gray">{status}</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 gap-6">
          <TimelineProvider result={result} media={media}>
            {activeTab === "timeline" ? (
              <>
                <VideoPlayer 
                  media={media} 
                  videoRef={videoRef} 
                  error={error} 
                  isFocusMode={isFocusMode}
                />
                <ProportionalTimeline 
                  currentTime={currentTime} 
                  seekTo={seekTo} 
                  isFocusMode={isFocusMode}
                />
                <BlueprintDraftView 
                  currentTime={currentTime} 
                  highlightedSegmentId={highlightedSegmentId} 
                  seekTo={seekTo} 
                  isFocusMode={isFocusMode}
                />
              </>
            ) : activeTab === "analysis" ? (
              <AnalysisView result={result} notes={notes} setNotes={setNotes} />
            ) : activeTab === "brief" ? (
              <BriefView result={result} />
            ) : (
              <ExportView />
            )}
          </TimelineProvider>
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
