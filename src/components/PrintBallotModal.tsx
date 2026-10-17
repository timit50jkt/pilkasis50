import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { VoterToken } from '../types/election';
import { useElection } from '../context/ElectionContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  X,
  Filter,
  Scissors,
  Info,
  ShieldCheck,
  Download,
  Loader2,
  FileCheck2,
  FileDown,
  CheckCircle2
} from 'lucide-react';

interface PrintBallotModalProps {
  tokens: VoterToken[];
  onClose: () => void;
}

export const PrintBallotModal: React.FC<PrintBallotModalProps> = ({ tokens, onClose }) => {
  const { settings, candidates } = useElection();

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all');

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Manage body class for print styling
  useEffect(() => {
    document.body.classList.add('ballot-modal-open');
    return () => {
      document.body.classList.remove('ballot-modal-open');
      document.body.classList.remove('printing-ballots-active');
    };
  }, []);

  // Extract unique classes/units
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach((t) => {
      if (t.classGroup) set.add(t.classGroup);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [tokens]);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      const matchClass = selectedClass === 'all' || t.classGroup === selectedClass;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unused' && !t.isUsed) ||
        (statusFilter === 'used' && t.isUsed);
      return matchClass && matchStatus;
    });
  }, [tokens, selectedClass, statusFilter]);

  // Group tokens into pages of 3 ballots per A4 sheet
  const pages = useMemo(() => {
    const result: VoterToken[][] = [];
    for (let i = 0; i < filteredTokens.length; i += 3) {
      result.push(filteredTokens.slice(i, i + 3));
    }
    return result;
  }, [filteredTokens]);

  // Trigger Native Browser Print Dialog (Save as PDF / Print directly)
  const handleNativePrint = () => {
    document.body.classList.add('printing-ballots-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-ballots-active');
      }, 1000);
    }, 150);
  };

  // Generate and Download direct .PDF file using jsPDF and html2canvas
  const handleDownloadDirectPdf = async () => {
    if (!printAreaRef.current || pages.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      const pageElements = printAreaRef.current.querySelectorAll<HTMLElement>('.a4-page');
      if (pageElements.length === 0) {
        setIsGeneratingPdf(false);
        return;
      }

      // Initialize jsPDF with A4 Portrait (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const total = pageElements.length;

      for (let i = 0; i < total; i++) {
        setPdfProgress({ current: i + 1, total });
        const element = pageElements[i];

        // Render high-resolution canvas
        const canvas = await html2canvas(element, {
          scale: 2, // 2x sharp resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Fit precisely to A4 dimensions (210 x 297 mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const fileName = `Surat_Suara_Pemilu_OSIS_SMPN50_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setToastSuccess(`File ${fileName} berhasil diunduh!`);
      setTimeout(() => setToastSuccess(null), 4000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to native print if canvas fails
      handleNativePrint();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // Download Standalone Offline Printable HTML File
  const handleDownloadOfflineHtml = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Suara Resmi Pemilu OSIS SMPN 50 Jakarta</title>
  <style>
    @page { size: A4 portrait; margin: 4mm 5mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .a4-page { width: 200mm; height: 287mm; min-height: 287mm; max-height: 287mm; margin: 0 auto; page-break-after: always; break-after: page; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .ballot-card { height: 92mm; max-height: 92mm; border: 2px solid #0f172a; border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; position: relative; background: #fff; page-break-inside: avoid; break-inside: avoid; }
    .grid-paslon { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 4px 0; flex: 1; }
    .paslon-box { border: 1.5px solid #0f172a; border-radius: 4px; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body onload="window.print()">
  <div class="no-print" style="background: #eff6ff; padding: 12px; border-bottom: 1px solid #bfdbfe; text-align: center; font-size: 13px; font-weight: bold; color: #1e40af;">
    📄 Dokumen Surat Suara Resmi SMPN 50 Jakarta Siap Cetak (A4 - 3 Surat Suara / Lembar). Jendela cetak akan terbuka otomatis.
  </div>
  <div style="padding: 10px 0;">
    ${content}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cetak_Surat_Suara_Mandiri_A4_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastSuccess('Dokumen mandiri siap cetak (.html) berhasil diunduh!');
    setTimeout(() => setToastSuccess(null), 4000);
  };

  // Portal into document.body to prevent parent container clipping
  return createPortal(
    <div id="ballot-print-portal" className="fixed inset-0 z-9999 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:block">
      <div className="print-modal-content bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl my-3 space-y-4 max-h-[96vh] flex flex-col print:max-w-none print:w-full print:p-0 print:my-0 print:shadow-none print:max-h-none print:rounded-none print:border-none print:block">

        {/* =========================================================================
            HEADER & ACTIONS (Hidden in print)
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Format Formal Surat Suara Pemilu (Kertas A4)
                </h2>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300">
                  Tepat 3 Surat Suara / Lembar
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                  Format Resmi KPU
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Desain resmi ala Surat Suara Pemilu: KOP formal berlogo, nomor urut tegas, foto paslon, identitas token pemilih, dan pengesahan panitia (tanpa teks instruksi coblos).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Direct PDF Download Button */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handleDownloadDirectPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Unduh langsung file dokumen .PDF ke komputer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {pdfProgress
                      ? `Menyiapkan PDF (${pdfProgress.current}/${pdfProgress.total})...`
                      : 'Memproses PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  <span>Unduh File PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Native Browser Print Dialog Button */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handleNativePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Cetak langsung ke printer fisik atau simpan lewat dialog browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Dialog</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            FILTER TOOLBAR (Hidden in print)
            ========================================================================= */}
        <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filter Kelas / Unit:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="all">Semua Kelas & Unit ({tokens.length} Pemilih)</option>
                {availableClasses.map((cls) => {
                  const count = tokens.filter((t) => t.classGroup === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} ({count} Pemilih)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Status Hak Suara:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unused' | 'used')}
                className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="all">Semua Pemilih</option>
                <option value="unused">Belum Memilih Saja</option>
                <option value="used">Sudah Memilih</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-600 flex items-center gap-2 flex-wrap">
            <span className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-md border border-blue-200">
              Total: {filteredTokens.length} Surat Suara
            </span>
            <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-md">
              {pages.length} Lembar Kertas A4
            </span>
          </div>
        </div>

        {/* =========================================================================
            PETUNJUK CETAK & DOWNLOAD PDF LENGKAP (Hidden in print)
            ========================================================================= */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-950 shrink-0 print:hidden">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="font-bold text-amber-950 text-xs">
              Cara Download & Cetak PDF Rapi (3 Surat Suara per Lembar A4):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="font-bold text-emerald-700 block mb-0.5">
                  1. Download PDF Langsung:
                </span>
                Klik tombol hijau <strong>"Unduh File PDF (.pdf)"</strong> di atas. Sistem akan mengonversi semua lembar surat suara ke format PDF standar dan langsung mengunduh filenya ke komputer Anda.
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="font-bold text-blue-700 block mb-0.5">
                  2. Cetak / Simpan via Dialog Browser:
                </span>
                Klik <strong>"Cetak / Print Dialog"</strong>. Pada jendela printer, pilih <strong>Destination: Simpan sebagai PDF (Save as PDF)</strong>, ukuran kertas <strong>A4</strong>, margin <strong>Minimum/None</strong>, dan pastikan centang <strong>"Grafik Latar Belakang" (Background graphics)</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Toast Success Message */}
        {toastSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastSuccess}</span>
          </div>
        )}

        {/* =========================================================================
            PRINTABLE SHEETS AREA (Rendered in preview & in print)
            ========================================================================= */}
        <div
          ref={printAreaRef}
          id="printable-ballot-area"
          className="print-scroll-container overflow-y-auto pr-1 flex-1 space-y-6 print:space-y-0 print:overflow-visible print:p-0 print:m-0"
        >
          {pages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 print:hidden">
              <p className="text-sm font-semibold text-slate-600">
                Tidak ada pemilih yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            pages.map((pageTokens, pageIdx) => (
              <div
                key={pageIdx}
                className="a4-page bg-white mx-auto border border-slate-300 shadow-md p-2 print:border-none print:shadow-none print:p-0 print:m-0"
                style={{
                  width: '200mm',
                  height: '287mm',
                  minHeight: '287mm',
                  maxHeight: '287mm',
                  boxSizing: 'border-box',
                  pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
                  breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto'
                }}
              >
                {/* 3 Formal Ballots per A4 Sheet */}
                <div className="flex flex-col h-full justify-between gap-1 print:gap-0">
                  {pageTokens.map((t, bIdx) => {
                    const ballotNumber = pageIdx * 3 + bIdx + 1;
                    const isLastOnPage = bIdx === pageTokens.length - 1;

                    return (
                      <div
                        key={t.token}
                        className="ballot-card border-2 border-slate-950 rounded-md p-2 flex flex-col justify-between bg-white relative print:border-slate-950"
                        style={{
                          height: '92mm',
                          maxHeight: '92mm',
                          boxSizing: 'border-box',
                          overflow: 'hidden'
                        }}
                      >
                        {/* -------------------------------------------------------------
                            1. KOP RESMI FORMAL PEMILU OSIS (ALA KPU)
                            ------------------------------------------------------------- */}
                        <div className="border-b-2 border-slate-950 pb-1 flex items-center justify-between gap-2">
                          {/* Logo Kiri & Identitas Instansi */}
                          <div className="flex items-center gap-2">
                            <img
                              src={settings.logoUrl || '/images/logo_smpn50_jakarta_1792047092022.jpg'}
                              alt="Logo Sekolah"
                              className="w-9 h-9 object-contain shrink-0"
                              crossOrigin="anonymous"
                            />
                            <div className="text-left leading-tight">
                              <div className="text-[7px] font-bold tracking-widest text-slate-700 uppercase">
                                PEMERINTAH PROVINSI DKI JAKARTA • DINAS PENDIDIKAN
                              </div>
                              <div className="text-[10.5px] font-black tracking-tight text-slate-950 uppercase">
                                {settings.schoolName || 'SMP NEGERI 50 JAKARTA'}
                              </div>
                              <div className="text-[8px] font-extrabold text-slate-900 tracking-wider uppercase">
                                SURAT SUARA RESMI PEMILIHAN KETUA & WAKIL KETUA OSIS {settings.academicYear || '2024/2025'}
                              </div>
                            </div>
                          </div>

                          {/* KOTAK IDENTITAS PEMILIH & TOKEN RESMI (Kanan) */}
                          <div className="border-2 border-slate-950 rounded px-2 py-0.5 bg-slate-50 text-right shrink-0">
                            <div className="text-[6.5px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                              KODE TOKEN PEMILIH
                            </div>
                            <div className="font-mono text-[13px] font-black tracking-widest text-slate-950 leading-tight">
                              {t.token}
                            </div>
                            <div className="text-[7.5px] font-bold text-slate-800 leading-none">
                              {t.classGroup} • DPT #{String(ballotNumber).padStart(3, '0')}
                            </div>
                          </div>
                        </div>

                        {/* -------------------------------------------------------------
                            2. KOLOM PASANGAN CALON (FORMAL PEMILU KPU STYLE)
                            ------------------------------------------------------------- */}
                        <div className="grid grid-cols-2 gap-2 my-1 flex-1 items-stretch">
                          {candidates.slice(0, 2).map((cand) => (
                            <div
                              key={cand.id}
                              className="border-2 border-slate-950 rounded p-1 flex flex-col justify-between bg-white"
                            >
                              {/* Header Nomor Urut KPU */}
                              <div className="border-b-1.5 border-slate-950 pb-0.5 flex items-center justify-between bg-slate-100 px-1.5 -mx-1 -mt-1 rounded-t">
                                <span className="text-[7.5px] font-black tracking-wider text-slate-700 uppercase">
                                  NOMOR URUT
                                </span>
                                <div className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-[11px]">
                                  {cand.number}
                                </div>
                              </div>

                              {/* Foto Pasangan Calon Berdampingan */}
                              <div className="flex items-center justify-center my-0.5">
                                <div className="w-26 h-15 rounded border border-slate-400 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center shadow-2xs">
                                  <img
                                    src={cand.posterImage}
                                    alt={`Foto Paslon ${cand.number}`}
                                    className="w-full h-full object-contain"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              </div>

                              {/* Kotak Nama Calon Ketua & Wakil Ketua (Formal Box KPU) */}
                              <div className="border border-slate-300 rounded bg-slate-50 p-0.5 text-center leading-tight space-y-0.5">
                                <div className="text-[8px] font-black text-slate-950 truncate uppercase">
                                  <span className="text-[6.5px] text-slate-500 font-semibold block">CALON KETUA OSIS</span>
                                  {cand.chairman.name}
                                </div>
                                <div className="text-[8px] font-black text-slate-950 truncate uppercase border-t border-slate-200 pt-0.5">
                                  <span className="text-[6.5px] text-slate-500 font-semibold block">CALON WAKIL KETUA OSIS</span>
                                  {cand.viceChairman.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* -------------------------------------------------------------
                            3. PENGESAHAN RESMI PANITIA PEMILU (TANPA KATA COBLOS)
                            ------------------------------------------------------------- */}
                        <div className="border-t border-slate-950 pt-0.5 flex items-center justify-between text-[7px] text-slate-800 leading-none">
                          <div className="font-bold tracking-tight uppercase">
                            SURAT SUARA SAH APABILA DITANDATANGANI & DICAP PANITIA
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="italic text-slate-600">Panitia Pemilihan OSIS / MPK</span>
                            <span className="font-bold border-b border-dotted border-slate-700 px-2">
                              ( Tanda Tangan Panitia )
                            </span>
                          </div>
                        </div>

                        {/* -------------------------------------------------------------
                            4. GARIS POTONG ANTAR SURAT SUARA
                            ------------------------------------------------------------- */}
                        {!isLastOnPage && (
                          <div className="absolute -bottom-1.5 left-0 right-0 flex items-center justify-center pointer-events-none print:flex">
                            <div className="w-full border-t border-dashed border-slate-400 relative">
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[6.5px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                <Scissors className="w-2.5 h-2.5" />
                                <span>Gunting Sesuai Garis (Batas Surat Suara)</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* =========================================================================
            FOOTER CONTROLS (Hidden in print)
            ========================================================================= */}
        <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Format Kertas:</span>
            <span>A4 Standar (210 × 297 mm) terbagi rata menjadi 3 surat suara formal per lembar.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleDownloadOfflineHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
              title="Unduh file HTML mandiri yang bisa dibuka & dicetak di komputer/fotokopi manapun"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Unduh Berkas Cetak Mandiri (.html)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Tutup
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handleDownloadDirectPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {pdfProgress
                      ? `Menyiapkan PDF (${pdfProgress.current}/${pdfProgress.total})...`
                      : 'Memproses PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  <span>Unduh File PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handleNativePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Dialog</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
