import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { VoterToken, CandidatePair } from '../types/election';
import { useElection } from '../context/ElectionContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  X,
  Filter,
  Scissors,
  ShieldCheck,
  Loader2,
  FileDown,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PrintBallotModalProps {
  tokens: VoterToken[];
  onClose: () => void;
}

// Guaranteed candidate image resolver: NEVER allows candidate photo to be empty or fall back to the school logo
export const resolveCandidateImage = (cand: CandidatePair): string => {
  const url = cand.posterImage;
  if (!url || typeof url !== 'string' || url.includes('logo') || url.trim() === '') {
    return cand.number === '02' || cand.id === 2
      ? '/images/paslon_2_smp50_1792047092389.jpg'
      : '/images/paslon_1_smp50_1792047092011.jpg';
  }
  return url;
};

export const PrintBallotModal: React.FC<PrintBallotModalProps> = ({ tokens, onClose }) => {
  const { settings, candidates } = useElection();

  // Filters & Pagination
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [activePreviewPage, setActivePreviewPage] = useState<number>(0);

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Base64 pre-cached images so html2canvas and jsPDF NEVER drop candidate photos or get CORS issues
  const [base64Logo, setBase64Logo] = useState<string>('');
  const [base64Candidates, setBase64Candidates] = useState<Record<number, string>>({});

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Helper to convert any image URL to Base64 Data URL reliably with timeout guard
  const toDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!url) return resolve('');
      if (url.startsWith('data:')) return resolve(url);

      const timeout = setTimeout(() => {
        resolve(url);
      }, 1500);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 500;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
            return;
          }
        } catch (e) {
          console.warn('Canvas conversion fallback:', e);
        }
        resolve(url);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        // Fallback directly to fetch if Image element fails
        fetch(url)
          .then((res) => (res.ok ? res.blob() : null))
          .then((blob) => {
            if (!blob) return resolve(url);
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(url));
      };
      img.src = url;
    });
  };

  // Pre-load all candidate photos & school logo into Base64 on mount
  useEffect(() => {
    let isMounted = true;

    const prepareAllImages = async () => {
      // 1. School Logo
      const logoPath = settings.logoUrl || '/images/logo_smpn50_jakarta_1792047092022.jpg';
      const b64Logo = await toDataUrl(logoPath);
      if (isMounted) setBase64Logo(b64Logo || logoPath);

      // 2. Candidate Photos (Paslon 1 & Paslon 2)
      const candMap: Record<number, string> = {};
      for (const cand of candidates) {
        const photoUrl = resolveCandidateImage(cand);
        const b64 = await toDataUrl(photoUrl);
        candMap[cand.id] = b64 || photoUrl;
      }
      if (isMounted) {
        setBase64Candidates(candMap);
      }
    };

    prepareAllImages();
    return () => {
      isMounted = false;
    };
  }, [settings.logoUrl, candidates]);

  // Manage body class for native print dialog
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

  // Group tokens into pages of exactly 3 ballots per A4 sheet
  const pages = useMemo(() => {
    const result: VoterToken[][] = [];
    for (let i = 0; i < filteredTokens.length; i += 3) {
      result.push(filteredTokens.slice(i, i + 3));
    }
    return result;
  }, [filteredTokens]);

  // Candidate Pairs (Paslon 01 and Paslon 02)
  const displayCandidates = useMemo(() => {
    if (candidates.length >= 2) return candidates.slice(0, 2);
    return candidates;
  }, [candidates]);

  // Trigger Native Browser Print Dialog
  const handlePrint = () => {
    if (!printAreaRef.current) return;
    document.body.classList.add('printing-ballots-active');
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.warn('Native window.print() error:', e);
      } finally {
        setTimeout(() => {
          document.body.classList.remove('printing-ballots-active');
        }, 1000);
      }
    }, 150);
  };

  // HIGH-DEFINITION FAST PDF DOWNLOAD (Optimized with safety timeouts, scale 1.4, and no freeze)
  const handleDownloadPdf = async (onlyCurrentPage: boolean = false) => {
    if (!printAreaRef.current || pages.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      const allPageElements = printAreaRef.current.querySelectorAll<HTMLElement>('.a4-page');
      if (allPageElements.length === 0) {
        setIsGeneratingPdf(false);
        return;
      }

      const elementsToProcess: HTMLElement[] = onlyCurrentPage
        ? [allPageElements[activePreviewPage] || allPageElements[0]]
        : Array.from(allPageElements);

      const total = elementsToProcess.length;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < total; i++) {
        setPdfProgress({ current: i + 1, total });
        const element = elementsToProcess[i];

        // Yield execution so browser UI updates progress and stays fully interactive
        await new Promise((resolve) => setTimeout(resolve, 30));

        // Clone page into an isolated invisible container with exact A4 screen dimensions
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.width = '794px'; // 210mm in 96dpi
        clone.style.minHeight = '1123px';
        clone.style.background = '#ffffff';
        clone.style.boxSizing = 'border-box';

        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = '794px';
        wrapper.style.height = '1123px';
        wrapper.style.opacity = '0';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.zIndex = '-9999';
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        try {
          // Pre-resolve all images with strict timeout to prevent any infinite freeze
          const imgs = Array.from(clone.querySelectorAll('img'));
          await Promise.all(
            imgs.map((img) => {
              if (img.complete && img.naturalHeight > 0) return Promise.resolve();
              return new Promise((res) => {
                const timer = setTimeout(() => res(null), 120);
                img.onload = () => {
                  clearTimeout(timer);
                  res(null);
                };
                img.onerror = () => {
                  clearTimeout(timer);
                  res(null);
                };
              });
            })
          );

          // Fast & crisp 1.4 scale (razor-sharp text/photos with 3x faster rendering than 2.0)
          const canvas = await html2canvas(clone, {
            scale: 1.4,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 794,
            height: 1123
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.90);

          if (i > 0) {
            pdf.addPage('a4', 'portrait');
          }

          // Draw image filling A4 Portrait (210 x 297 mm)
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        } finally {
          if (wrapper.parentNode) {
            document.body.removeChild(wrapper);
          }
        }
      }

      const fileName = onlyCurrentPage
        ? `Surat_Suara_OSIS_SMPN50_Lembar_${activePreviewPage + 1}.pdf`
        : `Surat_Suara_Pemilu_OSIS_SMPN50_${selectedClass === 'all' ? 'Semua_Kelas' : `Kelas_${selectedClass}`}_${total}_Lembar.pdf`;

      pdf.save(fileName);

      setToastMessage({
        type: 'success',
        text: `✓ File ${fileName} (${total} lembar) berhasil diunduh dan siap dicetak di kertas A4!`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setToastMessage({
        type: 'error',
        text: 'Gagal memproses file PDF secara otomatis. Silakan gunakan tombol "Cetak Sekarang (Print)" lalu pilih Simpan sebagai PDF.'
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  return createPortal(
    <div
      id="ballot-print-portal"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:block"
    >
      <div className="print-modal-content bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl my-3 space-y-4 max-h-[96vh] flex flex-col print:max-w-none print:w-full print:p-0 print:my-0 print:shadow-none print:max-h-none print:rounded-none print:border-none print:block">

        {/* =========================================================================
            HEADER & ACTIONS (Clean, Fast Actions with Progress Percentage)
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
                  Tepat 3 Surat Suara / Lembar A4
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                  Foto Paslon Besar & Cover Lipatan OSIS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Format resmi Pemilu: Sisi kiri adalah Cover Lipatan (Logo OSIS/Sekolah & Token DPT), sisi kanan adalah Kotak Paslon 01 & 02 dengan foto besar dan nama lengkap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* UNDUH LEMBAR SAAT INI (INSTAN 1 DETIK) */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={() => handleDownloadPdf(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              title="Unduh hanya 1 lembar A4 yang sedang tampil di layar (Proses super cepat ~1 detik)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Lembar Ini (1 Lembar)</span>
            </button>

            {/* UNDUH SELURUH LEMBAR PDF */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={() => handleDownloadPdf(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              title="Unduh seluruh lembar surat suara sekaligus dalam 1 file PDF lengkap"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {pdfProgress
                      ? `Menyiapkan (${pdfProgress.current}/${pdfProgress.total} - ${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%)...`
                      : 'Memproses PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Unduh Semua Lembar ({pages.length} Lembar)</span>
                </>
              )}
            </button>

            {/* TOMBOL CETAK LANGSUNG (PRINT / SIMPAN PDF INSTAN) */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              title="Cetak langsung ke printer atau Simpan sebagai PDF instan lewat browser (tanpa render)"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
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
            FILTER & PAGE NAVIGATOR TOOLBAR (Ringkas & Efisien)
            ========================================================================= */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filter Kelas / Unit:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setActivePreviewPage(0);
                }}
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
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'unused' | 'used');
                  setActivePreviewPage(0);
                }}
                className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="all">Semua Pemilih</option>
                <option value="unused">Belum Memilih Saja</option>
                <option value="used">Sudah Memilih</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-600 flex items-center gap-2 flex-wrap">
            {pages.length > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5">
                <button
                  type="button"
                  disabled={activePreviewPage === 0}
                  onClick={() => setActivePreviewPage((prev) => Math.max(0, prev - 1))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                  title="Lembar Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-800 px-1">
                  Lembar {activePreviewPage + 1} dari {pages.length}
                </span>
                <button
                  type="button"
                  disabled={activePreviewPage >= pages.length - 1}
                  onClick={() => setActivePreviewPage((prev) => Math.min(pages.length - 1, prev + 1))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                  title="Lembar Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <span className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-md border border-blue-200">
              Total: {filteredTokens.length} Surat Suara
            </span>
            <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-md">
              {pages.length} Lembar Kertas A4
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {toastMessage && (
          <div
            className={`border text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 print:hidden animate-in fade-in duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* =========================================================================
            PRINTABLE SHEETS AREA (A4 Standard Format: 3 Ballots per Sheet)
            ========================================================================= */}
        <div
          ref={printAreaRef}
          id="printable-ballot-area"
          className="print-scroll-container overflow-y-auto pr-1 flex-1 space-y-6 print:space-y-0 print:overflow-visible print:p-0 print:m-0"
        >
          {pages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 print:hidden">
              <p className="text-sm font-semibold text-slate-600">
                Tidak ada pemilih yang sesuai dengan filter kelas atau status hak suara.
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
                {/* Exactly 3 Formal Ballots per A4 Sheet */}
                <div className="flex flex-col h-full justify-between gap-1 print:gap-0">
                  {pageTokens.map((t, bIdx) => {
                    const ballotNumber = pageIdx * 3 + bIdx + 1;
                    const isLastOnPage = bIdx === pageTokens.length - 1;

                    return (
                      <div
                        key={t.token}
                        className="ballot-card border-2 border-slate-950 rounded-md p-1.5 flex flex-col justify-between bg-white relative print:border-slate-950"
                        style={{
                          height: '92mm',
                          maxHeight: '92mm',
                          boxSizing: 'border-box',
                          overflow: 'hidden'
                        }}
                      >
                        {/* =============================================================
                            STRUKTUR RESMI SURAT SUARA:
                            KIRI: COVER SURAT SUARA RESMI KOMISI PEMILIHAN OSIS (LIPATAN)
                            KANAN: KOTAK PASLON 01 & 02 DENGAN FOTO BESAR & JELAS
                            ============================================================= */}
                        <div className="flex flex-row items-stretch gap-2 h-full flex-1 min-h-0">

                          {/* -----------------------------------------------------------
                              1. SISI KIRI (PINGGIR FOTO): COVER RESMI SURAT SUARA
                              (Area Halaman Depan Saat Surat Suara Dilipat)
                              ----------------------------------------------------------- */}
                          <div className="w-[30%] min-w-[30%] max-w-[30%] border-r-2 border-dashed border-slate-900 pr-2 flex flex-col justify-between relative bg-slate-50/50 -my-1 -ml-1 p-1.5 rounded-l">
                            {/* Logo & Judul Komisi Pemilihan OSIS */}
                            <div className="text-center space-y-0.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <img
                                  src={base64Logo || settings.logoUrl || '/images/logo_smpn50_jakarta_1792047092022.jpg'}
                                  alt="Logo Komisi Pemilihan OSIS"
                                  className="w-8 h-8 object-contain shrink-0"
                                />
                                <div className="text-left leading-tight">
                                  <div className="text-[6.5px] font-black uppercase text-slate-800 tracking-wider">
                                    KOMISI PEMILIHAN OSIS
                                  </div>
                                  <div className="text-[7.5px] font-extrabold uppercase text-slate-950 tracking-tight leading-none">
                                    {settings.schoolName || 'SMP NEGERI 50 JAKARTA'}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-b border-slate-900 py-0.5 mt-1 bg-white">
                                <div className="text-[8px] font-black text-slate-950 uppercase tracking-tight leading-none">
                                  SURAT SUARA RESMI
                                </div>
                                <div className="text-[6px] font-bold text-slate-700 uppercase leading-none mt-0.5">
                                  PEMILIHAN KETUA & WAKIL KETUA OSIS
                                </div>
                                <div className="text-[6px] font-black text-blue-900 uppercase leading-none">
                                  TAHUN {settings.academicYear || '2024/2025'}
                                </div>
                              </div>
                            </div>

                            {/* Kotak Token DPT Pemilih Resmi */}
                            <div className="border-2 border-slate-950 rounded bg-white p-1 text-center my-0.5 shadow-2xs">
                              <div className="text-[6px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                KODE TOKEN PEMILIH
                              </div>
                              <div className="font-mono text-[13px] font-black tracking-widest text-slate-950 leading-tight my-0.5">
                                {t.token}
                              </div>
                              <div className="text-[7.5px] font-bold text-slate-800 leading-none truncate">
                                {t.classGroup} • DPT #{String(ballotNumber).padStart(3, '0')}
                              </div>
                            </div>

                            {/* Pengesahan Tanda Tangan & Cap Panitia */}
                            <div className="border border-slate-300 rounded bg-white p-1 text-center space-y-0.5 leading-none">
                              <div className="text-[5.5px] font-bold text-slate-600 uppercase tracking-wider">
                                TANDA TANGAN & CAP PANITIA
                              </div>
                              <div className="h-4 border-b border-dotted border-slate-500 mx-2"></div>
                              <div className="text-[5.5px] italic text-slate-500">
                                ( Panitia Pemilihan OSIS )
                              </div>
                            </div>

                            {/* Petunjuk Garis Lipatan */}
                            <div className="text-[5.5px] font-bold text-slate-500 uppercase tracking-tighter text-center bg-slate-200/70 rounded py-0.5 leading-none">
                              [ COVER DEPAN SAAT DILIPAT ]
                            </div>
                          </div>

                          {/* -----------------------------------------------------------
                              2. SISI KANAN: AREA PASLON 01 & 02 DENGAN FOTO BESAR & JELAS
                              (Foto Pasangan Calon Lengkap, Tajam, Proporsional)
                              ----------------------------------------------------------- */}
                          <div className="w-[70%] min-w-[70%] max-w-[70%] flex flex-col justify-between h-full min-h-0 pl-0.5">
                            {/* Area Grid 2 Paslon */}
                            <div className="grid grid-cols-2 gap-2 flex-1 items-stretch min-h-0">
                              {displayCandidates.map((cand) => {
                                // Guaranteed Candidate Photo (NEVER allows fallback to the school logo!)
                                const candidatePhotoSrc =
                                  base64Candidates[cand.id] || resolveCandidateImage(cand);

                                return (
                                  <div
                                    key={cand.id}
                                    className="border-2 border-slate-950 rounded p-1 flex flex-col justify-between bg-white overflow-hidden shadow-2xs"
                                  >
                                    {/* Header Nomor Urut KPU */}
                                    <div className="border-b-1.5 border-slate-950 pb-0.5 flex items-center justify-between bg-slate-100 px-2 -mx-1 -mt-1 rounded-t">
                                      <span className="text-[7.5px] font-black tracking-wider text-slate-700 uppercase">
                                        NOMOR URUT
                                      </span>
                                      <div className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-[12px] shadow-xs">
                                        {cand.number}
                                      </div>
                                    </div>

                                    {/* FOTO PASLON DIBUAT BESAR & JELAS (Tinggi ~48mm) */}
                                    <div className="flex-1 flex items-center justify-center my-0.5 min-h-0 overflow-hidden">
                                      <div
                                        className="w-full h-full rounded border border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs"
                                        style={{
                                          height: '48mm',
                                          maxHeight: '48mm'
                                        }}
                                      >
                                        <img
                                          src={candidatePhotoSrc}
                                          alt={`Foto Paslon No. ${cand.number}`}
                                          className="w-full h-full object-contain object-top"
                                          onError={(e) => {
                                            // Fallback immediately to the candidate's real photo, NEVER the logo!
                                            (e.currentTarget as HTMLImageElement).src =
                                              cand.number === '02' || cand.id === 2
                                                ? '/images/paslon_2_smp50_1792047092389.jpg'
                                                : '/images/paslon_1_smp50_1792047092011.jpg';
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Kotak Nama Paslon Resmi (Calon Ketua & Calon Wakil Ketua) */}
                                    <div className="border border-slate-300 rounded bg-slate-50 p-1 text-center leading-tight space-y-0.5 shrink-0">
                                      <div className="text-[8px] font-black text-slate-950 truncate uppercase leading-tight">
                                        <span className="text-[6px] text-slate-600 font-semibold block leading-none">
                                          CALON KETUA:
                                        </span>
                                        {cand.chairman.name}
                                      </div>
                                      <div className="text-[8px] font-black text-slate-950 truncate uppercase border-t border-slate-200 pt-0.5 leading-tight">
                                        <span className="text-[6px] text-slate-600 font-semibold block leading-none">
                                          CALON WAKIL KETUA:
                                        </span>
                                        {cand.viceChairman.name}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Baris Status Pengesahan di Bawah Kolom Paslon */}
                            <div className="mt-0.5 pt-0.5 border-t border-slate-950 flex items-center justify-between text-[6.5px] font-bold text-slate-800 leading-none">
                              <span className="uppercase tracking-tight text-slate-700">
                                SURAT SUARA SAH APABILA DITANDATANGANI & DICAP PANITIA
                              </span>
                              <span className="font-mono text-[6px] text-slate-500">
                                PILKETOS-{settings.academicYear?.replace('/', '-') || '2024-2025'}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* -------------------------------------------------------------
                            3. GARIS POTONG GUNTING ANTAR SURAT SUARA (BATAS LEMBAR)
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
            FOOTER CONTROLS (Ringkas & Efisien)
            ========================================================================= */}
        <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Format Kertas:</span>
            <span>A4 Standar (210 × 297 mm) terbagi rata menjadi 3 surat suara formal siap cetak.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Tutup
            </button>

            {/* UNDUH LEMBAR INI DI FOOTER */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={() => handleDownloadPdf(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50 text-xs"
              title="Unduh 1 lembar A4 aktif (~1 detik)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Lembar Ini (1 Lembar)</span>
            </button>

            {/* UNDUH SEMUA LEMBAR PDF DI FOOTER */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={() => handleDownloadPdf(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50 text-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>
                    {pdfProgress
                      ? `Menyiapkan (${pdfProgress.current}/${pdfProgress.total} - ${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%)...`
                      : 'Memproses PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Unduh Semua Lembar ({pages.length} Lembar)</span>
                </>
              )}
            </button>

            {/* TOMBOL CETAK LANGSUNG (PRINT) DI FOOTER */}
            <button
              type="button"
              disabled={isGeneratingPdf || pages.length === 0}
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
