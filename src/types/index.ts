export interface VideoSection {
  timestamp: string;
  seconds: number;
  title: string;
  description: string;
  segment_type: string;
}

export type SegmentType = "Hook" | "Context" | "Value" | "Proof" | "Story" | "CTA" | "Other";

export interface AnalysisResult {
  hook_type: string;
  video_structure: VideoSection[];
  framework_detected: string;
  why_it_works: string;
  reusable_template: string;
  adaptation_brief: string;
}

export interface MediaPaths {
  video_path: string;
  audio_path: string;
  duration: number;
}

export type WorkspaceTab = "timeline" | "analysis" | "brief";
