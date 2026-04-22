import { Settings, Sparkles } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { WorkspaceTab } from "../../types";
import { cn } from "../../lib/utils";

interface FooterProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

export function Footer({ activeTab, setActiveTab }: FooterProps) {
  return (
    <footer className="h-16 border-t border-border-cream bg-white/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-2">
         <span className="text-[10px] font-sans font-bold text-stone-gray uppercase tracking-widest bg-warm-sand/50 px-2 py-0.5 rounded">v1.0</span>
      </div>

      <div className="flex items-center gap-1 bg-warm-sand/30 p-1 rounded-generous border border-border-cream">
         {(["timeline", "analysis", "brief", "scripting", "export"] as const).map((tab) => {
           const descriptions = {
             timeline: "Video segments & playback",
             analysis: "AI breakdown & personal notes",
             brief: "Reusable template & adaptation",
             scripting: "Block-based script editor",
             export: "Download script & document"
           };
           
           return (
             <Tooltip key={tab} content={descriptions[tab]}>
               <button
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
             </Tooltip>
           );
         })}
      </div>

      <div className="flex items-center gap-4">
         <Tooltip content="System Settings">
           <button className="p-2 text-olive-gray hover:text-near-black transition-colors">
              <Settings className="w-5 h-5" />
           </button>
         </Tooltip>
         <div className="w-8 h-8 rounded-full border border-border-cream overflow-hidden shadow-ring shadow-border-cream">
            <div className="w-full h-full bg-terracotta/5 flex items-center justify-center">
               <Sparkles className="w-4 h-4 text-terracotta" />
            </div>
         </div>
      </div>
    </footer>
  );
}
