import { VideoAnalyzer, AnalysisState } from "../features/analysis/lib/VideoAnalyzer";
import { ScriptEngine } from "../features/scripting/lib/ScriptEngine";
import { AnalysisResult } from "../types";

export interface WorkbenchState {
  analysis: AnalysisState;
  activeTab: string;
  isFocusMode: boolean;
  notes: string;
}

type WorkbenchSubscriber = (state: WorkbenchState) => void;

export class Workbench {
  private static instance: Workbench;
  private analyzer = VideoAnalyzer.getInstance();
  private scriptEngine = ScriptEngine.getInstance();
  
  private state: WorkbenchState = {
    analysis: this.analyzer.getState(),
    activeTab: 'timeline',
    isFocusMode: false,
    notes: '',
  };
  
  private subscribers: Set<WorkbenchSubscriber> = new Set();

  private constructor() {
    // Listen to analyzer changes to keep workbench state in sync
    this.analyzer.subscribe((analysisState) => {
      this.setState({ analysis: analysisState });
    });
  }

  public static getInstance(): Workbench {
    if (!Workbench.instance) {
      Workbench.instance = new Workbench();
    }
    return Workbench.instance;
  }

  public subscribe(callback: WorkbenchSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.state);
    return () => this.subscribers.delete(callback);
  }

  private setState(patch: Partial<WorkbenchState>) {
    this.state = { ...this.state, ...patch };
    this.subscribers.forEach(cb => cb(this.state));
  }

  public getState(): WorkbenchState {
    return this.state;
  }

  // --- Workbench Actions ---

  public setActiveTab(tab: string) {
    this.setState({ activeTab: tab });
  }

  public setFocusMode(enabled: boolean) {
    this.setState({ isFocusMode: enabled });
  }

  public setNotes(notes: string) {
    this.setState({ notes });
  }

  /**
   * High-level orchestration: Start a new project from a URL.
   */
  public async processVideo(url: string, niche?: string) {
    this.setActiveTab('timeline');
    try {
      const result = await this.analyzer.start(url, niche);
      // Auto-transition to analysis view once done? 
      // Or stay on timeline. Let's stay on timeline for now.
      return result;
    } catch (err) {
      console.error("Workbench: Video processing failed", err);
      throw err;
    }
  }

  /**
   * Transfer analysis results to the script engine.
   */
  public initializeScriptFromAnalysis(analysis: AnalysisResult) {
    const content = analysis.adaptation_brief || '';
    const doc = this.scriptEngine.createDoc('AI Draft', content);
    // Note: The actual version tracking still happens in useScriptStore for now,
    // but the engine handled the Doc creation.
    return doc;
  }
}
