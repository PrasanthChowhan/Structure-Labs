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

export type WorkspaceTab = "timeline" | "analysis" | "brief" | "scripting" | "export";

export interface BlockVariant {
  id: string;
  content: any; // TipTap/ProseMirror JSON
  label: string;
  createdAt: number;
  source: 'ai' | 'user';
}

export interface ScriptBlock {
  id: string;
  type: string;
  variants: Record<string, BlockVariant>;
  // Note: activeVariantId is managed at the Version level usually, 
  // but keeping a default here is helpful.
  defaultVariantId: string;
}

export interface ScriptVersion {
  id: string;
  name: string;
  blockOrder: string[]; // List of block IDs
  activeVariants: Record<string, string>; // blockId -> variantId
  createdAt: number;
}

export interface ScriptData {
  title: string;
  targetAudience: string;
  niche: string;
  versions: Record<string, ScriptVersion>;
  activeVersionId: string;
  blocks: Record<string, ScriptBlock>;
}
