import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair } from '../types/election';
import { CheckCircle, Award, Target, BookOpen, Vote, ArrowRight } from 'lucide-react';

interface CandidateCardsProps {
  onGoToVoting: () => void;
  selectedCandidateDetail: CandidatePair | null;
  setSelectedCandidateDetail: (candidate: CandidatePair | null) => void;
}

export const CandidateCards: React.FC<CandidateCardsProps> = ({
  onGoToVoting,
  selectedCandidateDetail,
  setSelectedCandidateDetail
}) => {
  const { candidates, stats } = useElection();
  const [activeTab, setActiveTab] = useState<'all' | '1' | '2'>('all');

  return (
    <div className="space-y-8 pb-12">
      {/* Title block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
            <span>Profil Pasangan Calon Pemilihan OSIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mengenal Lebih Dekat {candidates.length} Pasangan Calon Pemimpin OSIS
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Ketahui visi, misi, rekam jejak, dan program kerja unggulan calon pemimpin OSIS SMP Negeri 50 Jakarta untuk masa bakti yang akan datang.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onGoToVoting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Vote className="w-4 h-4" />
              <span>Buka Bilik Suara untuk Memilih</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Candidates */}
      <div className={`grid grid-cols-1 ${candidates.length === 2 ? 'lg:grid-cols-2' : candidates.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'} gap-8`}>
        {candidates.map((c) => {
          const voteCount = stats.votesPerCandidate[c.id] || 0;
          const votePercent = stats.percentagePerCandidate[c.id] || 0;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
            >
              {/* Header Badge */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  c.id === 1 ? 'bg-blue-50/70 border-blue-100' : 'bg-emerald-50/70 border-emerald-100'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    PASANGAN CALON
                  </span>
                  <div className="text-sm font-bold text-slate-900">
                    Nomor Urut {c.number}
                  </div>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl text-white shadow-xs ${
                    c.id === 1 ? 'bg-blue-700' : 'bg-emerald-700'
                  }`}
                >
                  {c.number}
                </div>
              </div>

              {/* Candidate Image - Tampil Utuh Full Dimension */}
              <div className="relative w-full h-88 sm:h-96 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center p-2 group">
                {/* Subtle ambient backdrop */}
                <img
                  src={c.posterImage}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl scale-110 pointer-events-none"
                />
                {/* Full dimension image (tampil utuh) */}
                <img
                  src={c.posterImage}
                  alt={`Foto Resmi Paslon ${c.number}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      c.number === '02' || c.id === 2
                        ? '/images/paslon_2_smp50_1792047092389.jpg'
                        : '/images/paslon_1_smp50_1792047092011.jpg';
                  }}
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent p-4 text-white">
                  <div className="text-lg font-bold">
                    {c.chairman.name} & {c.viceChairman.name}
                  </div>
                  <div className="text-xs text-slate-300">
                    {c.chairman.class} & {c.viceChairman.class} · SMPN 50 Jakarta
                  </div>
                </div>
              </div>

              {/* Candidate Content Body */}
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Slogan */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Slogan & Tagline
                    </span>
                    <p className="text-sm font-semibold text-slate-800 italic mt-0.5">
                      "{c.tagline}"
                    </p>
                  </div>

                  {/* Vision */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>Visi Utama</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      {c.vision}
                    </p>
                  </div>

                  {/* Missions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Misi Pokok</span>
                    </div>
                    <ul className="space-y-2">
                      {c.missions.map((mission, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{mission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Work Programs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-900 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Program Kerja Unggulan</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {(c.workPrograms || []).length} Program
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(c.workPrograms && c.workPrograms.length > 0) ? (
                        c.workPrograms.map((prog, pIdx) => (
                          <div key={pIdx} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors text-xs space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                {pIdx + 1}
                              </span>
                              <span>{prog.title}</span>
                            </div>
                            {prog.desc && (
                              <p className="text-slate-600 text-[11px] leading-relaxed pl-5.5">{prog.desc}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          Program kerja unggulan sedang dirumuskan oleh Paslon.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono">
                    Perolehan saat ini: <strong className="text-slate-800">{votePercent}%</strong> ({voteCount} suara)
                  </div>
                  <button
                    onClick={onGoToVoting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span>Coblos Paslon {c.number}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
