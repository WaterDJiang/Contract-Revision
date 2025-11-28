
import React, { useState, useCallback, useEffect } from 'react';
import { INITIAL_CONTRACT, Message, Sender, EditorMode } from './types';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import LandingPage from './components/LandingPage';
import SettingsModal from './components/SettingsModal';
import SuggestModal from './components/SuggestModal';
import CompareModal from './components/CompareModal';
import HistoryModal from './components/HistoryModal';
import { IconFile, IconHistory, IconSettings, IconGitMerge, IconSend } from './components/Icons';
import { processUserRequest } from './services/aiService';
import { addHistory } from './utils/historyStore';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';

const LOCAL_STORAGE_KEY = 'lexigen_contract_draft_md';

const draftIntentRegex = /(起草|草拟|擬|草擬|生成|制作|创建|寫|寫一份|写一份|写一个|給我|给我).*(合同|協議|协议|模板|範本|范本|證書|证书|證明|证明|授權書|授权书|聲明|声明|函)|\b(template|draft|generate|create|write)\b.*\b(contract|agreement|certificate|incumbency|resolution|power\s+of\s+attorney)\b|Certificate\s+of\s+Incumbency/i;

const computeContractScore = (s: string): number => {
  if (!s || typeof s !== 'string') return 0;
  const t = s.trim();
  if (t.length < 200) return 0;
  const title = (t.match(/^#\s*(.+)$/m)?.[1] || '').toLowerCase();
  const early = t.slice(0, 600);
  const negative = /(摘要|要点|概要|概述|清单|清晰列表|Checklist|Summary|Outline|指南|说明|Q&A|常见问题|提纲|笔记|邮件|备忘录|總結|提要|重點|範例說明)/i;
  if (negative.test(title) || negative.test(early)) return 0;
  const docTypeHints = [
    /(合同|協議|协议)/,
    /(證書|证书|證明|证明|Certificate|Incumbency)/i,
    /(授權書|授权书|Power\s*of\s*Attorney)/i,
    /(決議|决议|董事會|董事会|Resolution)/i,
    /(聲明|声明|函|通知|Notice|Statement)/i,
    /(章程|公司章程|Articles\s*of\s*Association)/i
  ];
  let typeHits = 0;
  for (const r of docTypeHints) if (r.test(title) || r.test(early) || r.test(t)) typeHits++;
  const hasParties = /(甲方|乙方|双方|公司|法人)/.test(t) || /(Parties|Party|Company|Corporation)/i.test(t);
  const clauseHeadings = (t.match(/^#{2,3}\s.+$/gm) || []).length;
  const numberedClauses = (t.match(/\n\d+\.\s/g) || []).length + (t.match(/第\s*\d+\s*条/g) || []).length;
  const typicalTerms = [
    /(付款|支付|费用|结算|发票|payment|invoice)/i,
    /(期限|有效期|term)/i,
    /(终止|解除|termination)/i,
    /(保密|机密|confidentiality|confidential)/i,
    /(知识产权|版权|专利|intellectual\s*property)/i,
    /(适用法律|管辖|governing\s*law|jurisdiction|争议|仲裁|arbitration)/i
  ];
  let termHits = 0;
  for (const r of typicalTerms) if (r.test(t)) termHits++;
  const lenScore = Math.min(1, t.length / 1200);
  const kwScore = Math.min(1, typeHits / 2);
  const partiesScore = hasParties ? 1 : 0;
  const structureScore = Math.min(1, (clauseHeadings + numberedClauses) / 6);
  const termsScore = Math.min(1, termHits / 4);
  const score = 0.2 * lenScore + 0.2 * kwScore + 0.2 * partiesScore + 0.2 * structureScore + 0.2 * termsScore;
  return score;
};

const isLikelyContract = (s: string): boolean => computeContractScore(s) >= 0.5;
const isLikelySummary = (s: string): boolean => {
  const t = (s || '').trim();
  if (t.length < 80) return true;
  const early = t.slice(0, 400);
  return /(摘要|要点|概要|概述|清单|Checklist|Summary|Outline|指南|说明|Q&A|常见问题|總結|提要|重點)/i.test(early);
};

type ViewMode = 'landing' | 'editor';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [contractMarkdown, setContractMarkdown] = useState<string>("");
  const [baselineMarkdown, setBaselineMarkdown] = useState<string | null>(null);
  const [initialBaselineMarkdown, setInitialBaselineMarkdown] = useState<string | null>(null);
  const [comparisonMarkdown, setComparisonMarkdown] = useState<string | null>(null);
  const [proposedMarkdown, setProposedMarkdown] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.VIEW);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  
  const { t, language } = useLanguage();
  const { settings, setIsSettingsOpen } = useSettings();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const saveToStorage = (content: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setContractMarkdown(saved);
        setBaselineMarkdown(saved);
        setInitialBaselineMarkdown(saved);
      }
    } catch (e) {
      console.warn("Error reading from localStorage", e);
    }
  }, []);

  const handleNewContract = () => {
    setContractMarkdown("");
    setComparisonMarkdown(null);
    setBaselineMarkdown("");
    setInitialBaselineMarkdown("");
    saveToStorage("");
    setMessages([{
      id: 'welcome',
      text: t.app.welcomeNew,
      sender: Sender.AI,
      timestamp: new Date(),
    }]);
    addHistory({ type: 'new', detail: 'workspace', timestamp: new Date().toISOString() });
    setViewMode('editor');
  };

  const handleImportContract = (content: string) => {
    setContractMarkdown(content);
    setComparisonMarkdown(null);
    setBaselineMarkdown(content);
    setInitialBaselineMarkdown(content);
    saveToStorage(content);
    setMessages([{
      id: 'welcome',
      text: t.app.welcomeImport,
      sender: Sender.AI,
      timestamp: new Date(),
    }]);
    addHistory({ type: 'import', detail: 'file', timestamp: new Date().toISOString() });
    setViewMode('editor');
  };

  const handleCompareContract = (original: string, revised: string) => {
    setComparisonMarkdown(original);
    setContractMarkdown(revised);
    setBaselineMarkdown(revised);
    setInitialBaselineMarkdown(revised);
    setEditorMode(EditorMode.DIFF);
    setViewMode('editor');
    addHistory({ type: 'compare', detail: 'contracts', timestamp: new Date().toISOString() });
    setMessages([{ 
      id: 'compare-welcome',
      text: t.app.welcomeCompare,
      sender: Sender.AI,
      timestamp: new Date()
    }]);
  };

  const handleAddToChat = useCallback((text: string) => {
    setSelectedContext(text);
  }, []);

  const handleClearContext = useCallback(() => {
    setSelectedContext(null);
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setHighlights([]);

    try {
      const history = messages.map(m => `${m.sender}: ${m.text}`);
      
      let instruction = text;

      const comparisonCtx = comparisonMarkdown ? { original: comparisonMarkdown, revised: contractMarkdown } : undefined;

      const response = await processUserRequest(
        contractMarkdown, 
        instruction, 
        history, 
        language,
        settings,
        comparisonCtx,
        selectedContext || undefined
      );

      if (response.intent === 'MODIFICATION') {
        const newMarkdown = response.content;
        const isDraftRequest = draftIntentRegex.test(text);
        const cleanCurrent = contractMarkdown.replace(/\s+/g, ' ').trim();
        const cleanNew = newMarkdown.replace(/\s+/g, ' ').trim();

        if (isDraftRequest) {
          if (isLikelySummary(newMarkdown) || newMarkdown.trim().length < 120) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: response.content,
              sender: Sender.AI,
              timestamp: new Date()
            }]);
          } else {
            const prev = contractMarkdown;
            setContractMarkdown(newMarkdown);
            saveToStorage(newMarkdown);
            setInitialBaselineMarkdown(prev || newMarkdown);
            setBaselineMarkdown(newMarkdown);
            setProposedMarkdown(null);
            setEditorMode(EditorMode.VIEW);
            setMessages(prevMsgs => [...prevMsgs, {
              id: (Date.now() + 1).toString(),
              text: t.app.changesApplied,
              sender: Sender.AI,
              timestamp: new Date()
            }]);
          }
        } else if (!isLikelyContract(newMarkdown)) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: response.content,
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        } else if (!cleanCurrent) {
          setContractMarkdown(newMarkdown);
          saveToStorage(newMarkdown);
          setBaselineMarkdown(newMarkdown);
          setInitialBaselineMarkdown(newMarkdown);
          setProposedMarkdown(null);
          setEditorMode(EditorMode.VIEW);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: t.app.changesApplied,
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        } else if (cleanNew !== cleanCurrent) {
          setProposedMarkdown(newMarkdown);
          setEditorMode(EditorMode.DIFF);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: t.app.diffDrafted,
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: t.app.diffNoChange,
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: response.content,
          sender: Sender.AI,
          timestamp: new Date()
        }]);
        if (response.highlights && response.highlights.length > 0) {
          setHighlights(response.highlights);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.app.processingError;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `${t.app.processingError}: ${errorMessage}`,
        sender: Sender.AI,
        timestamp: new Date()
      }]);
      console.error(error);
    } finally {
      setIsProcessing(false);
      setSelectedContext(null);
    }
  }, [contractMarkdown, comparisonMarkdown, messages, selectedContext, language, t, settings]);

  const handleAcceptChange = useCallback(() => {
    if (proposedMarkdown) {
      setContractMarkdown(proposedMarkdown);
      saveToStorage(proposedMarkdown);
      setBaselineMarkdown(proposedMarkdown);
      addHistory({ type: 'apply', detail: 'changes', timestamp: new Date().toISOString() });
      setProposedMarkdown(null);
      setEditorMode(EditorMode.VIEW);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: t.app.changesApplied,
        sender: Sender.AI,
        timestamp: new Date()
      }]);
    }
  }, [proposedMarkdown, t]);

  const handleRejectChange = useCallback(() => {
    addHistory({ type: 'reject', detail: 'changes', timestamp: new Date().toISOString() });
    setProposedMarkdown(null);
    setEditorMode(EditorMode.VIEW);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: t.app.changesDiscarded,
      sender: Sender.AI,
      timestamp: new Date()
    }]);
  }, [t]);

  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    setContractMarkdown(newMarkdown);
    saveToStorage(newMarkdown);
    if (highlights.length > 0) setHighlights([]);
  }, [highlights]);

  useEffect(() => {
    try {
      const ga = (window as any).gtag;
      const id = (window as any).GA_MEASUREMENT_ID || 'G-70YJGKX4V1';
      if (typeof ga === 'function') {
        ga('config', id, { page_title: document.title, page_path: window.location.pathname });
      }
    } catch {}
  }, [viewMode]);

  if (viewMode === 'landing') {
    return (
      <>
        <SettingsModal />
        <CompareModal 
          isOpen={isCompareModalOpen} 
          onClose={() => setIsCompareModalOpen(false)} 
          onCompare={handleCompareContract} 
        />
        <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        <LandingPage 
          onNewContract={handleNewContract} 
          onImportContract={handleImportContract} 
          onOpenCompare={() => setIsCompareModalOpen(true)}
          onOpenSuggest={() => setIsSuggestModalOpen(true)}
        />
        <SuggestModal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} />
        
      </>
    );
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-brand-500/30 animate-in fade-in duration-500">
      <SettingsModal />
      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        onCompare={handleCompareContract} 
      />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SuggestModal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} />
      
      {/* Sidebar */}
      <div className="w-16 border-r border-zinc-800 flex flex-col items-center py-6 gap-6 bg-zinc-900 z-20 justify-between">
        <div className="flex flex-col items-center gap-6 w-full">
          <button onClick={() => setViewMode('landing')} title={language === 'zh' ? '返回首页' : 'Home'} className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">
            <span className="text-white font-bold">L</span>
          </button>
          <div className="flex flex-col gap-4 w-full items-center">
             <div className="relative group">
               <button title={language === 'zh' ? '文件' : 'Files'} className="p-3 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"><IconFile className="w-5 h-5" /></button>
               <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{language === 'zh' ? '文件' : 'Files'}</span>
             </div>
             <div className="relative group">
               <button 
                 onClick={() => setIsCompareModalOpen(true)}
                 className={`p-3 rounded-xl transition-colors ${comparisonMarkdown ? 'bg-brand-900/30 text-brand-400 border border-brand-500/30' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                 title={language === 'zh' ? '合同比对' : 'Compare Contracts'}
               >
                  <IconGitMerge className="w-5 h-5" />
               </button>
               <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{language === 'zh' ? '合同比对' : 'Compare Contracts'}</span>
             </div>
             <div className="relative group">
               <button onClick={() => setIsHistoryOpen(true)} title={language === 'zh' ? '历史' : 'History'} className="p-3 rounded-xl text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors"><IconHistory className="w-5 h-5" /></button>
               <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{language === 'zh' ? '历史' : 'History'}</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="relative group">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-brand-400 transition-colors"
              title={t.settings.title}
            >
              <IconSettings className="w-5 h-5" />
            </button>
            <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{t.settings.title}</span>
          </div>
          <div className="relative group">
            <button 
              onClick={() => setIsSuggestModalOpen(true)}
              className="p-3 rounded-xl text-brand-300 hover:bg-brand-600/30 hover:text-brand-100 transition-colors"
              title={t.suggest.title}
            >
              <IconSend className="w-5 h-5" />
            </button>
            <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{t.suggest.title}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col min-w-0">
          <EditorPanel 
            contractMarkdown={contractMarkdown}
            proposedMarkdown={proposedMarkdown}
            comparisonMarkdown={comparisonMarkdown}
            isDiffMode={editorMode === EditorMode.DIFF}
            baselineMarkdown={baselineMarkdown}
            initialBaselineMarkdown={initialBaselineMarkdown}
            highlights={highlights}
            onAcceptChange={handleAcceptChange}
            onRejectChange={handleRejectChange}
            onMarkdownChange={handleMarkdownChange}
            onAddToChat={handleAddToChat}
          />
        </div>
        <div className="w-[400px] flex-shrink-0 border-l border-zinc-800 bg-zinc-900 z-10 shadow-2xl">
          <ChatPanel 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            attachedContext={selectedContext}
            onClearContext={handleClearContext}
            contractMarkdown={contractMarkdown}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
  const looksLikeContract = (s: string): boolean => {
    if (!s || typeof s !== 'string') return false;
    const text = s.trim();
    if (text.length < 200) return false;
    const hasHeadings = /^(#{1,3}\s)|(^\d+\.\s)|(^[-*]\s)/m.test(text);
    const zhHints = /(合同|协议|甲方|乙方|服务|期限|终止|付款|保密|知识产权|适用法律)/.test(text);
    const enHints = /(Agreement|Parties|Services|Term|Termination|Payment|Confidentiality|Intellectual Property|Governing Law)/i.test(text);
    return hasHeadings || zhHints || enHints;
  };
