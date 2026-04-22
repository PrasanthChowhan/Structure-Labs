import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnalysisResult, MediaPaths } from "../../../types";

export function useVideoAnalyzer() {
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [media, setMedia] = useState<MediaPaths | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setMedia(null);

    try {
      setStatus("Fetching media...");
      const mediaPaths = await invoke<MediaPaths>("download_media", { url });
      setMedia(mediaPaths);

      setStatus("Transcribing audio...");
      const transcript = await invoke<string>("transcribe_audio", { path: mediaPaths.audio_path });

      setStatus("Identifying framework...");
      const analysis = await invoke<AnalysisResult>("analyze_transcript", { 
        transcript, 
        niche: niche || null 
      });
      setResult(analysis);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };

  return {
    url,
    setUrl,
    niche,
    setNiche,
    isLoading,
    status,
    result,
    media,
    error,
    handleAnalyze
  };
}
