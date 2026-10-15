import React, { useState, useEffect } from 'react';
import { useElection } from '../context/ElectionContext';
import { audioManager } from '../utils/audio';
import { Maximize2, Minimize2, Volume2, VolumeX, Trophy, ArrowLeft } from 'lucide-react';

interface ProjectorModeProps {
  onExit: () => void;
}

export const ProjectorMode: React.FC<ProjectorModeProps> = ({ onExit }) => {
  const { candidates, stats, settings } = useElection();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const toggleSound = () => {
    const nextState = audioManager.toggleMute();
    setIsMuted(!nextState);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Bar for Projector */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <img
            src={settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'}
            alt={settings.schoolName}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full ring-2 ring-amber-500/50 object-cover shadow-lg"
          />
          <div>
            <div className="text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <span>{settings.quickCountTitle || 'SISTEM QUICK COUNT RESMI'}</span>
              <span>·</span>
              <span className="text-white">{candidates.length} PASLON</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">
              {settings.electionName} {settings.schoolName}
            </h1>
            <div className="text-xs text-slate-400 mt-0.5">
              Tahun Ajaran {settings.academicYear} · {settings.schoolAddress}
            </div>
          </div>
        </div>

        {/* Controls and Clock */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block mr-2">
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {currentTime.toLocaleTimeString('id-ID')} WIB
            </div>
            <div className="text-[11px] text-slate-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={toggleSound}
            title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title="Layar Penuh"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      {/* Main Multi-Stage Presentation for Any Number of Candidates */}
      <main className="my-auto py-8">
        <div
          className={`grid grid-cols-1 ${
            candidates.length === 2
              ? 'lg:grid-cols-2 max-w-6xl'
              : candidates.length === 3
              ? 'lg:grid-cols-3 max-w-7xl'
              : 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl'
          } gap-6 sm:gap-8 mx-auto items-stretch`}
        >
          {candidates.map((c) => {
            const isLeader = stats.leaderCandidateId === c.id && stats.totalVotes > 0;
            const voteCount = stats.votesPerCandidate[c.id] || 0;
            const votePercent = stats.percentagePerCandidate[c.id] || 0;

            return (
              <div
                key={c.id}
                className={`rounded-3xl p-6 sm:p-7 border transition-all duration-500 relative flex flex-col justify-between ${
                  isLeader
                    ? 'bg-gradient-to-b from-blue-950/90 to-slate-900 border-blue-500 shadow-2xl ring-2 ring-blue-500/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isLeader && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-white font-extrabold text-xs tracking-wider uppercase py-1.5 px-5 rounded-full shadow-lg flex items-center gap-2 ring-4 ring-slate-950 whitespace-nowrap"
                    style={{ backgroundColor: c.color.primary }}
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>KEUNGGULAN SEMENTARA</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Photo Frame */}
                  <div
                    className="relative w-36 sm:w-44 h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border-2 shadow-xl"
                    style={{ borderColor: c.color.primary }}
                  >
                    <img
                      src={c.posterImage}
                      alt={c.chairman.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                    <div
                      className="absolute top-2 left-2 text-white font-black text-xl px-3 py-1 rounded-lg shadow-md"
                      style={{ backgroundColor: c.color.primary }}
                    >
                      {c.number}
                    </div>
                  </div>

                  {/* Names & Scores */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div
                      className="font-bold text-xs uppercase tracking-wider"
                      style={{ color: c.color.primary }}
                    >
                      PASANGAN CALON {c.number}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                      {c.chairman.name}
                    </h2>
                    <div className="text-base font-semibold text-slate-300">
                      & {c.viceChairman.name}
                    </div>
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      "{c.tagline}"
                    </p>

                    {/* Big Score Box */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <div
                        className="text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight"
                        style={{ color: c.color.primary }}
                      >
                        {votePercent}%
                      </div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-300 mt-1">
                        {voteCount.toLocaleString('id-ID')} Suara Sah
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${votePercent}%`, backgroundColor: c.color.primary }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Ticker Stats with Multi-Segment Progress Bar */}
      <footer className="border-t border-slate-800 pt-5 space-y-4">
        {/* Multi-Candidate Ratio Line */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
          {candidates.map((c) => {
            const pct = stats.percentagePerCandidate[c.id] || 0;
            return (
              <div
                key={c.id}
                style={{
                  width: `${stats.totalVotes > 0 ? pct : 100 / candidates.length}%`,
                  backgroundColor: c.color.primary
                }}
                className="h-full transition-all duration-700"
              />
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 uppercase block text-[10px] font-bold">Total DPT</span>
              <span className="text-white font-mono font-bold text-sm">{stats.totalVoters} Pemilih</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px] font-bold">Suara Masuk</span>
              <span className="text-white font-mono font-bold text-sm">
                {stats.totalVotes} ({stats.turnoutPercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px] font-bold">Selisih Suara</span>
              <span className="text-white font-mono font-bold text-sm">
                {stats.margin} Suara ({stats.marginPercentage}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${settings.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span className="text-white font-bold">
              {settings.isOpen ? 'PEMUNGUTAN SUARA SEDANG BERLANGSUNG' : 'PEMUNGUTAN SUARA TELAH DITUTUP'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
