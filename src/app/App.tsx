import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { AnalysisView } from "../features/analysis/views/AnalysisView";
import { BriefView } from "../features/analysis/views/BriefView";
import { ScriptingView } from "../features/scripting/views/ScriptingView";
import { ExportView } from "../features/export/views/ExportView";
import { TimelineView } from "../features/timeline/views/TimelineView";
import { TimelineProvider } from "../features/timeline/context/TimelineContext";
import { useVideoAnalyzer } from "../features/analysis/hooks/useVideoAnalyzer";
import { useVideoPlayback } from "../features/timeline/hooks/useVideoPlayback";
import { Workbench, WorkbenchState } from "../lib/Workbench";
import { WorkspaceTab } from "../types";
import { cn } from "../lib/utils";

function App() {
  const workbench = Workbench.getInstance();
  const [wbState, setWbState] = useState<WorkbenchState>(workbench.getState());

  useEffect(() => {
    return workbench.subscribe(setWbState);
  }, [workbench]);

  const {
    url, setUrl,
    niche, setNiche,
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
    
    if (wbState.analysis.media && wbState.activeTab === "timeline") {
      video.muted = true;
      video.currentTime = currentTime;
      video.play().catch(e => console.error("Playback failed:", e));
    }

    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [wbState.analysis.media, wbState.activeTab, setCurrentTime, videoRef, currentTime]);

  const isWorkspaceView = wbState.activeTab === "timeline" || wbState.activeTab === "scripting";

  return (
    <div className="flex flex-col h-screen bg-parchment text-near-black overflow-hidden font-sans antialiased">
      <Header 
        url={url} 
        setUrl={setUrl} 
        niche={niche} 
        setNiche={setNiche} 
        isLoading={wbState.analysis.status !== 'idle' && wbState.analysis.status !== 'completed' && wbState.analysis.status !== 'error'} 
        handleAnalyze={handleAnalyze}
        isFocusMode={wbState.isFocusMode}
        setIsFocusMode={(val) => workbench.setFocusMode(val)}
      />

      <main className={cn(
        "flex-1 overflow-hidden flex flex-col relative",
        isWorkspaceView ? "p-0 gap-0" : "p-6 gap-6"
      )}>
        {wbState.analysis.status !== 'idle' && wbState.analysis.status !== 'completed' && wbState.analysis.status !== 'error' && (
          <div className="absolute inset-0 bg-parchment/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white border border-border-cream p-8 rounded-generous shadow-whisper flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
              <p className="text-sm font-medium text-olive-gray">{wbState.analysis.progress}</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <TimelineProvider result={wbState.analysis.result} media={wbState.analysis.media}>
            {wbState.activeTab === "timeline" ? (
              <TimelineView 
                media={wbState.analysis.media}
                videoRef={videoRef}
                currentTime={currentTime}
                highlightedSegmentId={highlightedSegmentId}
                seekTo={seekTo}
                isFocusMode={wbState.isFocusMode}
                error={wbState.analysis.error}
              />
            ) : wbState.activeTab === "analysis" ? (
              <AnalysisView result={wbState.analysis.result} notes={wbState.notes} setNotes={(n) => workbench.setNotes(n)} />
            ) : wbState.activeTab === "brief" ? (
              <BriefView result={wbState.analysis.result} />
            ) : wbState.activeTab === "scripting" ? (
              <ScriptingView result={wbState.analysis.result} />
            ) : (
              <ExportView />
            )}
          </TimelineProvider>
        </div>
      </main>

      <Footer activeTab={wbState.activeTab as WorkspaceTab} setActiveTab={(tab) => workbench.setActiveTab(tab)} />
    </div>
  );
}

export default App;
