import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair, VoterCategory } from '../types/election';
import { Trophy, Clock, Vote, ArrowRight, ShieldCheck, BarChart2 } from 'lucide-react';

interface QuickCountViewProps {
  onGoToVoting: () => void;
  onViewCandidateDetails: (candidate: CandidatePair) => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({ onGoToVoting, onViewCandidateDetails }) => {
  const { candidates, stats, settings, lastVoteTime, tokens } = useElection();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const unusedTokensCount = tokens.filter((t) => !t.isUsed).length;

  // Format date time
  const formattedLastUpdate = lastVoteTime
    ? new Date(lastVoteTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
    : 'Menunggu suara pertama';

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 mb-3 flex-wrap">
            <span className="text-blue-800 font-semibold">{settings.schoolName}</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Ajaran {settings.academicYear}</span>
            <span aria-hidden="true">·</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {candidates.length} Pasangan Calon
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
            {settings.quickCountTitle || 'Quick Count Perhitungan Suara Pemilihan OSIS'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {settings.quickCountSubtitle || `Pantau perolehan suara resmi Calon Ketua dan Wakil Ketua OSIS ${settings.schoolName} secara real-time, transparan, dan akurat.`}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToVoting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              <Vote className="w-4 h-4" />
              <span>Gunakan Hak Pilih (Bilik Suara)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 py-1.5 px-3 bg-slate-100 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Update Terakhir: {formattedLastUpdate}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 py-1.5 px-3 bg-slate-100 rounded-md">
              <span className={`inline-block w-2 h-2 rounded-full ${settings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>Status: {settings.isOpen ? 'Pemungutan Suara Aktif' : 'Pemungutan Suara Ditutup'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Overview Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Suara Masuk</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {stats.totalVotes.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">/ {stats.totalVoters} DPT</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {unusedTokensCount} pemilih belum memberikan suara
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Partisipasi</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-blue-600">
              {stats.turnoutPercentage}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.turnoutPercentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margin Keunggulan</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {stats.margin}
            </span>
            <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">
              ({stats.marginPercentage}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.leaderCandidateId
              ? `Dipimpin oleh Paslon No. ${candidates.find((c) => c.id === stats.leaderCandidateId)?.number || stats.leaderCandidateId}`
              : 'Perolehan suara imbang'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validitas & Keamanan</div>
          <div className="mt-2 flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Token Terenkripsi</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            1 pemilih = 1 token rahasia, audit trail otomatis.
          </p>
        </div>
      </section>

      {/* Main Candidates Quick Count Cards (Dynamic for N candidates) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Perolehan Suara Pasangan Calon OSIS ({candidates.length} Paslon)
          </h2>
          <div className="text-xs text-slate-500">
            Total {stats.totalVotes} Suara Sah Terverifikasi
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${
            candidates.length === 2
              ? 'lg:grid-cols-2'
              : candidates.length === 3
              ? 'lg:grid-cols-3'
              : 'md:grid-cols-2 xl:grid-cols-4'
          } gap-6`}
        >
          {candidates.map((c) => {
            const isLeader = stats.leaderCandidateId === c.id;
            const voteCount = stats.votesPerCandidate[c.id] || 0;
            const votePercent = stats.percentagePerCandidate[c.id] || 0;

            return (
              <div
                key={c.id}
                className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs flex flex-col justify-between ${
                  isLeader && stats.totalVotes > 0
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Lead Banner */}
                {isLeader && stats.totalVotes > 0 && (
                  <div
                    className="text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 tracking-wide shadow-xs"
                    style={{ backgroundColor: c.color.primary }}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>MEMIMPIN SEMENTARA (+{stats.margin} SUARA)</span>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Photo Poster */}
                    <div className="relative w-full sm:w-36 h-48 sm:h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                      <img
                        src={c.posterImage}
                        alt={`Foto Paslon ${c.number} ${c.chairman.name}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <div
                        className="absolute top-2 left-2 text-white font-extrabold text-sm px-2.5 py-1 rounded-md shadow-xs"
                        style={{ backgroundColor: c.color.primary }}
                      >
                        {c.number}
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 w-full space-y-1.5">
                      <span
                        className="text-xs font-bold uppercase tracking-wider block"
                        style={{ color: c.color.primary }}
                      >
                        Pasangan Calon No. {c.number}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                        {c.chairman.name} & {c.viceChairman.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {c.chairman.class} & {c.viceChairman.class}
                      </p>
                      <p className="text-xs italic text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
                        "{c.tagline}"
                      </p>
                    </div>
                  </div>

                  {/* Big Number Progress */}
                  <div
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: c.color.bgSoft || '#f8fafc', borderColor: c.color.border || '#e2e8f0' }}
                  >
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span
                        className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums"
                        style={{ color: c.color.primary }}
                      >
                        {votePercent}%
                      </span>
                      <span className="text-sm font-semibold font-mono tabular-nums text-slate-700">
                        {voteCount.toLocaleString('id-ID')} Suara
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${votePercent}%`, backgroundColor: c.color.primary }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onViewCandidateDetails(c)}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: c.color.primary }}
                    >
                      Lihat Visi, Misi & Program →
                    </button>
                    <span className="text-[11px] text-slate-400">
                      SMPN 50 Jakarta
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Aggregate Multi-Segment Visual Balance Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-base">
              Distribusi Rasio Perolehan Suara
            </h3>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Total {stats.totalVotes} Suara Sah
          </div>
        </div>

        {/* Multi-Segment Stacked Bar */}
        <div className="space-y-2">
          <div className="w-full h-7 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner p-0.5 gap-0.5">
            {candidates.map((c) => {
              const pct = stats.percentagePerCandidate[c.id] || 0;
              const votesCount = stats.votesPerCandidate[c.id] || 0;

              return (
                <div
                  key={c.id}
                  style={{
                    width: `${stats.totalVotes > 0 ? pct : 100 / candidates.length}%`,
                    backgroundColor: c.color.primary
                  }}
                  className="h-full flex items-center justify-center text-white text-xs font-bold font-mono transition-all duration-700 rounded-lg overflow-hidden whitespace-nowrap px-1"
                  title={`Paslon ${c.number}: ${pct}% (${votesCount} suara)`}
                >
                  {pct >= 8 && `${c.number} · ${pct}%`}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: c.color.primary }}
                />
                <span className="font-bold text-slate-800">
                  Paslon {c.number}:
                </span>
                <span className="text-slate-600 font-mono">
                  {stats.votesPerCandidate[c.id] || 0} Suara ({stats.percentagePerCandidate[c.id] || 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown per Category & Class Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Perolehan Suara Berdasarkan Tingkat & Kelas
            </h3>
            <p className="text-xs text-slate-500">
              Rincian partisipasi suara di masing-masing angkatan SMP Negeri 50 Jakarta
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 flex-wrap">
            {[
              { id: 'all', label: 'Semua Tingkat' },
              { id: 'Kelas 7', label: 'Kelas 7' },
              { id: 'Kelas 8', label: 'Kelas 8' },
              { id: 'Kelas 9', label: 'Kelas 9' },
              { id: 'Guru & Staf', label: 'Guru & Staf' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-white text-slate-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category cards summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Kelas 7', 'Kelas 8', 'Kelas 9', 'Guru & Staf'] as VoterCategory[])
            .filter((cat) => selectedCategory === 'all' || selectedCategory === cat)
            .map((cat) => {
              const data = stats.byCategory[cat] || { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} };

              return (
                <div key={cat} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cat}</span>
                    <span className="text-xs font-mono text-slate-500">{data.total} Suara</span>
                  </div>

                  <div className="space-y-2">
                    {candidates.map((c) => {
                      const count = data.votesPerCandidate[c.id] || 0;
                      const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0';

                      return (
                        <div key={c.id}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium">Paslon {c.number}</span>
                            <span className="font-mono font-semibold" style={{ color: c.color.primary }}>
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: c.color.primary }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Detailed Class Table (Dynamic columns for each candidate) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Kelas / Rombel</th>
                {candidates.map((c) => (
                  <th key={c.id} className="py-3 px-4 text-center">
                    Suara Paslon {c.number}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Total Masuk</th>
                <th className="py-3 px-4 text-center">Keunggulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Object.keys(stats.byClass).length === 0 ? (
                <tr>
                  <td colSpan={3 + candidates.length} className="py-8 text-center text-slate-400">
                    Belum ada data perolehan suara per kelas.
                  </td>
                </tr>
              ) : (
                Object.entries(stats.byClass)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([cls, row]) => {
                    // Find highest candidate in this class
                    let maxInClass = -1;
                    let leadCandId: number | null = null;
                    let tie = false;

                    candidates.forEach((c) => {
                      const v = row.votesPerCandidate[c.id] || 0;
                      if (v > maxInClass) {
                        maxInClass = v;
                        leadCandId = c.id;
                        tie = false;
                      } else if (v === maxInClass && maxInClass > 0) {
                        tie = true;
                      }
                    });

                    const leaderCand = !tie && maxInClass > 0 ? candidates.find((c) => c.id === leadCandId) : null;

                    return (
                      <tr key={cls} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {cls === 'GURU' ? 'Dewan Guru' : cls === 'TU' ? 'Tata Usaha' : cls === 'TENDIK' ? 'Tenaga Kependidikan' : `Kelas ${cls}`}
                        </td>
                        {candidates.map((c) => {
                          const vCount = row.votesPerCandidate[c.id] || 0;
                          return (
                            <td key={c.id} className="py-3 px-4 text-center font-mono tabular-nums font-semibold" style={{ color: c.color.primary }}>
                              {vCount}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {row.total}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {leaderCand ? (
                            <span
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-block"
                              style={{ backgroundColor: leaderCand.color.bgSoft || '#eff6ff', color: leaderCand.color.primary }}
                            >
                              Paslon {leaderCand.number} ({maxInClass})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Seimbang / Kosong</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
