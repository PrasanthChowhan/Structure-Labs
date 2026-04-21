import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Sparkles, Settings, User, Info, HelpCircle } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoSection {
  timestamp: string;
  seconds: number;
  title: string;
  description: string;
}

interface AnalysisResult {
  hook_type: string;
  video_structure: VideoSection[];
  framework_detected: string;
  why_it_works: string;
  reusable_template: string;
  adaptation_brief: string;
}

interface MediaPaths {
  video_path: string;
  audio_path: string;
  duration: number;
}

type WorkspaceTab = "timeline" | "analysis" | "brief";

function App() {
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [media, setMedia] = useState<MediaPaths | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("timeline");
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [media]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-parchment text-near-black overflow-hidden font-sans antialiased">
      {/* Top Header / Navigation */}
      <header className="h-14 border-b border-border-cream bg-white/50 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-terracotta rounded-full flex items-center justify-center">
              <span className="text-[10px] text-ivory font-bold">SL</span>
            </div>
            <span className="font-serif font-medium text-lg tracking-tight">Structure Labs</span>
          </div>

          <form onSubmit={handleAnalyze} className="flex items-center gap-2">
            <div className="relative w-80 group">
              <input
                type="text"
                placeholder="Analyze new video URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-8 bg-warm-sand/30 border border-border-cream rounded-comfort px-9 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-gray w-3.5 h-3.5" />
            </div>

            <div className="relative w-48 group">
              <input
                type="text"
                placeholder="Target niche (optional)"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full h-8 bg-warm-sand/30 border border-border-cream rounded-comfort px-3 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className="h-8 px-4 bg-terracotta text-ivory rounded-comfort text-xs font-medium hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Analyze
            </button>
          </form>
        </div>

        <nav className="flex items-center gap-6">
          <button className="text-xs font-medium text-olive-gray hover:text-near-black flex items-center gap-1.5 transition-colors">
            <Info className="w-3.5 h-3.5" /> About
          </button>
          <button className="text-xs font-medium text-olive-gray hover:text-near-black flex items-center gap-1.5 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" /> Help
          </button>
          <div className="h-4 w-px bg-border-cream" />
          <button className="w-8 h-8 bg-warm-sand/50 rounded-full flex items-center justify-center hover:bg-warm-sand transition-colors">
            <User className="w-4 h-4 text-olive-gray" />
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-6 gap-6 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-parchment/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white border border-border-cream p-8 rounded-generous shadow-whisper flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
              <p className="text-sm font-medium text-olive-gray">{status}</p>
            </div>
          </div>
        )}

        {/* Workspace Central View */}
        <div className="flex-1 flex flex-col min-h-0 gap-6">
          {activeTab === "timeline" ? (
            <>
              {/* Video Player Section */}
              <div className="flex-1 bg-near-black rounded-hero overflow-hidden shadow-2xl relative group">
                {media ? (
                  <video
                    ref={videoRef}
                    src={convertFileSrc(media.video_path)}
                    controls
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

              {/* Proportional Timeline */}
              <div className="h-24 bg-white border border-border-cream rounded-generous shadow-whisper p-1 flex flex-col">
                <div className="flex-1 flex gap-px rounded-[10px] overflow-hidden bg-border-cream/30 relative">
                   {result && media ? (
                     result.video_structure.map((section, index) => {
                        const nextSection = result.video_structure[index + 1];
                        const endSec = nextSection ? nextSection.seconds : media.duration;
                        const duration = endSec - section.seconds;
                        const widthPercent = (duration / media.duration) * 100;

                        return (
                          <button
                            key={index}
                            onClick={() => seekTo(section.seconds)}
                            className="h-full bg-ivory hover:bg-white border-x border-border-cream/50 transition-all flex flex-col justify-center px-4 overflow-hidden text-left relative group/seg"
                            style={{ width: `${widthPercent}%` }}
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-terracotta/20 group-hover/seg:bg-terracotta transition-colors" />
                            <span className="text-[10px] font-mono text-stone-gray block mb-1">{section.timestamp}</span>
                            <span className="text-[11px] font-serif font-medium text-near-black truncate">{section.title}</span>
                          </button>
                        );
                     })
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-stone-gray/30 text-xs italic tracking-wider">
                        Timeline will appear after analysis
                     </div>
                   )}
                </div>
                <div className="h-1.5 w-full bg-border-cream/20 mt-1 rounded-full relative overflow-hidden">
                   <div 
                     className="absolute top-0 left-0 bottom-0 bg-terracotta transition-all duration-100 ease-linear" 
                     style={{ width: `${media ? (currentTime / media.duration) * 100 : 0}%` }}
                   />
                </div>
              </div>

              {/* Segments List */}
              <div className="flex-1 overflow-y-auto bg-white border border-border-cream rounded-hero shadow-whisper">
                <div className="p-6 border-b border-border-cream sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between">
                  <h3 className="text-xl font-serif text-near-black">Video Segments</h3>
                  <span className="text-[10px] font-bold text-olive-gray uppercase tracking-widest bg-warm-sand/30 px-2 py-1 rounded">
                    {result?.video_structure.length || 0} SECTIONS
                  </span>
                </div>
                <div className="divide-y divide-border-cream">
                  {result ? (
                    result.video_structure.map((section, index) => {
                      const isActive = currentTime >= section.seconds && 
                        (index === result.video_structure.length - 1 || currentTime < result.video_structure[index + 1].seconds);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => seekTo(section.seconds)}
                          className={cn(
                            "w-full text-left p-6 hover:bg-parchment/30 transition-all group relative",
                            isActive && "bg-terracotta/[0.02]"
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta" />
                          )}
                          <div className="flex items-start gap-6">
                            <span className={cn(
                              "text-sm font-mono shrink-0 pt-1",
                              isActive ? "text-terracotta" : "text-stone-gray"
                            )}>
                              {section.timestamp}
                            </span>
                            <div className="space-y-1">
                              <h4 className={cn(
                                "text-lg font-serif transition-colors",
                                isActive ? "text-near-black" : "text-olive-gray group-hover:text-near-black"
                              )}>
                                {section.title}
                              </h4>
                              <p className="text-sm text-stone-gray leading-relaxed max-w-2xl">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-stone-gray italic text-sm">
                      Analyze a video to see the structural breakdown here.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === "analysis" ? (
            <div className="flex-1 overflow-y-auto space-y-8 pr-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-border-cream p-8 rounded-hero shadow-whisper space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/5 border border-terracotta/10">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                    <span className="text-[10px] font-bold text-terracotta uppercase tracking-wider">Hook Type</span>
                  </div>
                  <h3 className="text-3xl text-near-black">{result?.hook_type || "No hook type detected"}</h3>
                </div>

                <div className="bg-white border border-border-cream p-8 rounded-hero shadow-whisper space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-olive-gray/5 border border-olive-gray/10">
                    <span className="text-[10px] font-bold text-olive-gray uppercase tracking-wider">Framework</span>
                  </div>
                  <h3 className="text-3xl text-near-black">{result?.framework_detected || "No framework identified"}</h3>
                </div>
              </div>

              <div className="bg-near-black text-ivory p-12 rounded-hero space-y-6">
                 <h2 className="text-4xl text-warm-silver">Why It Works</h2>
                 <p className="text-xl text-warm-silver/80 leading-relaxed italic font-serif max-w-3xl">
                   "{result?.why_it_works}"
                 </p>
              </div>

              {result && (
                <div className="bg-white border border-border-cream p-12 rounded-hero shadow-whisper space-y-6">
                  <h2 className="text-3xl text-near-black font-serif">Personal Notes</h2>
                  <textarea
                    placeholder="Add your own observations, ideas, or reminders here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-48 bg-parchment/30 border border-border-cream rounded-generous p-6 text-base focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all resize-none font-sans leading-relaxed"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 pr-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-warm-sand/20 border border-border-cream p-12 rounded-hero space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl text-near-black">Reusable Template</h2>
                    <div className="bg-white p-8 rounded-generous border border-border-cream shadow-sm">
                       <pre className="text-base text-olive-gray whitespace-pre-wrap font-sans leading-relaxed">
                          {result?.reusable_template}
                       </pre>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-4xl text-near-black">Adaptation Brief</h2>
                    <div className="p-8 bg-terracotta/5 rounded-generous border border-terracotta/10">
                       <p className="text-lg text-near-black/80 leading-relaxed font-sans">
                          {result?.adaptation_brief}
                       </p>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation / Workspaces */}
      <footer className="h-16 border-t border-border-cream bg-white/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-sans font-bold text-stone-gray uppercase tracking-widest bg-warm-sand/50 px-2 py-0.5 rounded">v1.0</span>
        </div>

        <div className="flex items-center gap-1 bg-warm-sand/30 p-1 rounded-generous border border-border-cream">
           {(["timeline", "analysis", "brief"] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-2 rounded-comfort text-xs font-medium transition-all capitalize",
                 activeTab === tab 
                   ? "bg-white text-near-black shadow-sm ring-1 ring-border-cream" 
                   : "text-olive-gray hover:text-near-black hover:bg-white/50"
               )}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-4">
           <button className="p-2 text-olive-gray hover:text-near-black transition-colors">
              <Settings className="w-5 h-5" />
           </button>
           <div className="w-8 h-8 rounded-full border border-border-cream overflow-hidden shadow-ring shadow-border-cream">
              <div className="w-full h-full bg-terracotta/5 flex items-center justify-center">
                 <Sparkles className="w-4 h-4 text-terracotta" />
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
