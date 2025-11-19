import React, { useState, useCallback, useEffect } from 'react';
import { INITIAL_CONTRACT, Message, Sender, EditorMode } from './types';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import { IconFile, IconHistory } from './components/Icons';
import { processUserRequest } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'lexigen_contract_draft_md';

const App: React.FC = () => {
  const [contractMarkdown, setContractMarkdown] = useState<string>("");
  const [proposedMarkdown, setProposedMarkdown] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.VIEW);
  const [highlights, setHighlights] = useState<string[]>([]);
  
  // Context State (for "Add to Chat")
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm Lexi. Ask me to draft clauses or analyze the risks in your contract.",
      sender: Sender.AI,
      timestamp: new Date(),
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

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
      } else {
        setContractMarkdown(INITIAL_CONTRACT);
      }
    } catch (e) {
      console.warn("Error reading from localStorage", e);
      setContractMarkdown(INITIAL_CONTRACT);
    }
  }, []);

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
    // Clear highlights on new request
    setHighlights([]);

    try {
      const history = messages.map(m => `${m.sender}: ${m.text}`);
      
      // Prepend context if it exists
      let instruction = text;
      if (selectedContext) {
        instruction = `CONTEXT:\n"""${selectedContext}"""\n\nREQUEST: ${text}`;
      }

      const response = await processUserRequest(contractMarkdown, instruction, history);

      if (response.intent === 'MODIFICATION') {
        const newMarkdown = response.content;
        // Check if actually changed
        const cleanCurrent = contractMarkdown.replace(/\s+/g, ' ').trim();
        const cleanNew = newMarkdown.replace(/\s+/g, ' ').trim();

        if (cleanNew !== cleanCurrent) {
          setProposedMarkdown(newMarkdown);
          setEditorMode(EditorMode.DIFF);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "I've drafted revisions. Check the Draft tab to review changes.",
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "I reviewed the contract but didn't find necessary changes based on your request.",
            sender: Sender.AI,
            timestamp: new Date()
          }]);
        }
      } else {
        // ANALYSIS
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
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I encountered an error. Please try again.",
        sender: Sender.AI,
        timestamp: new Date()
      }]);
      console.error(error);
    } finally {
      setIsProcessing(false);
      setSelectedContext(null); // Clear context after processing
    }
  }, [contractMarkdown, messages, selectedContext]);

  const handleAcceptChange = useCallback(() => {
    if (proposedMarkdown) {
      setContractMarkdown(proposedMarkdown);
      saveToStorage(proposedMarkdown);
      setProposedMarkdown(null);
      setEditorMode(EditorMode.VIEW);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Changes applied.",
        sender: Sender.AI,
        timestamp: new Date()
      }]);
    }
  }, [proposedMarkdown]);

  const handleRejectChange = useCallback(() => {
    setProposedMarkdown(null);
    setEditorMode(EditorMode.VIEW);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: "Changes discarded.",
      sender: Sender.AI,
      timestamp: new Date()
    }]);
  }, []);

  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    setContractMarkdown(newMarkdown);
    saveToStorage(newMarkdown);
    // If user edits, highlights might be invalid, so clear them
    if (highlights.length > 0) setHighlights([]);
  }, [highlights]);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-brand-500/30">
      {/* Sidebar */}
      <div className="w-16 border-r border-zinc-800 flex flex-col items-center py-6 gap-6 bg-zinc-900 z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="flex flex-col gap-4 w-full items-center">
           <button className="p-3 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"><IconFile className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors"><IconHistory className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col min-w-0">
          <EditorPanel 
            contractMarkdown={contractMarkdown}
            proposedMarkdown={proposedMarkdown}
            isDiffMode={editorMode === EditorMode.DIFF}
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
          />
        </div>
      </div>
    </div>
  );
};

export default App;