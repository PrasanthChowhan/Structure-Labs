import { Clipboard, Sparkles, Wand2, Target } from "lucide-react";
import { AnalysisResult } from "../../../types";

interface BriefViewProps {
  result: AnalysisResult | null;
}

export function BriefView({ result }: BriefViewProps) {
  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-border-cream rounded-hero shadow-whisper">
        <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mb-4">
           <Clipboard className="w-8 h-8 text-stone-gray/30" />
        </div>
        <p className="text-stone-gray italic text-sm">Analyze a video to generate a reusable template</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pb-6">
      {/* Template Header */}
      <div className="bg-near-black text-ivory p-8 rounded-hero shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 bg-terracotta/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-terracotta/20 transition-all duration-1000" />
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="bg-terracotta p-2 rounded-comfort">
                  <Wand2 className="w-5 h-5" />
               </div>
               <h2 className="font-serif text-2xl tracking-tight">The {result.framework_detected} Template</h2>
            </div>
            <p className="text-warm-silver/70 max-w-2xl text-sm leading-relaxed">
               Extracted logic from the original performance. Use this structure to maintain the same retention-driven pacing while changing the content.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generalized Template */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border border-border-cream p-6 rounded-hero shadow-whisper">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-terracotta" />
                    <h3 className="font-serif text-lg text-near-black">Structural Blueprint</h3>
                 </div>
                 <button className="text-[10px] font-bold text-olive-gray uppercase tracking-widest hover:text-terracotta transition-colors flex items-center gap-1.5">
                    <Clipboard className="w-3 h-3" /> Copy Template
                 </button>
              </div>
              <div className="prose prose-sm prose-stone max-w-none">
                 <div className="whitespace-pre-wrap font-sans leading-relaxed text-near-black bg-parchment/30 p-6 rounded-generous border border-border-cream/50 italic">
                    {result.reusable_template}
                 </div>
              </div>
           </div>
        </div>

        {/* Niche Adaptation */}
        <div className="space-y-6">
           <div className="bg-white border border-border-cream p-6 rounded-hero shadow-whisper h-full">
              <div className="flex items-center gap-2 mb-6">
                 <Target className="w-4 h-4 text-terracotta" />
                 <h3 className="font-serif text-lg text-near-black">Niche Brief</h3>
              </div>
              <div className="space-y-4">
                 <p className="text-sm text-near-black leading-relaxed whitespace-pre-wrap">
                    {result.adaptation_brief}
                 </p>
                 <div className="p-4 bg-warm-sand/20 rounded-generous border border-border-cream/50">
                    <span className="text-[10px] font-bold text-olive-gray uppercase tracking-widest block mb-1">PRO TIP</span>
                    <p className="text-[11px] text-olive-gray leading-relaxed">
                       Focus on the transition between the Value and Proof segments—that's where the original creator gained the most trust.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
