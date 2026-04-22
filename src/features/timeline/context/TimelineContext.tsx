import React, { createContext, useContext, useState } from 'react';
import { AnalysisResult, MediaPaths } from '../../../types';

interface TimelineContextType {
  result: AnalysisResult | null;
  media: MediaPaths | null;
  drafts: Record<number, string>;
  setDrafts: (drafts: Record<number, string>) => void;
  targetAudience: string;
  setTargetAudience: (audience: string) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ 
  children, 
  result, 
  media 
}: { 
  children: React.ReactNode; 
  result: AnalysisResult | null;
  media: MediaPaths | null;
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [targetAudience, setTargetAudience] = useState("SaaS Founders");

  return (
    <TimelineContext.Provider value={{ 
      result, 
      media, 
      drafts, 
      setDrafts, 
      targetAudience, 
      setTargetAudience 
    }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
