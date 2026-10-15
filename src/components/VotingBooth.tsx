import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair, VoterToken } from '../types/election';
import confetti from 'canvas-confetti';
import { Check, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, FileText, Lock, Sparkles, Vote } from 'lucide-react';

interface VotingBoothProps {
  onGoToQuickCount: () => void;
  onViewCandidateDetails: (candidate: CandidatePair) => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({ onGoToQuickCount, onViewCandidateDetails }) => {
  const { candidates, tokens, validateToken, castVote, settings } = useElection();

  const [inputToken, setInputToken] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeVoter, setActiveVoter] = useState<VoterToken | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<{ receiptNumber: string; timestamp: string; classGroup: string } | null>(null);

  // List of a few available unused tokens for quick testing
  const unusedSampleTokens = tokens.filter((t) => !t.isUsed).slice(0, 4);

  const handleValidateToken = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = validateToken(inputToken);
    if (!res.isValid || !res.tokenData) {
      setErrorMessage(res.error || 'Token tidak valid.');
      return;
    }

    setActiveVoter(res.tokenData);
    setSelectedCandidateId(null);
  };

  const handleQuickSelectToken = (tokenStr: string) => {
    setInputToken(tokenStr);
    setErrorMessage(null);
  };

  const handleConfirmVote = () => {
    if (!activeVoter || !selectedCandidateId) return;

    const res = castVote(activeVoter.token, selectedCandidateId);
    if (!res.success || !res.receipt) {
      setErrorMessage(res.error || 'Gagal menyimpan suara.');
      setIsConfirmModalOpen(false);
      return;
    }

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if confetti not supported
    }

    setVoteReceipt(res.receipt);
    setIsConfirmModalOpen(false);
  };

  const handleResetVotingSession = () => {
    setInputToken('');
    setActiveVoter(null);
    setSelectedCandidateId(null);
    setVoteReceipt(null);
    setErrorMessage(null);
  };

  // STEP 3: VOTE SUCCESS RECEIPT
  if (voteReceipt) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Hak Suara Berhasil Digunakan
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Terima Kasih Atas Partisipasi Anda!
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Suara Anda telah sah tersimpan di kotak suara digital SMP Negeri 50 Jakarta dan diperhitungkan dalam Quick Count.
            </p>
          </div>

          {/* Digital Receipt Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Tanda Terima Pemilih (E-Ballot)</span>
              <span className="font-mono text-slate-500">{voteReceipt.receiptNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block">Sekolah:</span>
                <span className="font-medium text-slate-800">SMPN 50 Jakarta</span>
              </div>
              <div>
                <span className="text-slate-400 block">Kategori Pemilih:</span>
                <span className="font-medium text-slate-800">{voteReceipt.classGroup}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Coblos:</span>
                <span className="font-mono text-slate-800">
                  {new Date(voteReceipt.timestamp).toLocaleTimeString('id-ID')} WIB
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Token:</span>
                <span className="text-rose-600 font-semibold">Telah Hangus (1x Pakai)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-slate-500 italic text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Pilihan Anda dijamin 100% rahasia sesuai asas LUBER JURDIL.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onGoToQuickCount}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>Pantau Quick Count</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetVotingSession}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Selesai / Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: DIGITAL BALLOT (SURAT SUARA)
  if (activeVoter) {
    const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Voter Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
              {activeVoter.classGroup}
            </div>
            <div>
              <div className="text-xs text-slate-500">Pemilih Terverifikasi:</div>
              <div className="font-semibold text-slate-900 text-sm">
                {activeVoter.voterName || activeVoter.classGroup} ({activeVoter.category})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono bg-slate-100 py-1 px-2.5 rounded-md">
              Token: {activeVoter.token}
            </span>
            <button
              onClick={handleResetVotingSession}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1"
            >
              Batal / Keluar
            </button>
          </div>
        </div>

        {/* Digital Ballot Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-2">
          <div className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
            SURAT SUARA RESMI PEMILIHAN OSIS
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            SMP NEGERI 50 JAKARTA · PERIODE {settings.academicYear}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mx-auto">
            Silakan teliti foto, nama, visi, dan misi kedua pasangan calon. Klik tombol "Coblos Paslon" pada salah satu nomor urut pilihan Anda.
          </p>
        </div>

        {/* Two Ballot Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((c) => {
            const isSelected = selectedCandidateId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className={`cursor-pointer bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
                  isSelected
                    ? 'border-blue-600 ring-4 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Ballot Header with Big Number */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    c.id === 1 ? 'bg-blue-50/70 border-blue-100' : 'bg-emerald-50/70 border-emerald-100'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    PASANGAN CALON
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg text-white shadow-xs ${
                      c.id === 1 ? 'bg-blue-700' : 'bg-emerald-700'
                    }`}
                  >
                    {c.number}
                  </div>
                </div>

                {/* Candidate Image */}
                <div className="relative w-full h-72 bg-slate-100 overflow-hidden">
                  <img
                    src={c.posterImage}
                    alt={`Foto Paslon ${c.number}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-white text-blue-700 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm">
                        <Check className="w-5 h-5 text-blue-600 stroke-[3]" />
                        <span>Paslon Dipilih</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {c.chairman.name} & {c.viceChairman.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.chairman.class} & {c.viceChairman.class}
                    </p>
                    <p className="text-xs italic text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{c.tagline}"
                    </p>

                    <div className="mt-4 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Visi Singkat:
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {c.vision}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCandidateDetails(c);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 underline block"
                    >
                      Buka Rincian Program Kerja Paslon {c.number} →
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidateId(c.id);
                        setIsConfirmModalOpen(true);
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                        isSelected
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Vote className="w-4 h-4" />
                      <span>Coblos Paslon Nomor {c.number}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Modal */}
        {isConfirmModalOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Konfirmasi Pilihan Anda
                </h3>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin memberikan suara kepada:
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-xs font-bold text-blue-700 uppercase">
                  Pasangan Calon No. {selectedCandidate.number}
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedCandidate.chairman.name} & {selectedCandidate.viceChairman.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedCandidate.chairman.class} & {selectedCandidate.viceChairman.class}
                </div>
              </div>

              <p className="text-[11px] text-rose-600 text-center font-medium">
                Peringatan: Setelah konfirmasi, token Anda akan langsung hangus dan pilihan tidak dapat diubah kembali.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVote}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  Ya, Coblos Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STEP 1: TOKEN LOGIN SCREEN
  return (
    <div className="max-w-xl mx-auto py-6 space-y-8">
      {/* Title block */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200/60">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Autentikasi Bilik Suara SMPN 50 Jakarta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Masuk dengan Token Pemilihan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Gunakan token unik yang telah dibagikan oleh Panitia MPK/OSIS. Setiap token hanya berlaku satu kali coblos.
        </p>
      </div>

      {/* Token Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <form onSubmit={handleValidateToken} className="space-y-4">
          <div>
            <label htmlFor="tokenInput" className="block text-xs font-semibold text-slate-700 mb-1.5">
              KODE TOKEN PEMILIH
            </label>
            <div className="relative">
              <input
                id="tokenInput"
                type="text"
                value={inputToken}
                onChange={(e) => {
                  setInputToken(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                placeholder="Contoh: SMP50-7A-4819"
                className="w-full px-4 py-3 text-base sm:text-lg font-mono tracking-wider uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-slate-400"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!inputToken.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span>Buka Surat Suara Digital</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Testing Helper: Sample Active Tokens */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">Token Contoh Siap Pakai (Uji Coba):</span>
            <span className="text-[11px] text-slate-400">Klik untuk menyalin</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {unusedSampleTokens.map((t) => (
              <button
                key={t.token}
                type="button"
                onClick={() => handleQuickSelectToken(t.token)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-colors group"
              >
                <div className="font-mono text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  {t.token}
                </div>
                <div className="text-[10px] text-slate-500">
                  {t.category} ({t.classGroup})
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Voting Principles */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ketentuan Pemilihan SMPN 50:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
            <li>Satu siswa hanya memiliki satu hak suara yang tidak dapat dialihkan.</li>
            <li>Sistem menjamin kerahasiaan pilihan Anda secara otomatis (LUBER JURDIL).</li>
            <li>Apabila token Anda hilang atau bermasalah, segera lapor ke Panitia MPK.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
