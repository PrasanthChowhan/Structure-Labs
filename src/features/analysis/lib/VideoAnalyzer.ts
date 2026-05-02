import { invoke } from "@tauri-apps/api/core";
import { AnalysisResult, MediaPaths } from "../../../types";

export type AnalysisStatus = 'idle' | 'fetching' | 'transcribing' | 'analyzing' | 'completed' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  progress: string;
  error: string | null;
  media: MediaPaths | null;
  transcript: string | null;
  result: AnalysisResult | null;
  url: string | null;
  niche: string | null;
}

type Subscriber = (state: AnalysisState) => void;

export class VideoAnalyzer {
  private static instance: VideoAnalyzer;
  private state: AnalysisState = {
    status: 'idle',
    progress: '',
    error: null,
    media: null,
    transcript: null,
    result: null,
    url: null,
    niche: null,
  };
  private subscribers: Set<Subscriber> = new Set();

  private constructor() {}

  public static getInstance(): VideoAnalyzer {
    if (!VideoAnalyzer.instance) {
      VideoAnalyzer.instance = new VideoAnalyzer();
    }
    return VideoAnalyzer.instance;
  }

  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.state);
    return () => this.subscribers.delete(callback);
  }

  private setState(patch: Partial<AnalysisState>) {
    this.state = { ...this.state, ...patch };
    this.subscribers.forEach(cb => cb(this.state));
  }

  public getState(): AnalysisState {
    return this.state;
  }

  public reset() {
    this.setState({
      status: 'idle',
      progress: '',
      error: null,
      media: null,
      transcript: null,
      result: null,
      url: null,
      niche: null,
    });
  }

  /**
   * Orchestrates the full flow.
   * Leverages internal checks to skip steps (download/transcribe) if data exists.
   */
  async start(url: string, niche?: string): Promise<AnalysisResult> {
    // If we're already working on this URL and completed/partially completed, 
    // we can skip steps. If it's a new URL, reset.
    if (this.state.url !== url) {
      this.reset();
      this.setState({ url, niche: niche || null });
    }

    try {
      // 1. Media Fetching
      if (!this.state.media) {
        this.setState({ status: 'fetching', progress: 'Fetching media...' });
        const mediaPaths = await invoke<MediaPaths>("download_media", { url });
        this.setState({ media: mediaPaths });
      }

      // 2. Transcription
      if (!this.state.transcript && this.state.media) {
        this.setState({ status: 'transcribing', progress: 'Transcribing audio...' });
        const transcript = await invoke<string>("transcribe_audio", { 
          path: this.state.media.audio_path 
        });
        this.setState({ transcript });
      }

      // 3. Analysis
      if (!this.state.result && this.state.transcript) {
        return await this.runAnalysis(niche);
      }

      if (this.state.result) {
        this.setState({ status: 'completed', progress: '' });
        return this.state.result;
      }

      throw new Error("Analysis failed to produce a result.");

    } catch (err) {
      const errorMessage = String(err);
      this.setState({ status: 'error', error: errorMessage, progress: '' });
      throw err;
    }
  }

  /**
   * Re-runs ONLY the LLM analysis step using already stored transcript.
   */
  async retryAnalysis(niche?: string): Promise<AnalysisResult> {
    if (!this.state.transcript) {
      throw new Error("No transcript available to analyze. Run start() first.");
    }
    return await this.runAnalysis(niche || this.state.niche || undefined);
  }

  private async runAnalysis(niche?: string): Promise<AnalysisResult> {
    if (!this.state.transcript) throw new Error("Missing transcript");

    this.setState({ 
      status: 'analyzing', 
      progress: 'Identifying framework...', 
      niche: niche || this.state.niche 
    });

    const analysis = await invoke<AnalysisResult>("analyze_transcript", { 
      transcript: this.state.transcript, 
      niche: niche || this.state.niche || null 
    });

    this.setState({ 
      result: analysis, 
      status: 'completed', 
      progress: '' 
    });

    return analysis;
  }
}
