import { useState, useEffect } from "react";
import { VideoAnalyzer, AnalysisState } from "../lib/VideoAnalyzer";

export function useVideoAnalyzer() {
  const analyzer = VideoAnalyzer.getInstance();
  const [engineState, setEngineState] = useState<AnalysisState>(analyzer.getState());
  
  // Input states (local to UI)
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");

  useEffect(() => {
    // Sync React state with the singleton engine
    return analyzer.subscribe(setEngineState);
  }, [analyzer]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    try {
      await analyzer.start(url, niche);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  const handleRetry = async () => {
    try {
      await analyzer.retryAnalysis(niche);
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  return {
    // Inputs
    url,
    setUrl,
    niche,
    setNiche,
    
    // Engine State
    isLoading: engineState.status !== 'idle' && engineState.status !== 'completed' && engineState.status !== 'error',
    status: engineState.progress,
    result: engineState.result,
    media: engineState.media,
    error: engineState.error,
    
    // Actions
    handleAnalyze,
    handleRetry,
    reset: () => analyzer.reset()
  };
}
