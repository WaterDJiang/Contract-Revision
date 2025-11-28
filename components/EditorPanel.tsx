
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EditorMode, DiffChange } from '../types';
import { computeLineDiff } from '../utils/diffHelper';
import { convertMarkdownToHtml, convertHtmlToMarkdown, generateDocBlob, generateRedlineHtml, getContractTitle, toFilenameBase, stripRedlineHtml } from '../utils/formatHelpers';
import { parseFile } from '../utils/fileHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  IconCheck, IconX, IconBold, IconItalic, IconH1, IconH2, IconList, 
  IconUpload, IconDownload, IconEdit, IconEye, IconPlusChat, IconChevronDown, IconUndo, IconRedo
} from './Icons';

interface EditorPanelProps {
  contractMarkdown: string;
  proposedMarkdown: string | null;
  comparisonMarkdown?: string | null; 
  isDiffMode: boolean; 
  baselineMarkdown?: string | null;
  initialBaselineMarkdown?: string | null;
  highlights?: string[];
  onAcceptChange: () => void;
  onRejectChange: () => void;
  onMarkdownChange: (newMarkdown: string) => void;
  onAddToChat: (text: string) => void;
}

type ViewTab = 'draft' | 'format';

const EditorPanel: React.FC<EditorPanelProps> = ({
  contractMarkdown,
  proposedMarkdown,
  comparisonMarkdown,
  isDiffMode,
  baselineMarkdown,
  initialBaselineMarkdown,
  highlights = [],
  onAcceptChange,
  onRejectChange,
  onMarkdownChange,
  onAddToChat
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('draft');
  const [isImporting, setIsImporting] = useState(false);
  const { t } = useLanguage();
  
  const [showFloatBtn, setShowFloatBtn] = useState(false);
  const [floatBtnPos, setFloatBtnPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isRichTextDirty, setIsRichTextDirty] = useState(false);
  const [history, setHistory] = useState<string[]>([contractMarkdown]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);

  const richTextRef = useRef<HTMLDivElement>(null);
  const draftTextRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabSwitch = (newTab: ViewTab) => {
    if (newTab === activeTab) return;

    if (newTab === 'format') {
      // Switching TO Format: rendering handles conversion
    } else {
      // Switching TO Draft: capture HTML -> MD
      if (richTextRef.current && isRichTextDirty) {
        const html = stripRedlineHtml(richTextRef.current.innerHTML);
        const md = convertHtmlToMarkdown(html);
        onMarkdownChange(md);
        setIsRichTextDirty(false);
      }
    }
    setActiveTab(newTab);
  };

  useEffect(() => {
    if (isDiffMode) {
      setActiveTab('draft');
    }
  }, [isDiffMode]);

  const diffChanges: DiffChange[] = useMemo(() => {
    // Priority 1: AI Proposal vs Current
    if (isDiffMode && proposedMarkdown) {
      return computeLineDiff(contractMarkdown, proposedMarkdown);
    }
    // Priority 2: Original vs Comparison (Contract Diff Mode)
    if (isDiffMode && comparisonMarkdown) {
      return computeLineDiff(comparisonMarkdown, contractMarkdown);
    }
    return [];
  }, [contractMarkdown, proposedMarkdown, comparisonMarkdown, isDiffMode]);

  useEffect(() => {
    if (isApplyingHistory) {
      setIsApplyingHistory(false);
      return;
    }
    if (history[historyIndex] !== contractMarkdown) {
      const next = history.slice(0, historyIndex + 1);
      next.push(contractMarkdown);
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }
  }, [contractMarkdown]);

  const handleUndo = () => {
    if (isDiffMode) return;
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setIsApplyingHistory(true);
      setHistoryIndex(idx);
      onMarkdownChange(history[idx]);
    }
  };

  const handleRedo = () => {
    if (isDiffMode) return;
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setIsApplyingHistory(true);
      setHistoryIndex(idx);
      onMarkdownChange(history[idx]);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo(); else handleUndo();
    } else if (meta && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const canUndo = !isDiffMode && historyIndex > 0;
  const canRedo = !isDiffMode && historyIndex < history.length - 1;

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMarkdownChange(e.target.value);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    setShowFloatBtn(false);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = draftTextRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const text = textarea.value.substring(start, end);
      setSelectedText(text);
      
      const x = e.clientX;
      const y = e.clientY;
      
      setFloatBtnPos({ x, y });
      setShowFloatBtn(true);
    } else {
      setShowFloatBtn(false);
    }
  };

  const handleAddToChatClick = () => {
    if (selectedText) {
      onAddToChat(selectedText);
      setShowFloatBtn(false);
    }
  };

  const handleRichTextBlur = () => {
    if (richTextRef.current) {
      const html = stripRedlineHtml(richTextRef.current.innerHTML);
      const md = convertHtmlToMarkdown(html);
      onMarkdownChange(md);
      setIsRichTextDirty(false);
    }
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    setIsRichTextDirty(true);
  };

  const formatHtml = useMemo(() => {
    if (isDiffMode) {
      if (proposedMarkdown) {
        return generateRedlineHtml(contractMarkdown || '', proposedMarkdown || '');
      }
      if (comparisonMarkdown) {
        return generateRedlineHtml(comparisonMarkdown || '', contractMarkdown || '');
      }
      return generateRedlineHtml(baselineMarkdown || contractMarkdown || '', contractMarkdown || '');
    }
    if (initialBaselineMarkdown && initialBaselineMarkdown !== contractMarkdown) {
      return generateRedlineHtml(initialBaselineMarkdown || '', contractMarkdown || '');
    }
    if (baselineMarkdown && baselineMarkdown !== contractMarkdown) {
      return generateRedlineHtml(baselineMarkdown || '', contractMarkdown || '');
    }
    return convertMarkdownToHtml(contractMarkdown);
  }, [isDiffMode, comparisonMarkdown, contractMarkdown, baselineMarkdown, initialBaselineMarkdown, proposedMarkdown]);

  useEffect(() => {
    if (activeTab === 'format' && richTextRef.current) {
      richTextRef.current.innerHTML = formatHtml;
    }
  }, [formatHtml, activeTab]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const markdown = await parseFile(file);
      onMarkdownChange(markdown);
      setActiveTab('draft');
    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to import file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportClean = () => {
    const html = convertMarkdownToHtml(contractMarkdown);
    const blob = generateDocBlob(html);
    const name = toFilenameBase(getContractTitle(contractMarkdown));
    triggerDownload(blob, `${name}_Final.doc`);
  };

  const handleExportRedline = () => {
    const targetDiffBase = initialBaselineMarkdown || comparisonMarkdown || contractMarkdown;
    const redlineHtml = generateRedlineHtml(targetDiffBase || '', contractMarkdown || '');
    const blob = generateDocBlob(redlineHtml);
    const name = toFilenameBase(getContractTitle(contractMarkdown));
    triggerDownload(blob, `${name}_Redlined.doc`);
  };

  const renderHighlightedText = () => {
    if (!highlights || highlights.length === 0) return contractMarkdown;

    let content = contractMarkdown;
    const segments: { text: string, isHighlight: boolean }[] = [{ text: contractMarkdown, isHighlight: false }];

    highlights.forEach(highlight => {
      if (!highlight.trim()) return;
      const raw = highlight.trim().slice(0, 500);
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const strippedMd = raw.replace(/\*\*/g, '').replace(/`/g, '').replace(/_/g, '');
      const escaped = escapeRegExp(strippedMd);
      const cleanHighlight = escaped.replace(/\s+/g, '[\\s\\n]+');
      let regex: RegExp;
      try {
        regex = new RegExp(`(${cleanHighlight})`, 'g');
      } catch {
        return;
      }

      for (let i = 0; i < segments.length; i++) {
        if (!segments[i].isHighlight) {
          const parts = segments[i].text.split(regex);
          if (parts.length > 1) {
            const newSegments = [];
            for (let j = 0; j < parts.length; j++) {
              if (parts[j].match(regex)) {
                 newSegments.push({ text: parts[j], isHighlight: true });
              } else if (parts[j]) {
                 newSegments.push({ text: parts[j], isHighlight: false });
              }
            }
            segments.splice(i, 1, ...newSegments);
            i += newSegments.length - 1;
          }
        }
      }
    });

    return segments.map((seg, idx) => 
      seg.isHighlight ? <mark key={idx} className="highlight-mark">{seg.text}</mark> : <span key={idx}>{seg.text}</span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".md,.txt,.html,.doc,.docx,.pdf" 
        className="hidden" 
      />

      {/* Navbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between bg-zinc-900 px-4 shrink-0 z-20">
        <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => handleTabSwitch('draft')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'draft' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <IconEdit className="w-3.5 h-3.5" />
            {t.editor.tabDraft}
          </button>
          <button
            onClick={() => handleTabSwitch('format')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'format' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <IconEye className="w-3.5 h-3.5" />
            {t.editor.tabFormat}
          </button>
        </div>

        <div className="flex items-center gap-2 relative">
             <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors ${!canUndo ? 'opacity-50' : ''}`}
                title={t.editor.btnUndo}
             >
               <IconUndo className="w-4 h-4" />
             </button>
             <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors ${!canRedo ? 'opacity-50' : ''}`}
                title={t.editor.btnRedo}
             >
               <IconRedo className="w-4 h-4" />
             </button>
             <button 
                onClick={handleImportClick} 
                disabled={isImporting}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors border border-zinc-700 ${isImporting ? 'opacity-50' : ''}`} 
                title={t.editor.btnImport}
             >
               {isImporting ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" /> : <IconUpload className="w-4 h-4" />}
               <span>{t.editor.btnImport}</span>
             </button>
             
             {/* Export Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setShowExportMenu(!showExportMenu)}
                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors border border-zinc-700"
                 title={t.editor.btnSave}
               >
                 <IconDownload className="w-4 h-4" />
                 <span>{t.editor.btnSave}</span>
                 <IconChevronDown className="w-3 h-3" />
               </button>
               
               {showExportMenu && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-100">
                    <button 
                      onClick={handleExportClean}
                      className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border-b border-zinc-800/50"
                    >
                      {t.editor.btnExportClean}
                    </button>
                    <button 
                      onClick={handleExportRedline}
                      className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      {t.editor.btnExportRedline}
                    </button>
                 </div>
               )}
             </div>
        </div>
      </div>

      {activeTab === 'format' && (
        <div className="h-12 border-b border-zinc-800 flex items-center px-4 gap-3 bg-zinc-900/50 backdrop-blur-sm animate-in slide-in-from-top-2">
           <div className="flex items-center gap-1 border-r border-zinc-800 pr-3">
             <select onChange={(e) => execCmd('fontName', e.target.value)} className="bg-transparent text-xs text-zinc-300 focus:outline-none hover:bg-zinc-800 rounded p-1 w-24 cursor-pointer" defaultValue="Merriweather">
                <option value="Merriweather">{t.editor.fontSerif}</option>
                <option value="Inter">{t.editor.fontSans}</option>
                <option value="monospace">{t.editor.fontMono}</option>
             </select>
             <select onChange={(e) => execCmd('fontSize', e.target.value)} className="bg-transparent text-xs text-zinc-300 focus:outline-none hover:bg-zinc-800 rounded p-1 w-16 cursor-pointer" defaultValue="3">
                <option value="3">{t.editor.sizeNormal}</option>
                <option value="5">{t.editor.sizeLarge}</option>
                <option value="1">{t.editor.sizeSmall}</option>
             </select>
           </div>
           <div className="flex items-center gap-1">
             <button onClick={() => execCmd('bold')} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"><IconBold className="w-4 h-4"/></button>
             <button onClick={() => execCmd('italic')} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"><IconItalic className="w-4 h-4"/></button>
             <button onClick={() => execCmd('formatBlock', 'H2')} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"><IconH2 className="w-4 h-4"/></button>
             <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"><IconList className="w-4 h-4"/></button>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative" onClick={() => setShowExportMenu(false)}>
        
        {/* Floating "Add to Chat" Button */}
        {showFloatBtn && activeTab === 'draft' && !isDiffMode && (
          <div 
            style={{ top: floatBtnPos.y - 50, left: floatBtnPos.x - 20 }}
            className="fixed z-50 animate-in fade-in zoom-in duration-200"
          >
            <button
              onClick={handleAddToChatClick}
              className="flex items-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-full shadow-xl hover:bg-brand-500 hover:scale-105 transition-all text-xs font-medium"
            >
              <IconPlusChat className="w-4 h-4" />
              {t.editor.addToChat}
            </button>
          </div>
        )}

        {/* DRAFT MODE */}
        {activeTab === 'draft' && (
          <div className="absolute inset-0 flex flex-col bg-zinc-950">
            {isDiffMode ? (
              <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
                {diffChanges.map((change, i) => (
                  <div 
                    key={i}
                    className={`whitespace-pre-wrap px-2 py-0.5 ${
                      change.type === 'added' ? 'bg-emerald-900/30 text-emerald-100 border-l-2 border-emerald-500' :
                      change.type === 'removed' ? 'bg-rose-900/20 text-rose-300/50 border-l-2 border-rose-500/50 line-through decoration-rose-500/30' :
                      'text-zinc-400'
                    }`}
                  >
                    {change.value}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 relative overflow-hidden">
                {/* Backdrop for Highlights */}
                <div 
                  ref={backdropRef}
                  className="absolute inset-0 p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-transparent z-0 pointer-events-none overflow-y-auto scrollbar-hide"
                  aria-hidden="true"
                >
                  {renderHighlightedText()}
                </div>

                {/* Actual Editable Textarea */}
                <textarea
                  ref={draftTextRef}
                  value={contractMarkdown}
                  onChange={handleDraftChange}
                  onScroll={handleScroll}
                  onMouseUp={handleMouseUp}
                  onKeyDown={handleEditorKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent text-zinc-300 font-mono text-sm p-8 resize-none focus:outline-none leading-relaxed z-10 selection:bg-brand-500/30"
                  placeholder={t.editor.placeholder}
                />
                
                <div className="absolute bottom-4 right-4 flex gap-2 z-20 pointer-events-none">
                  <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">{t.editor.mdLabel}</div>
                </div>
              </div>
            )}

            {isDiffMode && proposedMarkdown && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-50">
                <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl shadow-2xl border border-zinc-700/80 backdrop-blur-xl animate-in slide-in-from-bottom-8">
                  <div className="flex flex-col px-2 border-r border-zinc-700">
                      <span className="text-xs font-semibold text-zinc-100">{t.editor.reviewTitle}</span>
                  </div>
                  <button onClick={onRejectChange} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 transition-all text-xs font-medium">
                    <IconX className="w-4 h-4" /> {t.editor.btnReject}
                  </button>
                  <button onClick={onAcceptChange} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-all text-xs font-medium">
                    <IconCheck className="w-4 h-4" /> {t.editor.btnAccept}
                  </button>
                </div>
              </div>
            )}
            
             {isDiffMode && comparisonMarkdown && !proposedMarkdown && (
               <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="px-4 py-2 bg-zinc-900/90 border border-brand-500/30 rounded-full text-xs text-brand-200 shadow-lg flex items-center gap-2">
                     <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                     {t.editor.compareTitle}
                  </div>
               </div>
             )}
          </div>
        )}

        {/* FORMAT MODE */}
        {activeTab === 'format' && (
          <div className="absolute inset-0 overflow-y-auto bg-zinc-100/90 p-8">
            <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] h-auto bg-white shadow-xl my-4 ring-1 ring-black/5 flex flex-col">
              <div 
                ref={richTextRef}
                contentEditable
                onBlur={handleRichTextBlur}
                onInput={() => setIsRichTextDirty(true)}
                onKeyDown={handleEditorKeyDown}
                className="editor-content flex-1 px-12 py-16 text-zinc-900 font-serif outline-none"
                dangerouslySetInnerHTML={{ __html: formatHtml }}
                suppressContentEditableWarning
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
