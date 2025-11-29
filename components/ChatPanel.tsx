import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Sender } from '../types';
import { IconSend, IconSparkles, IconTerminal, IconX, IconGlobe } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string, contextText?: string) => void;
  isProcessing: boolean;
  attachedContext: string | null;
  onClearContext: () => void;
  contractMarkdown: string;
  scenario?: 'new' | 'import' | 'compare' | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing, 
  attachedContext,
  onClearContext,
  contractMarkdown,
  scenario
}) => {
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue, attachedContext || undefined);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const suggestions = useMemo(() => {
    const last = messages[messages.length - 1];
    const isAIRecent = last?.sender === Sender.AI;
    const text = (contractMarkdown || '').trim();
    const hasContract = text.length > 100;
    const zh = language === 'zh';
    const hasConf = /(保密|机密|confidential)/i.test(text);
    const hasIP = /(知识产权|版权|专利|intellectual property)/i.test(text);
    const hasPayOrBreach = /(付款|支付|费用|结算|发票|违约|payment|invoice|breach)/i.test(text);
    const hasTermOrTermination = /(期限|终止|解除|term|termination)/i.test(text);
    const hasLaw = /(适用法律|管辖法律|法律适用|governing law)/i.test(text);
    const hasDispute = /(争议|仲裁|法院|jurisdiction|dispute|arbitration)/i.test(text);

    const labels = {
      apply: zh ? '把上面的修改直接应用到合同' : 'Apply the changes above to the contract',
      compliance: zh ? '帮我检查是条款否违反法律' : 'Check if anything violates the law',
      commercial: zh ? '看看付款和违约是否合理' : 'Review payment and breach terms',
      risk: zh ? '加上保密和知识产权条款' : 'Add confidentiality and IP clauses',
      law: zh ? '补充适用法律和争议解决' : 'Add governing law and dispute resolution',
      summary: zh ? '整理合同要点给我' : 'Make a one-page summary for stakeholders',
      startNda: zh ? '起草一份保密协议' : 'Draft an NDA'
    };

    const scenarioLabels: Record<'new'|'import'|'compare', string[]> = {
      new: zh
        ? ['生成一份保密协议（NDA）模板', '生成一份服务合同模板', '生成一份采购合同模板']
        : ['Generate an NDA template', 'Generate a Services Agreement template', 'Generate a Purchase Agreement template'],
      import: zh
        ? ['自动审查风险并给出修改建议', '检查付款与违约是否合理', '生成一页要点总结', '转换为标准格式并美化排版']
        : ['Run risk review and suggestions', 'Check payment and breach reasonableness', 'Create a one-page summary', 'Convert to standard format and improve layout'],
      compare: zh
        ? ['分析原文与修订的差异影响', '汇总重大变更及风险提示', '将修订合并到正文并生成红线版', '导出修订版或最终版']
        : ['Analyze differences and impact', 'Summarize major changes and risks', 'Merge revisions into the contract and create redlines', 'Export redlined or clean version']
    };

    if (scenario) return scenarioLabels[scenario];

    const candidates: Array<{ key: string; text: string; score: number }> = [];
    if (isAIRecent) candidates.push({ key: 'apply', text: labels.apply, score: 100 });
    candidates.push({ key: 'compliance', text: labels.compliance, score: 80 });
    if (!hasPayOrBreach || !hasTermOrTermination) candidates.push({ key: 'commercial', text: labels.commercial, score: 75 });
    if (!hasConf || !hasIP) candidates.push({ key: 'risk', text: labels.risk, score: 70 });
    if (!hasLaw || !hasDispute) candidates.push({ key: 'law', text: labels.law, score: 65 });
    candidates.push({ key: 'summary', text: labels.summary, score: 60 });

    const picked: string[] = [];
    const seenKeys = new Set<string>();
    candidates.sort((a, b) => b.score - a.score);
    for (const c of candidates) {
      if (seenKeys.has(c.key)) continue;
      seenKeys.add(c.key);
      picked.push(c.text);
      if (picked.length >= 4) break;
    }
    return picked;
  }, [messages, language, contractMarkdown, scenario]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconSparkles className="w-5 h-5 text-brand-500" />
          <span className="font-semibold text-zinc-100">{t.chat.title}</span>
        </div>
        <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title={language === 'zh' ? '语言切换' : 'Language'}
        >
            <IconGlobe className="w-4 h-4" />
            <span className="text-[11px]">{language === 'zh' ? '语言切换' : 'Language'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-10 text-sm">
            <p>{t.chat.emptyState}</p>
            <p className="mt-2 text-xs opacity-70">{t.chat.emptyStateSub}</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.sender === Sender.USER
                  ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                  : 'bg-transparent text-zinc-300 border border-zinc-800/50 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
            {msg.contextText && (
              <details className="max-w-[90%] mt-2 text-xs bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
                <summary className="cursor-pointer text-zinc-400">
                  {(msg.contextText || '').slice(0, 10)}{(msg.contextText || '').length > 10 ? '…' : ''}
                </summary>
                <div className="mt-2 text-zinc-300 font-mono break-words whitespace-pre-wrap">
                  {msg.contextText}
                </div>
              </details>
            )}
            <span className="text-[10px] text-zinc-600 mt-1 px-1">
              {msg.sender === Sender.AI ? t.chat.ai : t.chat.user}
            </span>
          </div>
        ))}
        
        {isProcessing && (
           <div className="flex flex-col items-start">
             <div className="max-w-[90%] p-3 rounded-xl bg-transparent border border-zinc-800/50 rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
             <span className="text-[10px] text-zinc-600 mt-1 px-1">{t.chat.generating}</span>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        {suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => !isProcessing && onSendMessage(s)}
                className="px-2.5 py-1 text-[11px] rounded-full border border-zinc-700 text-zinc-300 hover:border-brand-500 hover:text-brand-200 hover:bg-brand-600/10 transition-colors"
                disabled={isProcessing}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {attachedContext && (
          <div className="mb-3 bg-zinc-800/50 border border-brand-500/30 rounded-lg p-2 flex items-start gap-3 relative group">
             <div className="p-1.5 bg-brand-500/10 rounded text-brand-500 mt-0.5">
                <IconTerminal className="w-4 h-4" />
             </div>
             <div className="flex-1 overflow-hidden">
               <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">{t.chat.contextLabel}</div>
               <div className="text-xs text-zinc-300 font-mono line-clamp-3 border-l-2 border-zinc-700 pl-2">
                 {attachedContext}
               </div>
             </div>
             <button 
               onClick={onClearContext}
               className="p-1 text-zinc-500 hover:text-rose-400 transition-colors absolute top-1 right-1"
             >
               <IconX className="w-4 h-4" />
             </button>
          </div>
        )}

        <div className="relative bg-zinc-800/50 rounded-lg border border-zinc-700 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedContext ? t.chat.inputPlaceholderContext : t.chat.inputPlaceholder}
            className="w-full bg-transparent text-zinc-200 text-sm p-3 pr-10 focus:outline-none resize-none max-h-32 min-h-[44px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-1.5 text-zinc-400 hover:text-brand-500 disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-zinc-500 text-center">
          {t.chat.disclaimer}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
