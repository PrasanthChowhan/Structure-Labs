import { useState } from "react";
import { Search, Loader2, ArrowLeft, Download, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface VideoSection {
  timestamp: String;
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

function App() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      setStatus("Downloading audio...");
      const audioPath = await invoke<string>("download_audio", { url });
      
      setStatus("Transcribing (this may take a minute)...");
      const transcript = await invoke<string>("transcribe_audio", { path: audioPath });
      
      setStatus("Analyzing with Gemini...");
      const analysis = await invoke<AnalysisResult>("analyze_transcript", { transcript });
      
      setResult(analysis);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-parchment py-12 px-6 animate-in fade-in duration-700">
        <div className="max-w-4xl mx-auto space-y-12">
          <button 
            onClick={() => setResult(null)}
            className="flex items-center gap-2 text-stone-gray hover:text-near-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-sans text-sm font-medium">Back to search</span>
          </button>

          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ivory shadow-ring shadow-border-cream">
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span className="text-xs font-sans font-medium text-olive-gray uppercase tracking-wider">{result.framework_detected}</span>
            </div>
            <h1 className="text-5xl text-near-black leading-tight">Video Breakdown</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-12">
              <section className="space-y-6">
                <h2 className="text-3xl text-near-black">Structure</h2>
                <div className="space-y-4">
                  {result.video_structure.map((section, i) => (
                    <div key={i} className="bg-ivory border border-border-cream p-6 rounded-generous shadow-whisper relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta/20 group-hover:bg-terracotta transition-colors" />
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-stone-gray">{section.timestamp}</span>
                        <h4 className="text-lg font-serif text-near-black">{section.title}</h4>
                      </div>
                      <p className="text-sm text-olive-gray leading-relaxed">{section.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-near-black text-ivory p-10 rounded-hero space-y-6">
                <h2 className="text-3xl text-warm-silver">Why It Works</h2>
                <p className="text-lg text-warm-silver/90 leading-relaxed font-sans italic">
                  "{result.why_it_works}"
                </p>
              </section>
            </div>

            <aside className="space-y-8">
              <div className="bg-white border border-border-cream p-6 rounded-generous shadow-whisper space-y-4">
                <h3 className="text-xl text-near-black font-serif">Hook Type</h3>
                <p className="text-sm text-olive-gray">{result.hook_type}</p>
              </div>

              <div className="bg-warm-sand/30 border border-border-cream p-6 rounded-generous space-y-4">
                <h3 className="text-xl text-near-black font-serif">Reusable Template</h3>
                <div className="p-4 bg-white/50 rounded-comfort border border-border-cream/50">
                  <pre className="text-xs text-olive-gray whitespace-pre-wrap font-sans leading-relaxed">
                    {result.reusable_template}
                  </pre>
                </div>
              </div>

              <div className="bg-terracotta/5 border border-terracotta/10 p-6 rounded-generous space-y-4">
                <h3 className="text-xl text-terracotta font-serif">Adaptation Brief</h3>
                <p className="text-sm text-olive-gray leading-relaxed">
                  {result.adaptation_brief}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center pt-24 px-6 pb-20 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-stone-gray/5 rounded-full blur-3xl" />

      <header className="max-w-2xl w-full text-center space-y-8 mb-16 relative z-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white shadow-ring shadow-border-cream mb-2 animate-in slide-in-from-bottom duration-1000">
           <span className="text-xs font-sans font-medium text-terracotta uppercase tracking-[0.2em]">Format Intelligence</span>
        </div>
        <h1 className="text-7xl text-near-black tracking-tight animate-in fade-in slide-in-from-top-4 duration-1000">
          Structure Labs
        </h1>
        <p className="text-2xl text-olive-gray max-w-lg mx-auto leading-relaxed font-sans font-normal opacity-90">
          Study winning videos like a strategist. Extract formats that work.
        </p>
      </header>

      <main className="max-w-2xl w-full relative z-10">
        <form onSubmit={handleAnalyze} className="relative group animate-in zoom-in-95 duration-700 delay-200">
          <input
            type="text"
            placeholder="Paste a YouTube video URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-16 bg-white border border-border-cream rounded-generous px-14 text-lg text-near-black focus:outline-none focus:ring-4 focus:ring-terracotta/5 transition-all shadow-whisper placeholder:text-stone-gray/50"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-gray w-6 h-6" />
          <button
            type="submit"
            disabled={isLoading || !url}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-terracotta text-ivory h-10 px-8 rounded-comfort font-medium hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-terracotta/20 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {isLoading && (
          <div className="mt-8 text-center animate-in fade-in duration-300">
            <p className="text-sm text-stone-gray font-sans animate-pulse">{status}</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-comfort text-red-600 text-sm font-sans text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-ivory rounded-comfort flex items-center justify-center shadow-ring shadow-border-cream">
              <Download className="w-5 h-5 text-stone-gray" />
            </div>
            <h3 className="text-xl text-near-black">Local Extraction</h3>
            <p className="text-sm text-olive-gray leading-relaxed">
              Downloads and transcribes audio directly on your machine.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-10 h-10 bg-ivory rounded-comfort flex items-center justify-center shadow-ring shadow-border-cream">
              <FileText className="w-5 h-5 text-stone-gray" />
            </div>
            <h3 className="text-xl text-near-black">Format Analysis</h3>
            <p className="text-sm text-olive-gray leading-relaxed">
              Breaks down the hook, structure, and retention logic.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-10 h-10 bg-ivory rounded-comfort flex items-center justify-center shadow-ring shadow-border-cream">
              <CheckCircle2 className="w-5 h-5 text-stone-gray" />
            </div>
            <h3 className="text-xl text-near-black">Adaptation Brief</h3>
            <p className="text-sm text-olive-gray leading-relaxed">
              Get a generalized template to use for your own niche.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-auto pt-20 text-stone-gray/40 text-xs font-sans uppercase tracking-widest">
        Structure Labs MVP v1.0
      </footer>
    </div>
  );
}

export default App;
