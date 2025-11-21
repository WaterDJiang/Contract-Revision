import React, { useEffect, useState } from 'react';
import { IconX, IconHistory } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getHistory, clearHistory, HistoryEntry } from '../utils/historyStore';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getHistory(200);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    await clearHistory();
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-zinc-100">
            <div className="p-2 rounded-lg bg-zinc-800"><IconHistory className="w-5 h-5 text-brand-500" /></div>
            <h2 className="text-lg font-semibold">{t.history.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800"><IconX className="w-5 h-5" /></button>
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-zinc-500">{loading ? t.history.loading : `${t.history.count}: ${items.length}`}</div>
          <button onClick={handleClear} className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs">{t.history.clear}</button>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-800">
          {items.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-sm">{t.history.empty}</div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {items.map(item => (
                <li key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-zinc-200">{item.type}{item.detail ? ` · ${item.detail}` : ''}</div>
                  <div className="text-xs text-zinc-500">{new Date(item.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
