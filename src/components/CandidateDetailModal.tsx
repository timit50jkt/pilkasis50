import React from 'react';
import { CandidatePair } from '../types/election';
import { X, CheckCircle, Target, Award, BookOpen, Vote } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: CandidatePair | null;
  onClose: () => void;
  onVote: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, onVote }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              INFORMASI RESMI PASLON
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Paslon {candidate.number} · {candidate.chairman.name} & {candidate.viceChairman.name}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              {candidate.chairman.class} & {candidate.viceChairman.class} · SMPN 50 Jakarta
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poster & Slogan - Tampil Utuh Penuh */}
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="relative w-48 sm:w-56 h-64 sm:h-72 rounded-xl overflow-hidden shrink-0 bg-slate-950 flex items-center justify-center p-1.5 shadow-md border border-slate-300">
            <img
              src={candidate.posterImage}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-lg scale-110 pointer-events-none"
            />
            <img
              src={candidate.posterImage}
              alt={`Foto Resmi Paslon ${candidate.number}`}
              referrerPolicy="no-referrer"
              className="relative z-10 w-full h-full object-contain drop-shadow-md"
            />
            <div className="absolute top-2 left-2 z-20 bg-blue-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-xs">
              Nomor {candidate.number}
            </div>
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Tagline Kampanye
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 italic leading-snug">
              "{candidate.tagline}"
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed space-y-1">
              <div className="font-semibold text-slate-800">
                Ketua: {candidate.chairman.name} ({candidate.chairman.class})
              </div>
              <div className="font-semibold text-slate-800">
                Wakil Ketua: {candidate.viceChairman.name} ({candidate.viceChairman.class})
              </div>
              <p className="pt-1 text-slate-500">
                Mewakili aspirasi siswa dan berkomitmen membawa SMP Negeri 50 Jakarta berprestasi, berkarakter, dan bersahabat bagi seluruh warga sekolah.
              </p>
            </div>
          </div>
        </div>

        {/* Vision */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Target className="w-4 h-4 text-blue-600" />
            <span>Visi</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            {candidate.vision}
          </p>
        </div>

        {/* Missions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Misi</span>
          </div>
          <div className="space-y-2">
            {candidate.missions.map((m, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work programs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Program Kerja Utama</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidate.workPrograms.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="font-bold text-slate-800">{p.title}</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onClose();
              onVote();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Vote className="w-4 h-4" />
            <span>Pilih Paslon {candidate.number} Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
