import React from 'react';
import { useElection } from '../context/ElectionContext';
import { ShieldCheck, Vote, BarChart3, Users, Tv, Calendar } from 'lucide-react';

export type ActiveTab = 'quickcount' | 'voting' | 'candidates' | 'timeline' | 'projector';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAdmin }) => {
  const { settings } = useElection();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Title / Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'}
              alt={settings.schoolName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
            />
            <button
              onClick={() => setActiveTab('quickcount')}
              className="text-left font-bold tracking-tight text-slate-900 text-base md:text-lg whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors"
            >
              OSIS {settings.schoolName}
            </button>
          </div>

          {/* Zone 2: Nav Links (Clean single-line labels) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('quickcount')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'quickcount'
                  ? 'bg-slate-100 text-slate-950 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Quick Count</span>
            </button>

            <button
              onClick={() => setActiveTab('voting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'voting'
                  ? 'bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Vote className="w-4 h-4 text-emerald-600" />
              <span>Bilik Suara</span>
            </button>

            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'candidates'
                  ? 'bg-slate-100 text-slate-950 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Profil Paslon</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('projector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'projector'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Layar Proyektor</span>
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-300"
            >
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Panitia MPK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-slate-200 px-2 py-2 flex items-center justify-around bg-slate-50">
        <button
          onClick={() => setActiveTab('quickcount')}
          className={`flex flex-col items-center py-1 px-1.5 text-[11px] font-medium ${
            activeTab === 'quickcount' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Quick Count</span>
        </button>
        <button
          onClick={() => setActiveTab('voting')}
          className={`flex flex-col items-center py-1 px-1.5 text-[11px] font-medium ${
            activeTab === 'voting' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Vote className="w-4 h-4 mb-0.5" />
          <span>Bilik Suara</span>
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex flex-col items-center py-1 px-1.5 text-[11px] font-medium ${
            activeTab === 'candidates' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Paslon</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center py-1 px-1.5 text-[11px] font-medium ${
            activeTab === 'timeline' ? 'text-amber-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setActiveTab('projector')}
          className={`flex flex-col items-center py-1 px-1.5 text-[11px] font-medium ${
            activeTab === 'projector' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Tv className="w-4 h-4 mb-0.5" />
          <span>Proyektor</span>
        </button>
      </div>
    </header>
  );
};
