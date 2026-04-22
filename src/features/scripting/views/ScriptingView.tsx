import { useEffect } from 'react';
import { useScriptStore } from '../store/useScriptStore';
import { ScriptEditor } from '../components/editor/ScriptEditor';
import { AnalysisResult } from '../../../types';
import { SCRIPT_PRESETS } from '../data/presets';
import { 
  Plus, 
  Download, 
  History, 
  Users, 
  ChevronDown,
  Layout,
  Info
} from 'lucide-react';
import { useState } from 'react';

interface ScriptingViewProps {
  result: AnalysisResult | null;
}

export const ScriptingView = ({ result }: ScriptingViewProps) => {
  const [showPresets, setShowPresets] = useState(false);
  const {
    title,
    activeVersionId,
    versions,
    initializeFromAnalysis,
    createVersion,
    switchVersion,
    setMetadata,
    targetAudience,
    applyPreset,
  } = useScriptStore();

  useEffect(() => {
    // If we have an analysis result and no script yet, initialize it
    if (result && Object.keys(versions).length === 0) {
      initializeFromAnalysis(result);
    }
  }, [result, versions, initializeFromAnalysis]);

  return (
    <div className="flex flex-col h-full bg-white rounded-generous border border-border-cream overflow-hidden shadow-whisper">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-border-cream flex items-center justify-between bg-parchment/30">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => setMetadata({ title: e.target.value })}
              className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-near-black"
              placeholder="Script Title"
            />
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-3.5 h-3.5 text-olive-gray" />
              <select 
                value={targetAudience}
                onChange={(e) => setMetadata({ targetAudience: e.target.value })}
                className="text-xs text-olive-gray bg-transparent border-none focus:outline-none p-0 cursor-pointer"
              >
                <option value="">Select Audience</option>
                <option value="creators">Content Creators</option>
                <option value="business">Business Owners</option>
                <option value="tech">Tech Enthusiasts</option>
              </select>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border-cream mx-2" />

          {/* Version Selector */}
          <div className="relative flex items-center gap-2">
            <History className="w-4 h-4 text-olive-gray" />
            <select
              value={activeVersionId}
              onChange={(e) => switchVersion(e.target.value)}
              className="text-sm font-medium text-olive-gray bg-transparent border-none focus:outline-none p-0 cursor-pointer pr-6 appearance-none"
            >
              {Object.values(versions).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-olive-gray absolute right-0 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className={`p-2 rounded-md transition-colors ${showPresets ? 'bg-terracotta/10 text-terracotta' : 'text-olive-gray hover:bg-border-cream/50'}`}
          >
            <Layout className="w-5 h-5" />
          </button>

          <div className="h-6 w-[1px] bg-border-cream mx-1" />

          <button 
            onClick={() => {
              const name = prompt('Version name:');
              if (name) createVersion(name);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-olive-gray hover:text-near-black hover:bg-border-cream/50 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Version
          </button>
          
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-terracotta text-white rounded-generous hover:bg-terracotta-dark shadow-warm transition-all transform hover:-translate-y-0.5">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Presets Sidebar */}
        {showPresets && (
          <aside className="w-64 border-r border-border-cream bg-parchment/10 overflow-y-auto p-4 flex flex-col gap-6 animate-in slide-in-from-left duration-200">
            <div>
              <h3 className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-3 flex items-center gap-2">
                <Layout className="w-3 h-3" />
                Script Presets
              </h3>
              <div className="flex flex-col gap-2">
                {SCRIPT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      if (confirm(`Apply "${preset.name}" preset? This will create a new version.`)) {
                        applyPreset(preset);
                      }
                    }}
                    className="text-left p-3 rounded-comfort border border-border-cream bg-white hover:border-terracotta/30 hover:shadow-whisper transition-all group"
                  >
                    <span className="text-xs font-bold text-near-black group-hover:text-terracotta block mb-1">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-olive-gray leading-tight block">
                      {preset.structure.length} blocks
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Framework Guidance
              </h3>
              <div className="p-3 rounded-comfort bg-warm-sand/20 border border-border-cream">
                <span className="text-[10px] font-bold text-near-black block mb-1">
                  Current: {result?.framework_detected || 'Standard'}
                </span>
                <p className="text-[10px] text-olive-gray italic leading-relaxed">
                  {result?.adaptation_brief?.slice(0, 100)}...
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="max-w-3xl mx-auto py-12 px-8">
            <ScriptEditor />
          </div>
        </div>
      </div>
    </div>
  );
};
