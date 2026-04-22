import { useState, useMemo } from 'react';
import { Download, FileText, FileCode, FileDown, Check, Copy, Share2, Info, Sparkles } from 'lucide-react';
import { useTimeline } from '../../timeline/context/TimelineContext';
import { cn, getSegmentStyle } from '../../../lib/utils';
import { Tooltip } from '../../../components/ui/Tooltip';

type ExportFormat = 'pdf' | 'txt' | 'md';

interface ExportPreset {
  id: string;
  name: string;
  description: string;
}

const PRESETS: ExportPreset[] = [
  { id: 'youtube', name: 'YouTube Script – Long Form', description: 'Structured with timestamps and clear section markers.' },
  { id: 'client', name: 'Client PDF Breakdown', description: 'Professional layout with "Why it works" notes.' },
  { id: 'educational', name: 'Educational Explainer', description: 'Focused on clarity and step-by-step value.' },
  { id: 'gaming', name: 'Gaming Review', description: 'High-energy structure with punchy hook focus.' },
];

export function ExportView() {
  const { result, drafts } = useTimeline();
  const [format, setFormat] = useState<ExportFormat>('md');
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [metadata, setMetadata] = useState({
    title: 'Untitled Video Script',
    hookType: result?.hook_type || 'Controversial opinion',
    tags: 'Gaming, Review, Storytelling'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const previewContent = useMemo(() => {
    if (!result) return 'No analysis data available to export.';

    let content = '';
    if (format === 'md') {
      content += `# ${metadata.title}\n\n`;
      content += `**Hook Type:** ${metadata.hookType}\n`;
      content += `**Tags:** ${metadata.tags}\n\n`;
      content += `---\n\n`;

      result.video_structure.forEach((section, index) => {
        const draft = drafts[index] || '';
        content += `## [${section.timestamp}] ${section.segment_type}: ${section.title}\n`;
        content += `*Analysis:* ${section.description}\n\n`;
        content += `${draft || '*[No draft written for this section]*'}\n\n`;
      });
    } else if (format === 'txt') {
      content += `${metadata.title.toUpperCase()}\n`;
      content += `Hook Type: ${metadata.hookType}\n`;
      content += `Tags: ${metadata.tags}\n`;
      content += `========================================\n\n`;

      result.video_structure.forEach((section, index) => {
        const draft = drafts[index] || '';
        content += `[${section.timestamp}] ${section.segment_type.toUpperCase()}: ${section.title}\n`;
        content += `Draft: ${draft || '[Empty]'}\n`;
        content += `----------------------------------------\n\n`;
      });
    } else if (format === 'pdf') {
      content += `[PDF RENDERING PREVIEW]\n\n`;
      content += `TITLE: ${metadata.title}\n`;
      content += `STRUCTURE: ${result.video_structure.length} segments\n`;
      content += `PRESET: ${PRESETS.find(p => p.id === selectedPreset)?.name}\n\n`;
      
      result.video_structure.forEach((section, index) => {
        const draft = drafts[index] || '';
        content += `${section.timestamp} - ${section.segment_type}\n`;
        content += `${draft.substring(0, 100)}${draft.length > 100 ? '...' : ''}\n\n`;
      });
    }

    return content;
  }, [result, drafts, format, metadata, selectedPreset]);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  return (
    <div className="flex-1 flex gap-6 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {showOnboarding && (
        <div className="absolute inset-0 z-50 bg-parchment/60 backdrop-blur-md flex items-center justify-center p-12 animate-in fade-in duration-500">
          <div className="max-w-md bg-white border border-border-cream rounded-hero p-10 shadow-whisper text-center">
            <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-8 h-8 text-terracotta" />
            </div>
            <h2 className="text-xl font-bold text-near-black mb-3 font-serif">Turn your work into a final artifact</h2>
            <p className="text-sm text-olive-gray leading-relaxed mb-8 font-sans">
              Choose your format, pick a preset that matches your use case, and see your final script come to life in the live preview.
            </p>
            <button 
              onClick={() => setShowOnboarding(false)}
              className="bg-near-black text-white px-8 py-3 rounded-comfort font-bold text-sm hover:bg-near-black/90 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      {/* Left Column: Configurations */}
      <div className="w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <section className="bg-white border border-border-cream rounded-generous p-6 shadow-whisper shrink-0">
          <h3 className="text-sm font-bold text-near-black mb-4 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-terracotta" />
            File Format
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pdf', icon: FileText, label: 'PDF' },
              { id: 'txt', icon: FileText, label: 'TXT' },
              { id: 'md', icon: FileCode, label: 'MD' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as ExportFormat)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-comfort border transition-all gap-2",
                  format === f.id 
                    ? "bg-terracotta/5 border-terracotta text-terracotta shadow-sm" 
                    : "bg-parchment/30 border-border-cream text-olive-gray hover:border-stone-gray"
                )}
              >
                <f.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{f.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-border-cream rounded-generous p-6 shadow-whisper shrink-0">
          <h3 className="text-sm font-bold text-near-black mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-terracotta" />
            Export Presets
          </h3>
          <div className="space-y-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={cn(
                  "w-full text-left p-4 rounded-comfort border transition-all relative group",
                  selectedPreset === preset.id
                    ? "bg-terracotta/5 border-terracotta shadow-sm"
                    : "bg-parchment/30 border-border-cream hover:border-stone-gray"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "text-xs font-bold",
                    selectedPreset === preset.id ? "text-terracotta" : "text-near-black"
                  )}>
                    {preset.name}
                  </span>
                  {selectedPreset === preset.id && (
                    <div className="w-4 h-4 rounded-full bg-terracotta flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-olive-gray leading-relaxed pr-4">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-border-cream rounded-generous p-6 shadow-whisper shrink-0">
          <h3 className="text-sm font-bold text-near-black mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-terracotta" />
            Metadata
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-1.5 block">
                Document Title
              </label>
              <input 
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                className="w-full bg-parchment/30 border border-border-cream rounded-comfort px-3 py-2 text-xs focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none transition-all"
                placeholder="Enter title..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-1.5 block">
                Hook Type
              </label>
              <input 
                type="text"
                value={metadata.hookType}
                onChange={(e) => setMetadata({ ...metadata, hookType: e.target.value })}
                className="w-full bg-parchment/30 border border-border-cream rounded-comfort px-3 py-2 text-xs focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none transition-all"
                placeholder="e.g. Controversial opinion"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-gray uppercase tracking-widest mb-1.5 block">
                Tags
              </label>
              <input 
                type="text"
                value={metadata.tags}
                onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                className="w-full bg-parchment/30 border border-border-cream rounded-comfort px-3 py-2 text-xs focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none transition-all"
                placeholder="Gaming, Tutorial, Review"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Live Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border border-border-cream rounded-generous shadow-whisper flex flex-col h-full overflow-hidden">
          <div className="h-14 border-b border-border-cream px-6 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-comfort bg-parchment flex items-center justify-center">
                <FileText className="w-4 h-4 text-terracotta" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-near-black leading-tight">Final Script Preview</h3>
                <p className="text-[10px] text-olive-gray">Rendering as {format.toUpperCase()} • {PRESETS.find(p => p.id === selectedPreset)?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Copy to Clipboard">
                <button 
                  className="p-2 text-olive-gray hover:text-near-black hover:bg-parchment rounded-comfort transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(previewContent);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Share Script">
                <button className="p-2 text-olive-gray hover:text-near-black hover:bg-parchment rounded-comfort transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-white border border-border-cream rounded shadow-sm p-12 min-h-full font-serif">
              {format === 'md' ? (
                <div className="max-w-none">
                  <h1 className="text-2xl font-bold mb-4 text-near-black">{metadata.title}</h1>
                  <div className="flex gap-4 mb-8 text-[11px] text-olive-gray font-sans italic border-b border-border-cream pb-4">
                    <span>Hook: {metadata.hookType}</span>
                    <span>Tags: {metadata.tags}</span>
                  </div>
                  
                  {result?.video_structure.map((section, index) => {
                    const style = getSegmentStyle(section.segment_type);
                    const draft = drafts[index] || '';
                    return (
                      <div key={index} className="mb-8 last:mb-0">
                        <div className="flex items-center gap-2 mb-3 font-sans">
                          <span className="text-[10px] font-bold text-stone-gray px-1.5 py-0.5 bg-parchment rounded border border-border-cream">
                            {section.timestamp}
                          </span>
                          <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", style.bg, style.border, style.text)}>
                            {section.segment_type}
                          </span>
                          <span className="text-xs font-bold text-near-black">{section.title}</span>
                        </div>
                        <div className="pl-4 border-l-2 border-border-cream italic text-xs text-olive-gray mb-3 font-sans leading-relaxed">
                          {section.description}
                        </div>
                        <div className="text-sm text-near-black leading-relaxed whitespace-pre-wrap min-h-[1.5em]">
                          {draft || <span className="text-stone-300 italic">[No draft written for this section]</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-xs font-mono text-near-black leading-relaxed">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>

          <div className="h-20 border-t border-border-cream px-8 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              {showConfirmation && (
                <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium">Export successful!</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !result}
              className={cn(
                "h-11 px-8 rounded-comfort font-bold text-sm flex items-center gap-2 transition-all shadow-whisper relative overflow-hidden",
                isExporting 
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                  : "bg-terracotta text-white hover:bg-terracotta/90 hover:-translate-y-0.5"
              )}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
