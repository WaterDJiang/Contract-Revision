import React, { useState, useEffect } from 'react';
import { IconX, IconSend } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuggestModal: React.FC<SuggestModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setName('');
      setEmail('');
      setPhone('');
      setIsSubmitting(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!content.trim()) {
      setError(t.suggest.requiredError);
      return;
    }
    setIsSubmitting(true);
    try {
      const url = process.env.SUGGEST_WEBHOOK_URL;
      const user = process.env.SUGGEST_WEBHOOK_USER;
      const pass = process.env.SUGGEST_WEBHOOK_PASS;
      if (!url || !user || !pass) throw new Error(t.suggest.envMissing);

      const auth = btoa(`${user}:${pass}`);
      const payload = {
        suggestion: content.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        locale: language,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      setSuccess(t.suggest.success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`${t.suggest.failed}: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">{t.suggest.title}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t.suggest.contentLabel}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.suggest.contentPlaceholder}
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">{t.suggest.nameLabel}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">{t.suggest.emailLabel}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">{t.suggest.phoneLabel}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </div>
          </div>

          {error && <div className="p-2 rounded bg-rose-900/30 border border-rose-700/40 text-rose-200 text-xs">{error}</div>}
          {success && <div className="p-2 rounded bg-emerald-900/30 border border-emerald-700/40 text-emerald-200 text-xs">{success}</div>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            {t.suggest.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className={`px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 ${isSubmitting || !content.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <IconSend className="w-4 h-4" />
            {isSubmitting ? t.suggest.submitting : t.suggest.submit}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestModal;
