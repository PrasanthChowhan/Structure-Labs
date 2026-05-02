import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, CheckCircle, ExternalLink, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Workbench } from '../../../lib/Workbench';
import { cn } from '../../../lib/utils';

export const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [issueUrl, setIssueUrl] = useState('');
  const [error, setError] = useState('');
  
  // Image State
  const [imageContent, setImageContent] = useState<string | null>(null);

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImageContent(reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setStatus('submitting');
    setError('');

    try {
      const workbench = Workbench.getInstance();
      const state = workbench.getState();
      
      const snapshot = {
        activeTab: state.activeTab,
        isFocusMode: state.isFocusMode,
        analysisStatus: state.analysis.status,
        timestamp: new Date().toISOString(),
      };

      const url = await invoke<string>('submit_feedback', {
        payload: {
          title,
          description,
          state_snapshot: JSON.stringify(snapshot, null, 2),
          image_path: null,
          image_base64: imageContent,
        }
      });

      setIssueUrl(url);
      setStatus('success');
      setTitle('');
      setDescription('');
      setImageContent(null);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setError(String(err));
      setStatus('error');
    }
  };

  const reset = () => {
    setIsOpen(false);
    setStatus('idle');
    setIssueUrl('');
    setError('');
    setImageContent(null);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-terracotta text-white rounded-full shadow-lg flex items-center justify-center hover:bg-terracotta/90 transition-all z-50 group"
        title="Send Feedback (Dev Only)"
      >
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-near-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-border-cream w-full max-w-md rounded-generous shadow-whisper overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-parchment p-4 border-b border-border-cream flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-terracotta" />
                <h2 className="font-semibold text-olive-gray">Send Feedback</h2>
              </div>
              <button onClick={reset} className="text-olive-gray hover:text-near-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {status === 'success' ? (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                  <div>
                    <h3 className="text-lg font-bold text-near-black">Feedback Submitted!</h3>
                    <p className="text-sm text-olive-gray mt-1">Thank you for your feedback. It has been posted as a GitHub issue.</p>
                  </div>
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-olive-gray text-white rounded-md hover:bg-near-black transition-colors text-sm font-medium"
                  >
                    View on GitHub <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={reset} className="text-sm text-terracotta hover:underline mt-2">
                    Send more feedback
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-olive-gray/60">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary"
                      className="w-full px-3 py-2 bg-parchment border border-border-cream rounded-md focus:outline-none focus:ring-1 focus:ring-terracotta transition-shadow"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-olive-gray/60">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details about your feedback..."
                      rows={4}
                      className="w-full px-3 py-2 bg-parchment border border-border-cream rounded-md focus:outline-none focus:ring-1 focus:ring-terracotta transition-shadow resize-none"
                      required
                    />
                  </div>

                  {/* Image Paste Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-olive-gray/60">Image Attachment</label>
                    {imageContent ? (
                      <div className="relative group rounded-md overflow-hidden border border-border-cream">
                        <img src={imageContent} alt="Pasted" className="w-full h-40 object-contain bg-parchment" />
                        <button 
                          type="button"
                          onClick={() => setImageContent(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-8 border-2 border-dashed border-border-cream rounded-md text-olive-gray/40 flex flex-col items-center gap-2 bg-parchment/30">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium">Press Ctrl+V to paste an image</span>
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className={cn(
                        "w-full py-2 bg-terracotta text-white rounded-md font-medium transition-all flex items-center justify-center gap-2",
                        status === 'submitting' ? "opacity-70 cursor-not-allowed" : "hover:bg-terracotta/90"
                      )}
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
