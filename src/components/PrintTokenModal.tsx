import React from 'react';
import { VoterToken } from '../types/election';
import { useElection } from '../context/ElectionContext';
import { Printer, X, Shield, Lock } from 'lucide-react';

interface PrintTokenModalProps {
  tokens: VoterToken[];
  onClose: () => void;
}

export const PrintTokenModal: React.FC<PrintTokenModalProps> = ({ tokens, onClose }) => {
  const { settings } = useElection();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-8 space-y-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Format Cetak Kartu Token Pemilih
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {tokens.length} kartu token siap gunting untuk dibagikan ke siswa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto pr-2 space-y-4 print:p-0 print:overflow-visible" id="printable-token-area">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tokens.map((t, idx) => (
              <div
                key={idx}
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-slate-800 space-y-3 relative page-break-inside-avoid"
              >
                {/* Header card */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'}
                      alt={settings.schoolName}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[10px] font-bold text-slate-800 uppercase truncate max-w-[140px]">
                      {settings.schoolName}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    {t.classGroup}
                  </span>
                </div>

                {/* Token Core */}
                <div className="text-center py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                    TOKEN PEMILIHAN
                  </span>
                  <div className="font-mono text-base font-extrabold tracking-wider text-blue-900 mt-0.5">
                    {t.token}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {t.voterName || t.category}
                  </span>
                </div>

                {/* Instructions */}
                <div className="text-[9px] text-slate-500 leading-tight space-y-1">
                  <div className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                    <span>Rahasia & 1x Pakai</span>
                  </div>
                  <p>Masukkan token di situs e-voting untuk mencoblos Paslon 01 atau Paslon 02.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Tips: Gunakan ukuran kertas A4, opsi "Background graphics" dicentang pada dialog print.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
