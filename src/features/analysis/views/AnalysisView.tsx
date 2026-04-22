import { Sparkles, FileText, BrainCircuit, Lightbulb, PenTool } from "lucide-react";
import { AnalysisResult } from "../../../types";

interface AnalysisViewProps {
  result: AnalysisResult | null;
  notes: string;
  setNotes: (notes: string) => void;
}

export function AnalysisView({ result, notes, setNotes }: AnalysisViewProps) {
  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-border-cream rounded-hero shadow-whisper">
        <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mb-4">
           <BrainCircuit className="w-8 h-8 text-stone-gray/30" />
        </div>
        <p className="text-stone-gray italic text-sm">Analyze a video to generate structural insights</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
      <div className="space-y-6">
        {/* Hook Analysis */}
        <div className="bg-white border border-border-cream p-6 rounded-hero shadow-whisper">
           <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-terracotta" />
              <h3 className="font-serif text-lg text-near-black">Hook Strategy</h3>
           </div>
           <p className="text-sm text-near-black leading-relaxed bg-parchment/30 p-4 rounded-generous border border-border-cream/50">
             {result.hook_type}
           </p>
        </div>

        {/* Framework Logic */}
        <div className="bg-white border border-border-cream p-6 rounded-hero shadow-whisper">
           <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4 text-terracotta" />
              <h3 className="font-serif text-lg text-near-black">Framework: {result.framework_detected}</h3>
           </div>
           <div className="space-y-4">
             <div>
               <h4 className="text-[10px] font-bold text-olive-gray uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                 <Lightbulb className="w-3 h-3" /> Pacing & Pyschology
               </h4>
               <p className="text-sm text-near-black leading-relaxed">{result.why_it_works}</p>
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
         {/* Strategic Notes (Persisted across session) */}
         <div className="bg-white border border-border-cream p-6 rounded-hero shadow-whisper h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-terracotta" />
                  <h3 className="font-serif text-lg text-near-black">Strategic Notes</h3>
               </div>
               <span className="text-[10px] text-stone-gray font-mono">AUTOSAVED</span>
            </div>
            <textarea
              placeholder="Jot down ideas, angle adjustments, or specific niche references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 w-full bg-parchment/20 border border-border-cream rounded-generous p-4 text-sm text-near-black focus:outline-none focus:ring-2 focus:ring-terracotta/10 transition-all resize-none"
            />
            <div className="mt-4 pt-4 border-t border-border-cream flex items-center gap-3">
               <FileText className="w-3.5 h-3.5 text-stone-gray" />
               <span className="text-[10px] text-stone-gray font-medium">Use these notes to refine your adaptation brief</span>
            </div>
         </div>
      </div>
    </div>
  );
}
