
import React, { useRef } from 'react';
import { IconRobot, IconShield, IconPen, IconDownload, IconUpload, IconFile, IconGlobe, IconCompare, IconSettings, IconSend } from './Icons';
import { parseFile } from '../utils/fileHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

interface LandingPageProps {
  onNewContract: () => void;
  onImportContract: (content: string) => void;
  onOpenCompare: () => void;
  onOpenSuggest: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNewContract, onImportContract, onOpenCompare, onOpenSuggest }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const { setIsSettingsOpen } = useSettings();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const markdown = await parseFile(file);
      onImportContract(markdown);
    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to import file. Please check format.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const features = [
    {
      icon: <IconRobot className="w-6 h-6 text-brand-400" />,
      title: t.landing.features.copilot.title,
      desc: t.landing.features.copilot.desc
    },
    {
      icon: <IconShield className="w-6 h-6 text-emerald-400" />,
      title: t.landing.features.risk.title,
      desc: t.landing.features.risk.desc
    },
    {
      icon: <IconPen className="w-6 h-6 text-purple-400" />,
      title: t.landing.features.markdown.title,
      desc: t.landing.features.markdown.desc
    },
    {
      icon: <IconDownload className="w-6 h-6 text-amber-400" />,
      title: t.landing.features.export.title,
      desc: t.landing.features.export.desc
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-brand-500/30 overflow-x-hidden">
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-600/20 rounded-full blur-[100px] opacity-30"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
               <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">LexAI</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <IconGlobe className="w-4 h-4" />
              {language === 'en' ? 'English' : '中文'}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              title={t.settings.title}
            >
              <IconSettings className="w-4 h-4" />
              {t.settings.title}
            </button>
            <button
              onClick={onOpenSuggest}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-500/40 text-xs text-brand-300 hover:text-brand-100 hover:bg-brand-600/30 transition-colors"
              title={t.suggest.title}
            >
              <IconSend className="w-4 h-4" />
              {t.suggest.title}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t.landing.badge}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-500 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {t.landing.title}
        </h1>
        
        <p className="max-w-2xl text-lg text-zinc-400 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          {t.landing.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in zoom-in duration-1000 delay-200">
          <button 
            onClick={onNewContract}
            className="group relative px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <IconFile className="w-5 h-5" />
              <span>{t.landing.btnNew}</span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group px-8 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 font-medium transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <IconUpload className="w-5 h-5" />
              <span>{t.landing.btnImport}</span>
            </div>
          </button>

          <button 
            onClick={onOpenCompare}
            className="group px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <IconCompare className="w-5 h-5" />
              <span>{t.landing.btnCompare}</span>
            </div>
          </button>

          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".md,.txt,.html,.doc,.docx,.pdf"
            onChange={handleFileChange}
          />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-800/80 transition-colors text-left">
              <div className="mb-4 p-3 rounded-lg bg-zinc-950 inline-block border border-zinc-800">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 text-center relative z-10">
         <p className="text-zinc-600 text-sm">
           {t.landing.footer}
           <span className="mx-2">·</span>
           {t.landing.moreWorks}
           <a href="https://www.wattter.cn" target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
             wattter.cn
           </a>
         </p>
      </footer>
    </div>
  );
};

export default LandingPage;
