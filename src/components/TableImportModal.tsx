import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { VoterToken, VoterCategory } from '../types/election';
import { generateUniqueToken } from '../utils/tokenGenerator';
import {
  FileSpreadsheet,
  X,
  Copy,
  Upload,
  Download,
  Plus,
  Trash2,
  RotateCw,
  Table,
  Check,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

export interface TableImportRow {
  id: string;
  name: string;
  classGroup: string;
  category: VoterCategory;
  token: string;
}

interface TableImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrefix: string;
  onSaveVoters: (newVoters: VoterToken[], replaceAll?: boolean) => void;
  existingTokens: VoterToken[];
  onDownloadTemplate?: () => void;
}

export const TableImportModal: React.FC<TableImportModalProps> = ({
  isOpen,
  onClose,
  defaultPrefix,
  onSaveVoters,
  existingTokens
}) => {
  const [tableTokenPrefix, setTableTokenPrefix] = useState<string>(
    defaultPrefix && !defaultPrefix.includes('SMP50') ? defaultPrefix : 'S'
  );
  const [tableRows, setTableRows] = useState<TableImportRow[]>([]);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteBoxText, setPasteBoxText] = useState('');
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncMode, setSyncMode] = useState<'replace' | 'merge'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper: Token Generator for a Row (Format 5 digit 100% collision-free tanpa minus, misal: S7A01)
  const makeToken = (classGroup: string, prefixVal?: string, indexNum?: number, customSet?: Set<string>): string => {
    const usedSet = customSet || new Set([...existingTokens.map((t) => t.token), ...tableRows.map((r) => r.token)]);
    return generateUniqueToken(
      classGroup,
      'Siswa',
      usedSet,
      prefixVal || tableTokenPrefix || defaultPrefix || 'S',
      indexNum
    );
  };

  // Helper to parse category
  const parseCategory = (rawCat: string, classGroup: string): VoterCategory => {
    const cat = (rawCat || '').toLowerCase();
    const grp = (classGroup || '').toUpperCase();
    if (cat.includes('guru') || grp.includes('GURU')) {
      return 'Guru';
    } else if (cat.includes('tata usaha') || cat.includes('tu') || grp.includes('TU')) {
      return 'Tata Usaha';
    } else if (cat.includes('tendik') || cat.includes('kependidikan') || cat.includes('staf') || grp.includes('TENDIK')) {
      return 'Tendik';
    }
    return 'Siswa';
  };

  // 1. Download TRUE Microsoft Excel (.xlsx) Template with separate columns
  const handleDownloadExcelTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ['Nama Lengkap', 'Kelas/Unit', 'Jenis DPT'],
        ['Ahmad Fauzan Pratama', '7A', 'Siswa'],
        ['Bunga Lestari Putri', '7B', 'Siswa'],
        ['Cahya Adiguna', '8A', 'Siswa'],
        ['Dewi Anggraeni', '8C', 'Siswa'],
        ['Eko Wahyudi', '9A', 'Siswa'],
        ['Fitri Handayani', '9B', 'Siswa'],
        ['Drs. Bambang Wijaya M.Pd', 'GURU', 'Guru'],
        ['Siti Nurhaliza S.Pd', 'GURU', 'Guru'],
        ['Rahmat Hidayat S.E', 'TU', 'Tata Usaha'],
        ['Joko Susilo', 'TENDIK', 'Tendik']
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 32 }, // Kolom A: Nama Lengkap
        { wch: 16 }, // Kolom B: Kelas/Unit
        { wch: 16 }  // Kolom C: Jenis DPT
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Template_DPT');
      XLSX.writeFile(wb, 'Template_DPT_SMPN50.xlsx');

      setUploadFeedback({
        type: 'success',
        text: '✓ File Template_DPT_SMPN50.xlsx berhasil diunduh! Kolom A (Nama Lengkap), B (Kelas/Unit), dan C (Jenis DPT) sudah terpisah rapi di Excel.'
      });
      setTimeout(() => setUploadFeedback(null), 6000);
    } catch (err) {
      console.error(err);
      setUploadFeedback({
        type: 'error',
        text: 'Gagal mengunduh file Excel. Silakan gunakan template CSV.'
      });
    }
  };

  // 2. Download Excel-Friendly CSV Template (Comma or Semicolon format)
  const handleDownloadCsvTemplate = (delimiter: ';' | ',' = ',') => {
    const rows = [
      ['Nama Lengkap', 'Kelas/Unit', 'Jenis DPT'],
      ['Ahmad Fauzan Pratama', '7A', 'Siswa'],
      ['Bunga Lestari Putri', '7B', 'Siswa'],
      ['Cahya Adiguna', '8A', 'Siswa'],
      ['Dewi Anggraeni', '8C', 'Siswa'],
      ['Eko Wahyudi', '9A', 'Siswa'],
      ['Fitri Handayani', '9B', 'Siswa'],
      ['Drs. Bambang Wijaya M.Pd', 'GURU', 'Guru'],
      ['Siti Nurhaliza S.Pd', 'GURU', 'Guru'],
      ['Rahmat Hidayat S.E', 'TU', 'Tata Usaha'],
      ['Joko Susilo', 'TENDIK', 'Tendik']
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((cell) =>
              cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(delimiter)
        )
        .join('\r\n') +
      '\r\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_DPT_SMPN50_${delimiter === ';' ? 'TitikKoma' : 'Koma'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setUploadFeedback({
      type: 'success',
      text: `✓ File Template CSV (${delimiter === ';' ? 'Pemisah Titik Koma ;' : 'Pemisah Koma ,'}) berhasil diunduh. Kolom: Nama Lengkap | Kelas/Unit | Jenis DPT.`
    });
    setTimeout(() => setUploadFeedback(null), 5000);
  };

  // Convert raw text (CSV, TSV, Semicolon) into Table rows with proper quote and delimiter handling
  const parseRawTextToRows = (raw: string, currentPrefix?: string): TableImportRow[] => {
    const rawLines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return [];

    // Filter out "sep=;" or "sep=," if present
    const lines = rawLines.filter((l) => !l.toLowerCase().startsWith('sep='));
    if (lines.length === 0) return [];

    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('nama') ||
      firstLineLower.includes('lengkap') ||
      firstLineLower.includes('siswa') ||
      firstLineLower.includes('kelas') ||
      firstLineLower.includes('unit') ||
      firstLineLower.includes('jenis') ||
      firstLineLower.includes('dpt') ||
      firstLineLower.includes('token');

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const generated: TableImportRow[] = [];

    // CRITICAL: Declare usedSet and classCounters OUTSIDE the loop so each row accumulates unique tokens!
    const usedSet = new Set<string>();
    existingTokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    tableRows.forEach((r) => r.token && usedSet.add(r.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};

    dataLines.forEach((line, idx) => {
      // Determine delimiter for this line: Tab > Semicolon > Comma
      let delimiter = ',';
      if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(';')) {
        delimiter = ';';
      }

      // Quote-aware CSV parser
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      const cleanParts = parts.map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (cleanParts.length === 0 || !cleanParts[0]) return;

      const name = cleanParts[0];
      const classGroup = (cleanParts[1] || '7A').toUpperCase();
      const rawCategory = cleanParts[2] || '';
      const customToken = cleanParts[3] ? cleanParts[3].toUpperCase() : '';

      const category = parseCategory(rawCategory, classGroup);
      classCounters[classGroup] = (classCounters[classGroup] || 0) + 1;

      let token = customToken;
      if (!token || usedSet.has(token)) {
        token = generateUniqueToken(
          classGroup,
          category,
          usedSet,
          currentPrefix || tableTokenPrefix || defaultPrefix || 'S',
          classCounters[classGroup]
        );
      }
      usedSet.add(token.toUpperCase());

      generated.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        classGroup,
        category,
        token: token.toUpperCase()
      });
    });

    return generated;
  };

  // Handle File Upload: supports .xlsx, .xls, .csv, .tsv, .txt
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const data = new Uint8Array(buffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
          });

          if (jsonRows.length === 0) {
            setUploadFeedback({ type: 'error', text: 'File Excel yang diunggah tidak memiliki data.' });
            return;
          }

          // Check if row 0 is header
          const firstRowStr = jsonRows[0].map((c) => String(c).toLowerCase()).join(' ');
          const hasHeader =
            firstRowStr.includes('nama') ||
            firstRowStr.includes('siswa') ||
            firstRowStr.includes('kelas') ||
            firstRowStr.includes('jenis') ||
            firstRowStr.includes('dpt');

          const dataRows = hasHeader ? jsonRows.slice(1) : jsonRows;
          const generated: TableImportRow[] = [];
          const usedSet = new Set<string>();
          existingTokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
          tableRows.forEach((r) => r.token && usedSet.add(r.token.trim().toUpperCase()));
          const classCounters: Record<string, number> = {};

          dataRows.forEach((row, idx) => {
            const name = String(row[0] || '').trim();
            if (!name) return; // ignore blank rows
            const classGroup = String(row[1] || '7A').trim().toUpperCase() || '7A';
            const rawCategory = String(row[2] || '').trim();
            const customToken = row[3] ? String(row[3]).trim().toUpperCase() : '';

            const category = parseCategory(rawCategory, classGroup);
            classCounters[classGroup] = (classCounters[classGroup] || 0) + 1;

            let token = customToken;
            if (!token || usedSet.has(token)) {
              token = generateUniqueToken(
                classGroup,
                category,
                usedSet,
                tableTokenPrefix || defaultPrefix || 'S',
                classCounters[classGroup]
              );
            }
            usedSet.add(token.toUpperCase());

            generated.push({
              id: `row-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              name,
              classGroup,
              category,
              token: token.toUpperCase()
            });
          });

          if (generated.length > 0) {
            setTableRows((prev) => [...prev, ...generated]);
            setUploadFeedback({
              type: 'success',
              text: `✓ Sukses! Berhasil membaca ${generated.length} data pemilih dari file Excel "${file.name}". Kolom terdeteksi rapi dan token unik otomatis digenerate.`
            });
            setTimeout(() => setUploadFeedback(null), 5000);
          } else {
            setUploadFeedback({
              type: 'error',
              text: 'Tidak ditemukan baris pemilih yang valid pada file Excel tersebut. Pastikan kolom terisi: Nama Lengkap | Kelas/Unit | Jenis DPT.'
            });
          }
        } catch (err) {
          console.error(err);
          setUploadFeedback({
            type: 'error',
            text: 'Gagal memproses file Excel. Pastikan format file .xlsx valid.'
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV, TSV, or TXT
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const rows = parseRawTextToRows(content, tableTokenPrefix);
          if (rows.length > 0) {
            setTableRows((prev) => [...prev, ...rows]);
            setUploadFeedback({
              type: 'success',
              text: `✓ Sukses! Berhasil memuat ${rows.length} data pemilih dari file "${file.name}".`
            });
            setTimeout(() => setUploadFeedback(null), 5000);
          } else {
            setUploadFeedback({
              type: 'error',
              text: 'Tidak ditemukan baris pemilih yang valid dari file CSV tersebut.'
            });
          }
        }
      };
      reader.readAsText(file);
    }

    e.target.value = '';
  };

  // Process Pasted Text from Excel (Tabs, Semicolons, Commas)
  const handleProcessPastedExcel = () => {
    if (!pasteBoxText.trim()) return;
    const rows = parseRawTextToRows(pasteBoxText, tableTokenPrefix);
    if (rows.length > 0) {
      setTableRows((prev) => [...prev, ...rows]);
      setPasteBoxText('');
      setShowPasteBox(false);
      setUploadFeedback({
        type: 'success',
        text: `✓ Berhasil menambahkan ${rows.length} baris dari hasil salin-tempel Excel.`
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } else {
      setUploadFeedback({
        type: 'error',
        text: 'Format kolom tidak sesuai. Salin 3 kolom: Nama Lengkap | Kelas/Unit | Jenis DPT'
      });
    }
  };

  // 1-Click Load Realistic Sample Columns (Format 5 digit tanpa tanda hubung "-", misal S7A01)
  const handleLoadSampleColumns = () => {
    const sampleRows: TableImportRow[] = [
      { id: 'sample-1', name: 'Ahmad Fauzan Pratama', classGroup: '7A', category: 'Siswa', token: makeToken('7A', tableTokenPrefix, 1) },
      { id: 'sample-2', name: 'Bunga Lestari Putri', classGroup: '7B', category: 'Siswa', token: makeToken('7B', tableTokenPrefix, 2) },
      { id: 'sample-3', name: 'Cahya Adiguna', classGroup: '8A', category: 'Siswa', token: makeToken('8A', tableTokenPrefix, 3) },
      { id: 'sample-4', name: 'Dewi Anggraeni', classGroup: '8C', category: 'Siswa', token: makeToken('8C', tableTokenPrefix, 4) },
      { id: 'sample-5', name: 'Eko Wahyudi', classGroup: '9A', category: 'Siswa', token: makeToken('9A', tableTokenPrefix, 5) },
      { id: 'sample-6', name: 'Fitri Handayani', classGroup: '9B', category: 'Siswa', token: makeToken('9B', tableTokenPrefix, 6) },
      { id: 'sample-7', name: 'Drs. Bambang Wijaya M.Pd', classGroup: 'GURU', category: 'Guru', token: makeToken('GURU', 'G', 1) },
      { id: 'sample-8', name: 'Siti Nurhaliza S.Pd', classGroup: 'GURU', category: 'Guru', token: makeToken('GURU', 'G', 2) },
      { id: 'sample-9', name: 'Rahmat Hidayat S.E', classGroup: 'TU', category: 'Tata Usaha', token: makeToken('TU', 'T', 1) },
      { id: 'sample-10', name: 'Joko Susilo', classGroup: 'TENDIK', category: 'Tendik', token: makeToken('TENDIK', 'K', 1) }
    ];
    setTableRows(sampleRows);
    setUploadFeedback({
      type: 'success',
      text: '✓ Dimuat 10 contoh baris data pemilih (Siswa, Guru, TU, Tendik) lengkap dengan token unik.'
    });
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // Add Blank Row
  const handleAddBlankRow = () => {
    const newRow: TableImportRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      classGroup: '7A',
      category: 'Siswa',
      token: makeToken('7A', tableTokenPrefix)
    };
    setTableRows((prev) => [...prev, newRow]);
  };

  // Add 5 Blank Rows
  const handleAdd5BlankRows = () => {
    const usedSet = new Set<string>();
    existingTokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    tableRows.forEach((r) => r.token && usedSet.add(r.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};

    const rows: TableImportRow[] = Array.from({ length: 5 }, (_, i) => {
      classCounters['7A'] = (classCounters['7A'] || 0) + 1;
      const newToken = generateUniqueToken('7A', 'Siswa', usedSet, tableTokenPrefix || defaultPrefix || 'S', classCounters['7A']);
      usedSet.add(newToken.toUpperCase());
      return {
        id: `row-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        classGroup: '7A',
        category: 'Siswa',
        token: newToken
      };
    });
    setTableRows((prev) => [...prev, ...rows]);
  };

  // Regenerate all tokens
  const handleRegenerateAllTokens = () => {
    if (tableRows.length === 0) return;
    const usedSet = new Set<string>();
    existingTokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};
    setTableRows((prev) =>
      prev.map((r) => {
        classCounters[r.classGroup] = (classCounters[r.classGroup] || 0) + 1;
        const newToken = generateUniqueToken(
          r.classGroup,
          r.category,
          usedSet,
          tableTokenPrefix || defaultPrefix || 'S',
          classCounters[r.classGroup]
        );
        usedSet.add(newToken.toUpperCase());
        return {
          ...r,
          token: newToken
        };
      })
    );
    setUploadFeedback({
      type: 'info',
      text: `✓ Seluruh token berhasil digenerate ulang dan dipastikan 100% unik tanpa duplikat.`
    });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Calculate summary counts & duplicate check
  let countSiswa = 0;
  let countGuru = 0;
  let countTU = 0;
  let countTendik = 0;

  const tokenCounts = new Map<string, number>();
  tableRows.forEach((r) => {
    if (r.category === 'Guru') countGuru++;
    else if (r.category === 'Tata Usaha') countTU++;
    else if (r.category === 'Tendik') countTendik++;
    else countSiswa++;

    const upperTok = r.token.trim().toUpperCase();
    if (upperTok) {
      tokenCounts.set(upperTok, (tokenCounts.get(upperTok) || 0) + 1);
    }
  });

  const duplicateTokens = Array.from(tokenCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([tok]) => tok);

  // Check conflicts with existing tokens
  const existingTokensSet = new Set(existingTokens.map((t) => t.token.toUpperCase()));
  const conflictsWithDpt = tableRows
    .map((r) => r.token.trim().toUpperCase())
    .filter((tok) => tok && existingTokensSet.has(tok));

  // Save & Sync to DPT
  const handleSave = () => {
    if (tableRows.length === 0) {
      setUploadFeedback({ type: 'error', text: 'Tabel masih kosong. Unggah file Excel/CSV atau isi data pemilih.' });
      return;
    }

    const emptyNameIdx = tableRows.findIndex((r) => !r.name.trim());
    if (emptyNameIdx !== -1) {
      setUploadFeedback({ type: 'error', text: `Baris #${emptyNameIdx + 1} belum memiliki Nama Lengkap.` });
      return;
    }

    if (duplicateTokens.length > 0) {
      setUploadFeedback({
        type: 'error',
        text: `Terdapat token duplikat (${duplicateTokens.slice(0, 3).join(', ')}). Klik "Generate Token Semua" agar unik.`
      });
      return;
    }

    const newVoters: VoterToken[] = tableRows.map((r) => ({
      token: (r.token.trim() || makeToken(r.classGroup, tableTokenPrefix)).toUpperCase(),
      voterName: r.name.trim(),
      classGroup: (r.classGroup || '7A').trim().toUpperCase(),
      category: r.category,
      isUsed: false
    }));

    onSaveVoters(newVoters, syncMode === 'replace');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-4 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Format Kolom Tabel DPT & Upload Excel / CSV
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Otomatis Sinkron
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur 3 Kolom: <b>Nama Lengkap</b> | <b>Kelas/Unit</b> | <b>Jenis DPT</b>. Token di-generate otomatis oleh sistem & dapat di-custom.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMAT REFERENCE CARD (TAMPILAN STRUKTUR KOLOM SESUAI REQUEST) */}
        {showFormatGuide && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-xl p-3.5 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Format Kolom Excel & CSV (Kolom A, B, C Terpisah Sesuai Standar):</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFormatGuide(false)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                Sembunyikan Panduan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-lg border border-blue-200 shadow-2xs">
                <thead className="bg-blue-100/80 text-blue-950 font-bold border-b border-blue-200">
                  <tr>
                    <th className="py-2 px-3 border-r border-blue-200">Kolom A: Nama Lengkap</th>
                    <th className="py-2 px-3 border-r border-blue-200">Kolom B: Kelas/Unit</th>
                    <th className="py-2 px-3 border-r border-blue-200">Kolom C: Jenis DPT</th>
                    <th className="py-2 px-3 bg-purple-50 text-purple-900">Kolom D (Sistem): Token Pemilih (5 Digit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-sans">
                  <tr>
                    <td className="py-1.5 px-3 text-slate-900 font-semibold border-r border-slate-100">Ahmad Fauzan Pratama</td>
                    <td className="py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">7A</td>
                    <td className="py-1.5 px-3 text-blue-700 font-medium border-r border-slate-100">Siswa</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-purple-700 bg-purple-50/40">S7A01 (Otomatis 5 Digit)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-slate-900 font-semibold border-r border-slate-100">Bunga Lestari Putri</td>
                    <td className="py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">7B</td>
                    <td className="py-1.5 px-3 text-blue-700 font-medium border-r border-slate-100">Siswa</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-purple-700 bg-purple-50/40">S7B02 (Otomatis 5 Digit)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-slate-900 font-semibold border-r border-slate-100">Drs. Bambang Wijaya M.Pd</td>
                    <td className="py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">GURU</td>
                    <td className="py-1.5 px-3 text-emerald-700 font-medium border-r border-slate-100">Guru</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-purple-700 bg-purple-50/40">G5001 (Otomatis 5 Digit)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Klik tombol hijau <b>Unduh Template Excel (.xlsx)</b> di bawah untuk membuka langsung di Microsoft Excel dengan kolom A, B, dan C yang sudah terpisah sempurna tanpa perlu convert teks ke kolom.
              </span>
            </p>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {uploadFeedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in fade-in duration-150 ${
              uploadFeedback.type === 'success'
                ? 'bg-emerald-800 text-white'
                : uploadFeedback.type === 'error'
                ? 'bg-rose-800 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span>{uploadFeedback.text}</span>
            </div>
            <button
              onClick={() => setUploadFeedback(null)}
              className="text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              className="hidden"
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Excel / CSV</span>
            </button>

            {/* Download TRUE Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors shadow-2xs"
              title="Unduh file Microsoft Excel resmi (.xlsx) dengan Kolom A, B, C terpisah"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>

            {/* Download CSV (.csv) */}
            <button
              type="button"
              onClick={() => handleDownloadCsvTemplate(',')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              title="Unduh file format CSV (Pemisah Koma ,)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh CSV</span>
            </button>

            {/* Paste Box Toggle */}
            <button
              type="button"
              onClick={() => setShowPasteBox(!showPasteBox)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showPasteBox
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showPasteBox ? 'Tutup Tempel' : 'Tempel dari Excel'}</span>
            </button>

            {/* Sample Button */}
            <button
              type="button"
              onClick={handleLoadSampleColumns}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Muat Contoh Kolom</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

            {/* Add Row Buttons */}
            <button
              type="button"
              onClick={handleAddBlankRow}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+1 Baris</span>
            </button>

            <button
              type="button"
              onClick={handleAdd5BlankRows}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+5 Baris</span>
            </button>

            {/* Clear table */}
            {tableRows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTableRows([]);
                  setUploadFeedback({ type: 'info', text: 'Tabel dikosongkan.' });
                  setTimeout(() => setUploadFeedback(null), 2500);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Tabel</span>
              </button>
            )}
          </div>

          {/* Token Generator Prefix Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Awalan Token:</span>
            <input
              type="text"
              value={tableTokenPrefix}
              onChange={(e) => setTableTokenPrefix(e.target.value.toUpperCase())}
              placeholder="S"
              className="w-24 px-2 py-1 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 bg-white"
            />
            <button
              type="button"
              onClick={handleRegenerateAllTokens}
              title="Generate ulang token unik untuk semua baris menggunakan awalan di samping"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Generate Token Semua</span>
            </button>
          </div>
        </div>

        {/* PASTE BOX AREA */}
        {showPasteBox && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">
                Tempel Kolom dari Excel / Google Spreadsheet:
              </span>
              <span className="text-[11px] text-blue-700 font-medium">
                Format: <b>Nama Lengkap [TAB] Kelas/Unit [TAB] Jenis DPT</b>
              </span>
            </div>
            <textarea
              rows={4}
              value={pasteBoxText}
              onChange={(e) => setPasteBoxText(e.target.value)}
              placeholder="Blok kolom Nama, Kelas, Jenis di Excel lalu tekan Ctrl+C, kemudian Ctrl+V di sini:&#10;Ahmad Fauzan Pratama	7A	Siswa&#10;Bunga Lestari Putri	7B	Siswa&#10;Drs. Bambang Wijaya	GURU	Guru"
              className="w-full p-2.5 text-xs font-mono border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteBox(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white border text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleProcessPastedExcel}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
              >
                Masukkan ke Kolom Tabel
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE TABLE SPREADSHEET */}
        <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-y-auto min-h-[220px]">
          {tableRows.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Table className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Tabel Kolom DPT Masih Kosong
              </h4>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Silakan klik tombol <b>Unduh Template Excel (.xlsx)</b> untuk membuka format kolom di Excel, lalu isi data siswa dan klik <b>Unggah File Excel</b>. Atau klik <b>Muat Contoh Kolom</b> untuk uji coba langsung.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah File Excel/CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleColumns}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Muat Contoh Kolom</span>
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Kolom A: Nama Lengkap</th>
                  <th className="py-2.5 px-3 w-32">Kolom B: Kelas/Unit</th>
                  <th className="py-2.5 px-3 w-36">Kolom C: Jenis DPT</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Kolom D: Token (Otomatis Dihasilkan)</th>
                  <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {tableRows.map((row, idx) => {
                  const isDupe = duplicateTokens.includes(row.token.trim().toUpperCase());
                  return (
                    <tr key={row.id} className="hover:bg-blue-50/40">
                      <td className="py-2 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTableRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, name: val } : r))
                            );
                          }}
                          placeholder="Nama lengkap siswa/pemilih..."
                          className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.classGroup}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setTableRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, classGroup: val } : r))
                            );
                          }}
                          placeholder="7A / 8B / GURU"
                          className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg uppercase focus:border-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <select
                          value={row.category}
                          onChange={(e) => {
                            const val = e.target.value as VoterCategory;
                            setTableRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, category: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none font-medium"
                        >
                          <option value="Siswa">Siswa</option>
                          <option value="Guru">Guru</option>
                          <option value="Tata Usaha">Tata Usaha</option>
                          <option value="Tendik">Tendik</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={row.token}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setTableRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, token: val } : r))
                              );
                            }}
                            placeholder="Token unik..."
                            className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border focus:outline-none ${
                              isDupe
                                ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-400'
                                : 'bg-purple-50/50 border-purple-200 text-purple-900 focus:bg-white focus:border-blue-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newToken = makeToken(row.classGroup, tableTokenPrefix);
                              setTableRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, token: newToken } : r))
                              );
                            }}
                            title="Acak token baris ini"
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-purple-600 rounded-md shrink-0 border border-slate-200"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setTableRows((prev) => prev.filter((r) => r.id !== row.id))
                          }
                          title="Hapus baris ini"
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Duplicate or Conflict Warnings */}
        {duplicateTokens.length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Peringatan: Terdapat {duplicateTokens.length} token duplikat dalam tabel ({duplicateTokens.slice(0, 3).join(', ')}). Silakan klik 'Generate Token Semua' untuk membuat token baru yang unik.
            </span>
          </div>
        )}

        {conflictsWithDpt.length > 0 && syncMode === 'merge' && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Perhatian: {conflictsWithDpt.length} token sudah ada di DPT sebelumnya. Menyimpan data ini akan menimpa token pemilih yang sama.
            </span>
          </div>
        )}

        {/* BOTTOM ACTION & SUMMARY BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              Total: {tableRows.length} Pemilih
            </span>
            <span className="text-slate-300">|</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
              Siswa: {countSiswa}
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
              Guru: {countGuru}
            </span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
              Tata Usaha: {countTU}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
              Tendik: {countTendik}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Sync Mode Selector */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 pl-1.5">Mode Sinkron:</label>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value as 'replace' | 'merge')}
                className="bg-white text-xs font-semibold rounded px-2 py-1 border border-slate-300 text-slate-800"
              >
                <option value="replace">Ganti Seluruh DPT (Rekomendasi)</option>
                <option value="merge">Gabungkan ke DPT Lama</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={tableRows.length === 0 || duplicateTokens.length > 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>
                Simpan & Sinkronkan ke DPT {tableRows.length > 0 ? `(${tableRows.length} Pemilih)` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
