import { useState, useRef } from "react";

export function useVideoPlayback() {
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekTo = (seconds: number, index: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      videoRef.current.play();
      
      setHighlightedSegmentId(index);
      const element = document.getElementById(`segment-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      setTimeout(() => setHighlightedSegmentId(null), 2000);
    }
  };

  return {
    currentTime,
    setCurrentTime,
    highlightedSegmentId,
    videoRef,
    seekTo
  };
}
