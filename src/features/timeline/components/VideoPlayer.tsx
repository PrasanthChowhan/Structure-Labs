import React from "react";
import { Search } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { MediaPaths } from "../../../types";
import { cn } from "../../../lib/utils";

interface VideoPlayerProps {
  media: MediaPaths | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  isFocusMode: boolean;
}

export function VideoPlayer({ media, videoRef, error, isFocusMode }: VideoPlayerProps) {
  return (
    <div className={cn(
      "bg-near-black rounded-hero overflow-hidden shadow-2xl relative group transition-all duration-500",
      isFocusMode ? "h-48 shrink-0" : "flex-1 min-h-[300px]"
    )}>
      {media ? (
        <video
          key={media.video_path}
          ref={videoRef}
          src={convertFileSrc(media.video_path)}
          controls
          muted
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-warm-silver/20">
          <div className="w-20 h-20 border-2 border-dashed border-warm-silver/10 rounded-full flex items-center justify-center">
             <Search className="w-8 h-8" />
          </div>
          <p className="font-serif text-xl">Enter a URL to start your analysis</p>
        </div>
      )}
      
      {error && (
         <div className="absolute top-4 right-4 max-w-sm bg-red-50 border border-red-100 p-4 rounded-comfort text-red-600 text-xs shadow-lg animate-in slide-in-from-right-4">
           {error}
         </div>
      )}
    </div>
  );
}
