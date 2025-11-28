import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { APP_NAME, TAGLINE } from '../constants';

interface HeaderProps {
  onGoHome?: () => void;
  onNavigate?: (view: 'home' | 'learn') => void;
  onHistoryClick?: () => void;
  currentView?: 'home' | 'learn';
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onNavigate, onHistoryClick, currentView }) => {
  const handleNav = (e: React.MouseEvent, view: 'home' | 'learn') => {
    e.preventDefault();
    if (view === 'home') {
      onGoHome?.();
    }
    onNavigate?.(view);
  };

  const handleHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    onHistoryClick?.();
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={(e) => handleNav(e, 'home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-red to-brand-darkRed rounded-lg flex items-center justify-center shadow-lg shadow-brand-red/20 group-hover:shadow-brand-red/40 transition-all duration-300 group-hover:scale-105">
            <ShieldAlert className="text-white w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-brand-red transition-colors">
              <span className="text-brand-red">AI</span> {APP_NAME.replace('AI ', '')}
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest hidden sm:block group-hover:text-gray-300">
              {TAGLINE}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
           <a 
             href="#" 
             className={`hover:text-brand-red transition-colors ${currentView === 'home' ? 'text-white' : ''}`} 
             onClick={(e) => handleNav(e, 'home')}
           >
             Scanner
           </a>
           <a 
             href="#learn" 
             className={`hover:text-brand-red transition-colors ${currentView === 'learn' ? 'text-white' : ''}`}
             onClick={(e) => handleNav(e, 'learn')}
           >
             Learn
           </a>
           <a 
             href="#history" 
             onClick={handleHistory}
             className="hover:text-brand-red transition-colors"
           >
             History
           </a>
           <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-xs transition-all border border-white/10 hidden sm:block">
             Open Source
           </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;