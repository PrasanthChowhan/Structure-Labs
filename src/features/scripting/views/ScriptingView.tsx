import { useEffect, useState } from 'react';
import { useScriptStore } from '../store/useScriptStore';
import { ScriptEditor } from '../components/editor/ScriptEditor';
import { AnalysisResult } from '../../../types';
import { SCRIPT_PRESETS } from '../data/presets';
import { exportScript } from '../utils/export';
import { 
  Plus, 
  Download, 
  History, 
  Users, 
  ChevronDown,
  Layout,
  FileText,
  Sparkles,
  X,
  Trash2,
  Check,
} from 'lucide-react';

interface ScriptingViewProps {
  result: AnalysisResult | null;
}

export const ScriptingView = ({ result }: ScriptingViewProps) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    title,
    activeVersionId,
    versions,
    initializeFromAnalysis,
    createVersion,
    switchVersion,
    deleteVersion,
    setMetadata,
    targetAudience,
    applyPreset,
    ensureDefaultVersion,
  } = useScriptStore();

  // Initialize from analysis if available and no versions exist yet
  useEffect(() => {
    if (result && Object.keys(versions).length === 0) {
      initializeFromAnalysis(result);
    }
  }, [result, versions, initializeFromAnalysis]);

  // Fallback: ensure there's always a version
  useEffect(() => {
    ensureDefaultVersion();
  }, [ensureDefaultVersion]);

  const activeVersion = versions[activeVersionId];
  const versionCount = Object.keys(versions).length;

  const handleSaveVersion = () => {
    const name = prompt('Name this version:', `V${versionCount + 1}`);
    if (name) {
      createVersion(name);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleExport = () => {
    try {
      exportScript(useScriptStore.getState());
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please ensure you have content in the editor.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden rounded-generous shadow-whisper">
      {/* ── Header Bar ─────────────────────────────────────────── */}
      <header className="px-6 py-3 border-b border-border-cream flex items-center justify-between bg-parchment/30 shrink-0">
        <div className="flex items-center gap-5">
          {/* Title + Audience */}
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => setMetadata({ title: e.target.value })}
              className="text-base font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-near-black placeholder:text-warm-silver"
              placeholder="Script Title"
            />
            <div className="flex items-center gap-2 mt-0.5">
              <Users className="w-3 h-3 text-stone-gray" />
              <select 
                value={targetAudience}
                onChange={(e) => setMetadata({ targetAudience: e.target.value })}
                className="text-[11px] text-stone-gray bg-transparent border-none focus:outline-none p-0 cursor-pointer"
              >
                <option value="">Select audience</option>
                <option value="creators">Content Creators</option>
                <option value="business">Business Owners</option>
                <option value="tech">Tech Enthusiasts</option>
                <option value="education">Educators</option>
                <option value="personal">Personal Brand</option>
              </select>
            </div>
          </div>

          <div className="h-8 w-px bg-border-cream" />

          {/* Version Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowVersionMenu(!showVersionMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-comfort hover:bg-parchment/60 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-olive-gray" />
              <span className="text-xs font-semibold text-olive-gray">
                {activeVersion?.name || 'No version'}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-gray" />
            </button>

            {/* Version Dropdown */}
            {showVersionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowVersionMenu(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border-cream rounded-generous shadow-whisper min-w-[220px] p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-gray uppercase tracking-widest">
                    Script Versions
                  </div>
                  {Object.values(versions).map(v => (
                    <div 
                      key={v.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-comfort cursor-pointer group transition-all ${
                        v.id === activeVersionId 
                          ? 'bg-terracotta/10 text-terracotta' 
                          : 'text-near-black hover:bg-parchment/60'
                      }`}
                      onClick={() => {
                        switchVersion(v.id);
                        setShowVersionMenu(false);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {v.id === activeVersionId && <Check className="w-3 h-3 shrink-0" />}
                        <span className="text-xs font-medium truncate">{v.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {versionCount > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${v.name}"?`)) {
                                deleteVersion(v.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-red-50 text-stone-gray hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-border-cream my-1" />
                  <button
                    onClick={() => {
                      setShowVersionMenu(false);
                      handleSaveVersion();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-comfort text-xs font-medium text-olive-gray hover:bg-parchment/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save as new version
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className={`p-2 rounded-comfort transition-all ${
              showPresets 
                ? 'bg-terracotta/10 text-terracotta shadow-sm' 
                : 'text-olive-gray hover:bg-parchment/60'
            }`}
            title="Script presets & templates"
          >
            <Layout className="w-4.5 h-4.5" />
          </button>

          <div className="h-6 w-px bg-border-cream" />

          <button 
            onClick={handleSaveVersion}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-comfort transition-all ${
              saveSuccess
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-olive-gray hover:text-near-black hover:bg-parchment/60 border border-transparent'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Save Version
              </>
            )}
          </button>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-terracotta text-white rounded-generous hover:bg-terracotta/90 shadow-sm transition-all transform hover:-translate-y-px active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Presets Sidebar */}
        {showPresets && (
          <aside className="w-72 border-r border-border-cream bg-parchment/20 overflow-y-auto p-5 flex flex-col gap-6 shrink-0 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-stone-gray uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-3 h-3" />
                Presets
              </h3>
              <button 
                onClick={() => setShowPresets(false)}
                className="p-1 rounded text-stone-gray hover:text-near-black hover:bg-border-cream/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {SCRIPT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    if (confirm(`Apply "${preset.name}" preset? This creates a new version.`)) {
                      applyPreset(preset);
                    }
                  }}
                  className="text-left p-3 rounded-comfort border border-border-cream bg-white hover:border-terracotta/30 hover:shadow-whisper transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-olive-gray group-hover:text-terracotta transition-colors" />
                    <span className="text-xs font-bold text-near-black group-hover:text-terracotta transition-colors">
                      {preset.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-olive-gray leading-tight block">
                    {preset.structure.length} blocks · {preset.structure.filter(s => s.type === 'heading').length} sections
                  </span>
                </button>
              ))}
            </div>

            {/* Framework Guidance */}
            {result && (
              <div>
                <h3 className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  From Analysis
                </h3>
                <div className="p-3 rounded-comfort bg-white border border-border-cream">
                  <span className="text-[10px] font-bold text-near-black block mb-1">
                    {result.framework_detected || 'Standard Framework'}
                  </span>
                  {result.adaptation_brief && (
                    <p className="text-[10px] text-olive-gray leading-relaxed">
                      {result.adaptation_brief.slice(0, 150)}
                      {result.adaptation_brief.length > 150 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick tip */}
            <div className="p-3 rounded-comfort bg-terracotta/5 border border-terracotta/10">
              <p className="text-[10px] text-olive-gray leading-relaxed">
                <span className="font-bold text-terracotta">Tip:</span> Type{' '}
                <code className="text-[10px] bg-parchment px-1 py-0.5 rounded font-mono">/</code>{' '}
                in the editor to insert blocks. Use{' '}
                <code className="text-[10px] bg-parchment px-1 py-0.5 rounded font-mono"># ## ###</code>{' '}
                for headings, and{' '}
                <code className="text-[10px] bg-parchment px-1 py-0.5 rounded font-mono">- *</code>{' '}
                for lists.
              </p>
            </div>
          </aside>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="max-w-3xl mx-auto py-16 px-4">
            <ScriptEditor />
          </div>
        </div>
      </div>
    </div>
  );
};
