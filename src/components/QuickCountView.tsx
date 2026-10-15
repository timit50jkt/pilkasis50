import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair, VoterCategory } from '../types/election';
import { CheckCircle2, Trophy, Clock, Vote, ArrowRight, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';

interface QuickCountViewProps {
  onGoToVoting: () => void;
  onViewCandidateDetails: (candidate: CandidatePair) => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({ onGoToVoting, onViewCandidateDetails }) => {
  const { candidates, stats, settings, lastVoteTime, tokens } = useElection();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const c1 = candidates[0];
  const c2 = candidates[1];

  const c1Votes = stats.votesPerCandidate[1] || 0;
  const c2Votes = stats.votesPerCandidate[2] || 0;
  const c1Percent = stats.percentagePerCandidate[1] || 0;
  const c2Percent = stats.percentagePerCandidate[2] || 0;

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
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 mb-3">
            <span className="text-blue-800 font-semibold">{settings.schoolName}</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Ajaran {settings.academicYear}</span>
            <span aria-hidden="true">·</span>
            <span>Asas LUBER JURDIL</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
            Quick Count Perhitungan Suara Pemilihan OSIS
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Pantau perolehan suara resmi Calon Ketua dan Wakil Ketua OSIS SMP Negeri 50 Jakarta secara real-time, transparan, dan akurat.
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

            <div className="flex items-center gap-2 text-xs text-slate-500 py-1 px-2.5 bg-slate-100 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Update Terakhir: {formattedLastUpdate}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 py-1 px-2.5 bg-slate-100 rounded-md">
              <span className={`inline-block w-2 h-2 rounded-full ${settings.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
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
            {unusedTokensCount} siswa belum memberikan suara
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
              ? `Dipimpin oleh Paslon No. 0${stats.leaderCandidateId}`
              : 'Perolehan suara imbang'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validitas & Keamanan</div>
          <div className="mt-2 flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Token 100% Terenkripsi</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            1 siswa = 1 token rahasia, audit trail otomatis.
          </p>
        </div>
      </section>

      {/* Main Candidate Quick Count Showdown Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Perolehan Suara Calon Ketua & Wakil Ketua OSIS
          </h2>
          <div className="text-xs text-slate-500">
            Total {stats.totalVotes} Suara Sah Terverifikasi
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PASLON 01 */}
          <div
            className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
              stats.leaderCandidateId === 1
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-slate-200'
            }`}
          >
            {/* Lead Tag */}
            {stats.leaderCandidateId === 1 && stats.totalVotes > 0 && (
              <div className="bg-blue-600 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 tracking-wide">
                <Trophy className="w-3.5 h-3.5" />
                <span>MEMIMPIN SEMENTARA (+{stats.margin} SUARA)</span>
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {/* Photo Poster */}
                <div className="relative w-full sm:w-44 h-56 sm:h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                  <img
                    src={c1.posterImage}
                    alt="Foto Paslon 01 Andra Pratama & Maya Lestari"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-2 left-2 bg-blue-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-md shadow-xs">
                    01
                  </div>
                </div>

                {/* Candidate Info & Score */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Pasangan Calon No. 01
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {c1.chairman.name} & {c1.viceChairman.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c1.chairman.class} & {c1.viceChairman.class}
                    </p>
                    <p className="text-xs italic text-slate-600 mt-1.5">
                      "{c1.tagline}"
                    </p>
                  </div>

                  {/* Big Number Progress */}
                  <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-blue-900">
                        {c1Percent}%
                      </span>
                      <span className="text-sm font-semibold font-mono tabular-nums text-blue-800">
                        {c1Votes.toLocaleString('id-ID')} Suara
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200/60 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${c1Percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => onViewCandidateDetails(c1)}
                      className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      Lihat Visi, Misi & Program Kerja →
                    </button>
                    <span className="text-xs text-slate-400">
                      SMPN 50 Jakarta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PASLON 02 */}
          <div
            className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
              stats.leaderCandidateId === 2
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200'
            }`}
          >
            {/* Lead Tag */}
            {stats.leaderCandidateId === 2 && stats.totalVotes > 0 && (
              <div className="bg-emerald-600 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 tracking-wide">
                <Trophy className="w-3.5 h-3.5" />
                <span>MEMIMPIN SEMENTARA (+{stats.margin} SUARA)</span>
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {/* Photo Poster */}
                <div className="relative w-full sm:w-44 h-56 sm:h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                  <img
                    src={c2.posterImage}
                    alt="Foto Paslon 02 Rafi H. & Alya N."
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-md shadow-xs">
                    02
                  </div>
                </div>

                {/* Candidate Info & Score */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      Pasangan Calon No. 02
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {c2.chairman.name} & {c2.viceChairman.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c2.chairman.class} & {c2.viceChairman.class}
                    </p>
                    <p className="text-xs italic text-slate-600 mt-1.5">
                      "{c2.tagline}"
                    </p>
                  </div>

                  {/* Big Number Progress */}
                  <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-emerald-900">
                        {c2Percent}%
                      </span>
                      <span className="text-sm font-semibold font-mono tabular-nums text-emerald-800">
                        {c2Votes.toLocaleString('id-ID')} Suara
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-emerald-200/60 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${c2Percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => onViewCandidateDetails(c2)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      Lihat Visi, Misi & Program Kerja →
                    </button>
                    <span className="text-xs text-slate-400">
                      SMPN 50 Jakarta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate Visual Balance Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
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

        {/* Dual Stacked Bar */}
        <div className="space-y-2">
          <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${stats.totalVotes > 0 ? c1Percent : 50}%` }}
              className="bg-blue-600 h-full flex items-center justify-start pl-3 text-white text-xs font-bold font-mono transition-all duration-700"
            >
              {c1Percent > 10 && `01 · ${c1Percent}%`}
            </div>
            <div
              style={{ width: `${stats.totalVotes > 0 ? c2Percent : 50}%` }}
              className="bg-emerald-600 h-full flex items-center justify-end pr-3 text-white text-xs font-bold font-mono transition-all duration-700"
            >
              {c2Percent > 10 && `02 · ${c2Percent}%`}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-blue-700 font-semibold">
              Paslon 01: {c1Votes} Suara ({c1Percent}%)
            </span>
            <span className="text-emerald-700 font-semibold">
              Paslon 02: {c2Votes} Suara ({c2Percent}%)
            </span>
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
              Rincian partisipasi suara di masing-masing angkatan SMPN 50 Jakarta
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
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
              const data = stats.byCategory[cat] || { candidate1: 0, candidate2: 0, total: 0 };
              const p1 = data.total > 0 ? ((data.candidate1 / data.total) * 100).toFixed(1) : '0';
              const p2 = data.total > 0 ? ((data.candidate2 / data.total) * 100).toFixed(1) : '0';

              return (
                <div key={cat} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cat}</span>
                    <span className="text-xs font-mono text-slate-500">{data.total} Suara</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Paslon 01</span>
                        <span className="font-mono font-semibold text-blue-700">{data.candidate1} ({p1}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${p1}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Paslon 02</span>
                        <span className="font-mono font-semibold text-emerald-700">{data.candidate2} ({p2}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${p2}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Detailed Class Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Kelas / Rombel</th>
                <th className="py-3 px-4 text-center">Suara Paslon 01</th>
                <th className="py-3 px-4 text-center">Suara Paslon 02</th>
                <th className="py-3 px-4 text-right">Total Masuk</th>
                <th className="py-3 px-4 text-center">Kecenderungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Object.keys(stats.byClass).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data perolehan suara per kelas.
                  </td>
                </tr>
              ) : (
                Object.entries(stats.byClass)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([cls, row]) => {
                    const diff = row.candidate1 - row.candidate2;
                    let trend = 'Seimbang';
                    let trendClass = 'text-slate-500';
                    if (diff > 0) {
                      trend = `Paslon 01 (+${diff})`;
                      trendClass = 'text-blue-700 font-semibold';
                    } else if (diff < 0) {
                      trend = `Paslon 02 (+${Math.abs(diff)})`;
                      trendClass = 'text-emerald-700 font-semibold';
                    }

                    return (
                      <tr key={cls} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {cls === 'GURU' ? 'Dewan Guru & Staf' : `Kelas ${cls}`}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-blue-700 font-medium">
                          {row.candidate1}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 font-medium">
                          {row.candidate2}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {row.total}
                        </td>
                        <td className={`py-3 px-4 text-center ${trendClass}`}>
                          {trend}
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
