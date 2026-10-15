import React, { useState, useEffect } from 'react';
import { useElection } from '../context/ElectionContext';
import { audioManager } from '../utils/audio';
import { Maximize2, Minimize2, Volume2, VolumeX, Trophy, ShieldCheck, Clock, ArrowLeft } from 'lucide-react';

interface ProjectorModeProps {
  onExit: () => void;
}

export const ProjectorMode: React.FC<ProjectorModeProps> = ({ onExit }) => {
  const { candidates, stats, settings, lastVoteTime } = useElection();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [currentTime, setCurrentTime] = useState(new Date());

  const c1 = candidates[0];
  const c2 = candidates[1];

  const c1Votes = stats.votesPerCandidate[1] || 0;
  const c2Votes = stats.votesPerCandidate[2] || 0;
  const c1Percent = stats.percentagePerCandidate[1] || 0;
  const c2Percent = stats.percentagePerCandidate[2] || 0;

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
              <span>SISTEM QUICK COUNT RESMI</span>
              <span>·</span>
              <span>LUBER JURDIL</span>
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

      {/* Main Dual Stage Presentation */}
      <main className="my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
          {/* PASLON 01 */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border transition-all duration-500 relative flex flex-col justify-between ${
              stats.leaderCandidateId === 1
                ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-blue-500 shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/50'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {stats.leaderCandidateId === 1 && stats.totalVotes > 0 && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-xs tracking-wider uppercase py-1.5 px-6 rounded-full shadow-lg flex items-center gap-2 ring-4 ring-slate-950">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>KEUNGGULAN SEMENTARA</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Frame */}
              <div className="relative w-40 sm:w-48 h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border-2 border-blue-500/50 shadow-xl">
                <img
                  src={c1.posterImage}
                  alt={c1.chairman.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-2 left-2 bg-blue-600 text-white font-black text-xl px-3 py-1 rounded-lg shadow-md">
                  01
                </div>
              </div>

              {/* Names & Scores */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">
                  PASANGAN CALON 01
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {c1.chairman.name}
                </h2>
                <div className="text-lg font-semibold text-slate-300">
                  & {c1.viceChairman.name}
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{c1.tagline}"
                </p>

                {/* Big Score Box */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-5xl sm:text-6xl font-black font-mono tabular-nums text-blue-400 tracking-tight">
                    {c1Percent}%
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-300 mt-1">
                    {c1Votes.toLocaleString('id-ID')} Suara Sah
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${c1Percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* PASLON 02 */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border transition-all duration-500 relative flex flex-col justify-between ${
              stats.leaderCandidateId === 2
                ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500/50'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {stats.leaderCandidateId === 2 && stats.totalVotes > 0 && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-xs tracking-wider uppercase py-1.5 px-6 rounded-full shadow-lg flex items-center gap-2 ring-4 ring-slate-950">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>KEUNGGULAN SEMENTARA</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Frame */}
              <div className="relative w-40 sm:w-48 h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border-2 border-emerald-500/50 shadow-xl">
                <img
                  src={c2.posterImage}
                  alt={c2.chairman.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-2 left-2 bg-emerald-600 text-white font-black text-xl px-3 py-1 rounded-lg shadow-md">
                  02
                </div>
              </div>

              {/* Names & Scores */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  PASANGAN CALON 02
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {c2.chairman.name}
                </h2>
                <div className="text-lg font-semibold text-slate-300">
                  & {c2.viceChairman.name}
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{c2.tagline}"
                </p>

                {/* Big Score Box */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-5xl sm:text-6xl font-black font-mono tabular-nums text-emerald-400 tracking-tight">
                    {c2Percent}%
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-300 mt-1">
                    {c2Votes.toLocaleString('id-ID')} Suara Sah
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${c2Percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Ticker Stats */}
      <footer className="border-t border-slate-800 pt-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium">Total Suara Masuk</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 tabular-nums">
              {stats.totalVotes} <span className="text-xs text-slate-400">/ {stats.totalVoters} DPT</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium">Partisipasi Pemilih</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
              {stats.turnoutPercentage}%
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium">Selisih Suara</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 tabular-nums">
              {stats.margin} Suara <span className="text-xs text-slate-400">({stats.marginPercentage}%)</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium">Pembaruan Terakhir</div>
            <div className="text-sm sm:text-base font-semibold font-mono text-slate-200 mt-1 tabular-nums">
              {lastVoteTime ? new Date(lastVoteTime).toLocaleTimeString('id-ID') + ' WIB' : 'Menunggu Suara'}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Panitia Pemilihan OSIS & Perwakilan Kelas (MPK) SMP Negeri 50 Jakarta · Data diperbarui otomatis secara real-time
        </div>
      </footer>
    </div>
  );
};
