
import React, { useState, useRef } from 'react';
import { IconX, IconCompare, IconUpload, IconFile } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { parseFile } from '../utils/fileHelpers';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (original: string, revised: string) => void;
}

const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, onCompare }) => {
  const { t } = useLanguage();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const originalInputRef = useRef<HTMLInputElement>(null);
  const revisedInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartCompare = async () => {
    if (!originalFile || !revisedFile) return;
    
    setIsProcessing(true);
    try {
      const originalText = await parseFile(originalFile);
      const revisedText = await parseFile(revisedFile);
      onCompare(originalText, revisedText);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error reading files");
    } finally {
      setIsProcessing(false);
      setOriginalFile(null);
      setRevisedFile(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-zinc-100">
            <div className="p-2 rounded-lg bg-zinc-800">
              <IconCompare className="w-6 h-6 text-brand-500" />
            </div>
            <h2 className="text-xl font-semibold">{t.compare.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Original File Upload */}
          <div 
            className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-950/50 hover:bg-zinc-900 hover:border-zinc-500 transition-all cursor-pointer"
            onClick={() => originalInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={originalInputRef}
              onChange={(e) => setOriginalFile(e.target.files?.[0] || null)}
              accept=".md,.txt,.doc,.docx,.pdf"
            />
            {originalFile ? (
              <div className="text-center px-2">
                <IconFile className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-200 font-medium truncate max-w-[140px]">{originalFile.name}</p>
              </div>
            ) : (
              <div className="text-center">
                <IconUpload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-medium">{t.compare.original}</p>
                <p className="text-xs text-zinc-600 mt-1">{t.compare.upload}</p>
              </div>
            )}
          </div>

          {/* Revised File Upload */}
          <div 
            className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-950/50 hover:bg-zinc-900 hover:border-zinc-500 transition-all cursor-pointer"
            onClick={() => revisedInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={revisedInputRef}
              onChange={(e) => setRevisedFile(e.target.files?.[0] || null)}
              accept=".md,.txt,.doc,.docx,.pdf"
            />
            {revisedFile ? (
              <div className="text-center px-2">
                <IconFile className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-200 font-medium truncate max-w-[140px]">{revisedFile.name}</p>
              </div>
            ) : (
              <div className="text-center">
                <IconUpload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-medium">{t.compare.revised}</p>
                <p className="text-xs text-zinc-600 mt-1">{t.compare.upload}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            {t.compare.cancel}
          </button>
          <button 
            onClick={handleStartCompare}
            disabled={!originalFile || !revisedFile || isProcessing}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/20 transition-all"
          >
            {isProcessing ? 'Processing...' : t.compare.compareBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
