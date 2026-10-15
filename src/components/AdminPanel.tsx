import React, { useState, useRef } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair, VoterToken, VoterCategory } from '../types/election';
import { PrintTokenModal } from './PrintTokenModal';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Play,
  Pause,
  Plus,
  Copy,
  Printer,
  Download,
  Check,
  Search,
  Filter,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Users,
  School,
  Database,
  Trash2,
  Edit2,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  RotateCcw
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    candidates,
    tokens,
    votes,
    auditLogs,
    supabaseConnected,
    toggleElectionStatus,
    updateCandidate,
    addCandidate,
    deleteCandidate,
    addVoter,
    updateVoter,
    deleteVoter,
    bulkDeleteVoters,
    importVoters,
    generateBatchTokens,
    simulateVotes,
    resetAllElectionData,
    resetToDefaultSampleData,
    resetVotersList,
    resetTokensVoteStatus,
    updateSettings,
    validateAdminPassword,
    updateAdminPassword,
    connectSupabase,
    disconnectSupabase
  } = useElection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Tabs
  const [adminTab, setAdminTab] = useState<'paslon' | 'voters' | 'school' | 'control' | 'supabase'>('paslon');

  // Candidate editor state
  const [editingCandidateId, setEditingCandidateId] = useState<number>(candidates[0]?.id || 1);
  const activeEditingCandidate = candidates.find((c) => c.id === editingCandidateId) || candidates[0];
  const [candidateForm, setCandidateForm] = useState<CandidatePair | null>(null);
  const [candidateSaveMsg, setCandidateSaveMsg] = useState<string | null>(null);

  // Add new candidate modal state
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandNumber, setNewCandNumber] = useState('');
  const [newCandChairmanName, setNewCandChairmanName] = useState('');
  const [newCandChairmanClass, setNewCandChairmanClass] = useState('');
  const [newCandViceName, setNewCandViceName] = useState('');
  const [newCandViceClass, setNewCandViceClass] = useState('');
  const [newCandTagline, setNewCandTagline] = useState('');
  const [newCandVision, setNewCandVision] = useState('');
  const [newCandMissions, setNewCandMissions] = useState<string[]>(['']);
  const [newCandPrograms, setNewCandPrograms] = useState<{ title: string; desc: string }[]>([
    { title: 'Program Kerja Unggulan 1', desc: 'Rencana program kerja pertama untuk memajukan OSIS.' }
  ]);
  const [newCandColor, setNewCandColor] = useState('#2563eb'); // Blue default
  const [newCandImage, setNewCandImage] = useState('/src/assets/images/paslon_1_smp50_1792047092011.jpg');

  // When changing editing candidate
  React.useEffect(() => {
    if (activeEditingCandidate) {
      setCandidateForm(JSON.parse(JSON.stringify(activeEditingCandidate)));
      setCandidateSaveMsg(null);
    }
  }, [editingCandidateId, candidates]);

  // Voter management state
  const [searchToken, setSearchToken] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedVoterTokens, setSelectedVoterTokens] = useState<string[]>([]);
  const [editingVoter, setEditingVoter] = useState<VoterToken | null>(null);
  const [originalEditingToken, setOriginalEditingToken] = useState<string | null>(null);
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetVotersModal, setShowResetVotersModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Interactive Table-based import state (Excel/Table paste mode)
  interface TableImportRow {
    id: string;
    name: string;
    classGroup: string;
    category: VoterCategory;
    token: string;
  }
  const [tableRows, setTableRows] = useState<TableImportRow[]>([]);
  const [pasteBoxText, setPasteBoxText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [tableTokenPrefix, setTableTokenPrefix] = useState<string>(settings.tokenPrefix || 'SMP50-');

  // New single voter form
  const [newVoterName, setNewVoterName] = useState('');
  const [newVoterClass, setNewVoterClass] = useState('7A');
  const [newVoterCategory, setNewVoterCategory] = useState<VoterCategory>('Siswa');
  const [newVoterToken, setNewVoterToken] = useState('');

  // School identity and full web titles state
  const [schoolForm, setSchoolForm] = useState({
    schoolName: settings.schoolName,
    schoolAddress: settings.schoolAddress,
    academicYear: settings.academicYear,
    electionName: settings.electionName,
    logoUrl: settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg',
    announcementText: settings.announcementText || '',
    quickCountTitle: settings.quickCountTitle || 'Quick Count Perhitungan Suara Pemilihan OSIS',
    quickCountSubtitle: settings.quickCountSubtitle || 'Pantau perolehan suara resmi secara real-time, transparan, dan akurat.',
    votingTitle: settings.votingTitle || 'Masuk dengan Token Pemilihan',
    votingSubtitle: settings.votingSubtitle || 'Gunakan token unik Anda yang telah dibagikan oleh Panitia. Setiap token hanya berlaku satu kali coblos.',
    tokenPrefix: settings.tokenPrefix ?? 'SMP50-',
    tokenLength: settings.tokenLength || 6
  });
  const [schoolSaveMsg, setSchoolSaveMsg] = useState<string | null>(null);

  // Password change state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPasswordChangeFields, setShowPasswordChangeFields] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase connection state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(settings.supabaseAnonKey || '');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  // Modals & Refs
  const [showPrintModal, setShowPrintModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const newCandPhotoRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. PIN / PASSWORD UNLOCK SCREEN (No default hints, eye toggle, secure verification)
  if (!isAuthenticated) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateAdminPassword(pinInput)) {
        setIsAuthenticated(true);
        setPinError(null);
      } else {
        setPinError('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Autentikasi Panitia MPK</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Halaman pengaturan khusus Panitia Pemilihan OSIS & MPK {settings.schoolName}.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="adminPinInput" className="block text-xs font-semibold text-slate-700 mb-1">
                KATA SANDI / PIN PANITIA
              </label>
              <div className="relative">
                <input
                  id="adminPinInput"
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Masukkan kata sandi..."
                  className="w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
            >
              Buka Akses Pengaturan
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNewCandidate = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isNewCandidate) {
          setNewCandImage(reader.result);
        } else if (candidateForm) {
          setCandidateForm({ ...candidateForm, posterImage: reader.result });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSchoolForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Candidate Changes
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm) return;

    updateCandidate(candidateForm);
    setCandidateSaveMsg(`Perubahan Paslon No. ${candidateForm.number} berhasil disimpan!`);
    setTimeout(() => setCandidateSaveMsg(null), 3000);
  };

  // Handle Add New Candidate
  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = candidates.length > 0 ? Math.max(...candidates.map((c) => c.id)) + 1 : 1;
    const assignedNumber = newCandNumber.trim() || String(candidates.length + 1).padStart(2, '0');

    const validMissions = newCandMissions.map((m) => m.trim()).filter(Boolean);
    const validPrograms = newCandPrograms.filter((p) => p.title.trim().length > 0);

    const newCandidatePair: CandidatePair = {
      id: nextId,
      number: assignedNumber,
      chairman: {
        name: newCandChairmanName.trim() || 'Calon Ketua',
        class: newCandChairmanClass.trim() || 'Kelas VIII',
        role: 'Calon Ketua OSIS'
      },
      viceChairman: {
        name: newCandViceName.trim() || 'Calon Wakil Ketua',
        class: newCandViceClass.trim() || 'Kelas VII',
        role: 'Calon Wakil Ketua OSIS'
      },
      tagline: newCandTagline.trim() || 'Maju Bersama OSIS',
      posterImage: newCandImage || '/src/assets/images/paslon_1_smp50_1792047092011.jpg',
      color: {
        primary: newCandColor,
        accent: newCandColor,
        bgSoft: '#f8fafc',
        border: '#cbd5e1',
        text: '#0f172a'
      },
      vision: newCandVision.trim() || 'Mewujudkan OSIS yang aktif, solutif, dan berprestasi.',
      missions: validMissions.length > 0 ? validMissions : ['Membangun solidaritas dan kreativitas siswa SMPN 50.'],
      workPrograms: validPrograms.length > 0 ? validPrograms : [
        {
          title: 'Program Kerja Unggulan 1',
          desc: 'Rencana program kerja pertama untuk memajukan OSIS.'
        }
      ]
    };

    addCandidate(newCandidatePair);
    setEditingCandidateId(nextId);
    setShowAddCandidateModal(false);

    // Reset modal form
    setNewCandNumber('');
    setNewCandChairmanName('');
    setNewCandChairmanClass('');
    setNewCandViceName('');
    setNewCandViceClass('');
    setNewCandTagline('');
    setNewCandVision('');
    setNewCandMissions(['']);
    setNewCandPrograms([
      { title: 'Program Kerja Unggulan 1', desc: 'Rencana program kerja pertama untuk memajukan OSIS.' }
    ]);
  };

  // Handle Delete Candidate
  const handleDeleteCurrentCandidate = () => {
    if (candidates.length <= 1) {
      alert('Minimal harus ada 1 pasangan calon untuk pemilihan OSIS.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus Paslon No. ${activeEditingCandidate?.number} (${activeEditingCandidate?.chairman.name})?`)) {
      deleteCandidate(editingCandidateId);
      const remaining = candidates.filter((c) => c.id !== editingCandidateId);
      if (remaining.length > 0) {
        setEditingCandidateId(remaining[0].id);
      }
    }
  };

  // Handle Save School Settings
  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      schoolName: schoolForm.schoolName,
      schoolAddress: schoolForm.schoolAddress,
      academicYear: schoolForm.academicYear,
      electionName: schoolForm.electionName,
      logoUrl: schoolForm.logoUrl,
      announcementText: schoolForm.announcementText
    });
    setSchoolSaveMsg('Informasi sekolah dan logo berhasil diperbarui!');
    setTimeout(() => setSchoolSaveMsg(null), 3000);
  };

  // Handle Change Admin Password (Reliable, no old password roadblock when already authenticated)
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    const cleanNew = newPasswordInput.trim();
    const cleanConfirm = confirmPasswordInput.trim();

    if (cleanNew.length < 4) {
      setPasswordChangeStatus({ type: 'error', text: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordChangeStatus({ type: 'error', text: 'Konfirmasi kata sandi baru tidak sama. Pastikan kedua kolom identik.' });
      return;
    }

    const res = updateAdminPassword(cleanNew);
    if (res.success) {
      setPasswordChangeStatus({
        type: 'success',
        text: 'Kata sandi baru berhasil disimpan! Silakan gunakan kata sandi ini untuk membuka Panel Panitia berikutnya.'
      });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => setPasswordChangeStatus(null), 6000);
    } else {
      setPasswordChangeStatus({ type: 'error', text: res.message });
    }
  };

  // Filtered Voters
  const filteredTokens = tokens.filter((t) => {
    const matchSearch =
      t.token.toLowerCase().includes(searchToken.toLowerCase()) ||
      t.classGroup.toLowerCase().includes(searchToken.toLowerCase()) ||
      (t.voterName && t.voterName.toLowerCase().includes(searchToken.toLowerCase()));

    const matchStatus =
      statusFilter === 'all' ? true : statusFilter === 'used' ? t.isUsed : !t.isUsed;

    const matchCategory =
      categoryFilter === 'all' ? true : t.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  // Handle Single Add Voter
  const handleAddSingleVoter = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClass = newVoterClass.trim().toUpperCase() || 'UMUM';
    const cleanToken = newVoterToken.trim().toUpperCase() || `SMP50-${cleanClass}-${Math.floor(1000 + Math.random() * 9000)}`;

    addVoter({
      token: cleanToken,
      voterName: newVoterName.trim() || `${newVoterCategory} ${cleanClass}`,
      classGroup: cleanClass,
      category: newVoterCategory,
      isUsed: false
    });

    setNewVoterName('');
    setNewVoterToken('');
    setShowAddVoterModal(false);
  };

  // Download Sample CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Nama Lengkap,Kelas,Jenis Pemilih\n' +
      'Ahmad Fauzan,7A,Siswa\n' +
      'Bunga Lestari,7A,Siswa\n' +
      'Cahya Pratama,8B,Siswa\n' +
      'Dewi Anggraeni,9C,Siswa\n' +
      'Drs. Bambang Wijaya,Guru,Guru\n' +
      'Siti Nurhaliza S.Pd,Guru,Guru\n' +
      'Rahmat Hidayat,TU,Tata Usaha\n' +
      'Joko Susilo,Tendik,Tendik\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_DPT_Pemilihan_SMPN50.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV File Upload Parsing
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
  };

  // Parse and Process CSV / Text
  const handleProcessCsvImport = () => {
    const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const newVoters: VoterToken[] = [];

    // Check if first line is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('nama') ||
      firstLineLower.includes('kelas') ||
      firstLineLower.includes('jenis');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line) => {
      // Split by comma, semicolon, or tab
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || !parts[0]) return;

      const name = parts[0];
      const classGroup = (parts[1] || 'UMUM').toUpperCase();
      let rawCategory = (parts[2] || '').trim();

      // Normalize Category: Siswa, Guru, Tata Usaha, Tendik
      let category: VoterCategory = 'Siswa';
      const catLower = rawCategory.toLowerCase();

      if (catLower.includes('guru')) {
        category = 'Guru';
      } else if (catLower.includes('tata usaha') || catLower.includes('tu')) {
        category = 'Tata Usaha';
      } else if (catLower.includes('tendik') || catLower.includes('kependidikan') || catLower.includes('staf')) {
        category = 'Tendik';
      } else {
        category = 'Siswa';
      }

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const cleanClassTag = classGroup.replace(/[^A-Z0-9]/g, '');
      const token = `SMP50-${cleanClassTag || 'VOTE'}-${randomCode}`;

      newVoters.push({
        token,
        voterName: name,
        classGroup,
        category,
        isUsed: false
      });
    });

    if (newVoters.length > 0) {
      importVoters(newVoters);
      setImportText('');
      setShowImportModal(false);
      alert(`Berhasil mengimpor ${newVoters.length} pemilih ke dalam DPT.`);
    } else {
      alert('Tidak ditemukan data pemilih yang valid untuk diimpor. Periksa format CSV Anda.');
    }
  };

  // Copy Unused Tokens
  const handleCopyUnusedTokens = () => {
    const unusedList = tokens.filter((t) => !t.isUsed).map((t) => `${t.token} (${t.voterName || t.classGroup})`).join('\n');
    navigator.clipboard.writeText(unusedList);
    alert('Berhasil menyalin seluruh token belum dipakai ke papan klip!');
  };

  // Download SQL Schema
  const handleDownloadSqlSchema = () => {
    const link = document.createElement('a');
    link.href = '/supabase_schema.sql';
    link.download = 'supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Votes CSV
  const handleDownloadCsv = () => {
    const headers = 'ID,Kandidat Pilihan,Kategori,Kelas,Waktu Coblos\n';
    const rows = votes
      .map(
        (v) =>
          `"${v.id}","Paslon 0${v.candidateId}","${v.voterCategory}","${v.classGroup}","${new Date(v.timestamp).toLocaleString('id-ID')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Berita_Acara_Pemilihan_OSIS_SMPN50_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl my-6 space-y-6 max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Panel Pengaturan Panitia MPK & OSIS
                </h2>
                {supabaseConnected ? (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Supabase Terhubung
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Penyimpanan Lokal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {settings.schoolName} · Periode {settings.academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPinInput('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Kunci Panel
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setAdminTab('paslon')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'paslon'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Atur Paslon ({candidates.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('voters')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'voters'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Pemilih & DPT ({tokens.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('school')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'school'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Identitas Sekolah & Keamanan</span>
          </button>

          <button
            onClick={() => setAdminTab('control')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'control'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Kendali & Rekap Suara</span>
          </button>

          <button
            onClick={() => setAdminTab('supabase')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'supabase'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase & Deploy</span>
          </button>
        </div>

        {/* TAB 1: ATUR PASLON */}
        {adminTab === 'paslon' && candidateForm && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Candidate Selector Bar & Add Candidate Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Pilih Paslon:</span>
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditingCandidateId(c.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      editingCandidateId === c.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Paslon No. {c.number}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Paslon Baru</span>
                </button>
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentCandidate}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Paslon Ini</span>
                  </button>
                )}
              </div>
            </div>

            {candidateSaveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{candidateSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCandidate} className="space-y-6">
              {/* Photo & Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                {/* Photo Upload & Preview */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    FOTO PASLON NO. {candidateForm.number}
                  </label>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                    <img
                      src={candidateForm.posterImage}
                      alt={candidateForm.chairman.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={(e) => handlePhotoUpload(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-300"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto Baru (File)</span>
                    </button>

                    <div className="text-[11px] text-slate-500">Atau masukkan URL gambar:</div>
                    <input
                      type="text"
                      value={candidateForm.posterImage}
                      onChange={(e) => setCandidateForm({ ...candidateForm, posterImage: e.target.value })}
                      placeholder="https://contoh.com/foto-paslon.jpg"
                      className="w-full p-2 text-xs border rounded-lg"
                    />
                  </div>
                </div>

                {/* Candidate Info Fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Urut Paslon
                      </label>
                      <input
                        type="text"
                        value={candidateForm.number}
                        onChange={(e) => setCandidateForm({ ...candidateForm, number: e.target.value })}
                        className="w-full p-2.5 text-xs font-bold border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Warna Utama (Hex)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={candidateForm.color.primary}
                          onChange={(e) =>
                            setCandidateForm({
                              ...candidateForm,
                              color: { ...candidateForm.color, primary: e.target.value, accent: e.target.value }
                            })
                          }
                          className="w-9 h-9 p-0.5 border rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={candidateForm.color.primary}
                          onChange={(e) =>
                            setCandidateForm({
                              ...candidateForm,
                              color: { ...candidateForm.color, primary: e.target.value, accent: e.target.value }
                            })
                          }
                          className="flex-1 p-2 text-xs font-mono border rounded-lg uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Calon Ketua OSIS
                      </label>
                      <input
                        type="text"
                        value={candidateForm.chairman.name}
                        onChange={(e) =>
                          setCandidateForm({
                            ...candidateForm,
                            chairman: { ...candidateForm.chairman, name: e.target.value }
                          })
                        }
                        className="w-full p-2.5 text-xs font-medium border rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kelas Calon Ketua
                      </label>
                      <input
                        type="text"
                        value={candidateForm.chairman.class}
                        onChange={(e) =>
                          setCandidateForm({
                            ...candidateForm,
                            chairman: { ...candidateForm.chairman, class: e.target.value }
                          })
                        }
                        className="w-full p-2.5 text-xs font-medium border rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Calon Wakil Ketua OSIS
                      </label>
                      <input
                        type="text"
                        value={candidateForm.viceChairman.name}
                        onChange={(e) =>
                          setCandidateForm({
                            ...candidateForm,
                            viceChairman: { ...candidateForm.viceChairman, name: e.target.value }
                          })
                        }
                        className="w-full p-2.5 text-xs font-medium border rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kelas Calon Wakil Ketua
                      </label>
                      <input
                        type="text"
                        value={candidateForm.viceChairman.class}
                        onChange={(e) =>
                          setCandidateForm({
                            ...candidateForm,
                            viceChairman: { ...candidateForm.viceChairman, class: e.target.value }
                          })
                        }
                        className="w-full p-2.5 text-xs font-medium border rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slogan / Tagline Kampanye
                    </label>
                    <input
                      type="text"
                      value={candidateForm.tagline}
                      onChange={(e) => setCandidateForm({ ...candidateForm, tagline: e.target.value })}
                      className="w-full p-2.5 text-xs font-medium border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Visi Paslon
                    </label>
                    <textarea
                      rows={3}
                      value={candidateForm.vision}
                      onChange={(e) => setCandidateForm({ ...candidateForm, vision: e.target.value })}
                      className="w-full p-2.5 text-xs border rounded-lg leading-relaxed"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Missions Editor */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Daftar Misi Paslon No. {candidateForm.number}
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setCandidateForm({
                        ...candidateForm,
                        missions: [...candidateForm.missions, '']
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Butir Misi</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {candidateForm.missions.map((m, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">{mIdx + 1}.</span>
                      <input
                        type="text"
                        value={m}
                        onChange={(e) => {
                          const updated = [...candidateForm.missions];
                          updated[mIdx] = e.target.value;
                          setCandidateForm({ ...candidateForm, missions: updated });
                        }}
                        className="flex-1 p-2 text-xs border rounded-lg"
                        placeholder="Tuliskan butir misi..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = candidateForm.missions.filter((_, idx) => idx !== mIdx);
                          setCandidateForm({ ...candidateForm, missions: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Paslon No. {candidateForm.number}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: DATA PEMILIH (DPT, CSV IMPORT & RESET) */}
        {adminTab === 'voters' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 flex flex-col">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddVoterModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah 1 Pemilih</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV Data Pemilih</span>
                </button>
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu Token ({filteredTokens.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedVoterTokens.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus ${selectedVoterTokens.length} pemilih yang dipilih?`)) {
                        bulkDeleteVoters(selectedVoterTokens);
                        setSelectedVoterTokens([]);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedVoterTokens.length})</span>
                  </button>
                )}

                {/* Reset Voters Button */}
                <button
                  onClick={() => setShowResetVotersModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Kosongkan DPT</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama pemilih / token / kelas..."
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unused' | 'used')}
                className="py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Semua Status Token</option>
                <option value="unused">Belum Menggunakan Hak Suara</option>
                <option value="used">Sudah Memilih</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Semua Jenis Pemilih</option>
                <option value="Siswa">Siswa</option>
                <option value="Guru">Guru</option>
                <option value="Tata Usaha">Tata Usaha</option>
                <option value="Tendik">Tenaga Kependidikan (Tendik)</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedVoterTokens.length > 0 && selectedVoterTokens.length === filteredTokens.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVoterTokens(filteredTokens.map((t) => t.token));
                          } else {
                            setSelectedVoterTokens([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-2.5 px-3">Kode Token</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Kelas / Unit</th>
                    <th className="py-2.5 px-3">Jenis Pemilih</th>
                    <th className="py-2.5 px-3">Status Hak Suara</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data pemilih yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.map((t) => {
                      const isChecked = selectedVoterTokens.includes(t.token);

                      return (
                        <tr key={t.token} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVoterTokens([...selectedVoterTokens, t.token]);
                                } else {
                                  setSelectedVoterTokens(selectedVoterTokens.filter((x) => x !== t.token));
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {t.token}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {t.voterName || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{t.classGroup}</td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-slate-700">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {t.isUsed ? (
                              <span className="text-emerald-700 font-semibold">
                                Sudah Memilih
                              </span>
                            ) : (
                              <span className="text-blue-700 font-semibold">
                                Belum Memilih
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingVoter(t)}
                                title="Edit Pemilih"
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus pemilih ${t.voterName || t.token}?`)) {
                                    deleteVoter(t.token);
                                  }
                                }}
                                title="Hapus Pemilih"
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between shrink-0">
              <span>Menampilkan {filteredTokens.length} dari {tokens.length} pemilih</span>
              <span>
                {tokens.filter((t) => t.isUsed).length} Sudah Coblos · {tokens.filter((t) => !t.isUsed).length} Belum Coblos
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: IDENTITAS SEKOLAH & KEAMANAN PASSWORD */}
        {adminTab === 'school' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {schoolSaveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{schoolSaveMsg}</span>
              </div>
            )}

            {/* School Identity Form */}
            <form onSubmit={handleSaveSchoolSettings} className="space-y-6">
              {/* Logo Settings */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Logo Resmi Sekolah & Website
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-xs">
                    <img
                      src={schoolForm.logoUrl}
                      alt="Logo Sekolah"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Gambar Logo Baru</span>
                    </button>

                    <div className="text-[11px] text-slate-500">Atau masukkan URL Logo:</div>
                    <input
                      type="text"
                      value={schoolForm.logoUrl}
                      onChange={(e) => setSchoolForm({ ...schoolForm, logoUrl: e.target.value })}
                      placeholder="https://contoh.com/logo-sekolah.png"
                      className="w-full p-2 text-xs border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Text Information Settings */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Informasi Sekolah & Pemilihan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Sekolah
                    </label>
                    <input
                      type="text"
                      value={schoolForm.schoolName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                      className="w-full p-2.5 text-xs font-semibold border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tahun Ajaran / Periode
                    </label>
                    <input
                      type="text"
                      value={schoolForm.academicYear}
                      onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                      className="w-full p-2.5 text-xs font-semibold border rounded-lg"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Sekolah
                    </label>
                    <input
                      type="text"
                      value={schoolForm.schoolAddress}
                      onChange={(e) => setSchoolForm({ ...schoolForm, schoolAddress: e.target.value })}
                      className="w-full p-2.5 text-xs border rounded-lg"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Kegiatan / Pemilihan
                    </label>
                    <input
                      type="text"
                      value={schoolForm.electionName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, electionName: e.target.value })}
                      className="w-full p-2.5 text-xs border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Sekolah</span>
                  </button>
                </div>
              </div>
            </form>

            {/* DEDICATED PASSWORD CHANGE SECTION (Fixes user issue with setting new password) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Ubah Kata Sandi Panitia MPK
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Atur kata sandi baru untuk mengamankan akses ke panel admin ini. Kata sandi lama Anda tidak akan ditampilkan ke publik.
              </p>

              {passwordChangeStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    passwordChangeStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordChangeStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordChangeStatus.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru (Minimal 4 karakter)
                  </label>
                  <input
                    type={showPasswordChangeFields ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi baru (angka atau huruf)..."
                    className="w-full p-2.5 text-xs border rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type={showPasswordChangeFields ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full p-2.5 text-xs border rounded-lg font-mono"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="showPassToggle"
                    checked={showPasswordChangeFields}
                    onChange={(e) => setShowPasswordChangeFields(e.target.checked)}
                  />
                  <label htmlFor="showPassToggle" className="text-xs text-slate-600 cursor-pointer">
                    Tampilkan teks kata sandi
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Kata Sandi Baru</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: KENDALI & REKAP */}
        {adminTab === 'control' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Status Card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Status Pemungutan Suara
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      settings.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-base font-bold text-slate-900">
                    {settings.isOpen ? 'SEDANG DIBUKA (Siswa dapat mencoblos)' : 'DITUTUP / JEDA (Bilik suara terkunci)'}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleElectionStatus}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-colors shrink-0 ${
                  settings.isOpen
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {settings.isOpen ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{settings.isOpen ? 'Tutup Pemungutan Suara' : 'Buka Pemungutan Suara'}</span>
              </button>
            </div>

            {/* Simulator */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Simulator Suara Masuk
              </h4>
              <p className="text-xs text-slate-500">
                Gunakan untuk menguji coba grafik perolehan suara bergerak secara real-time.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => simulateVotes(5)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                >
                  + Tambah 5 Suara Uji Coba
                </button>
                <button
                  onClick={() => simulateVotes(15)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                >
                  + Tambah 15 Suara Uji Coba
                </button>
              </div>
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Rekapitulasi Berita Acara Resmi
              </h4>
              <p className="text-xs text-slate-500">
                Unduh rekap data suara masuk ke format CSV untuk tanda tangan berita acara dan laporan sekolah.
              </p>
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Data Suara (.CSV)</span>
              </button>
            </div>

            {/* Reset Area */}
            <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Area Riset Kotak Suara</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin MENGOSONGKAN seluruh kotak suara? Perolehan suara akan direset ke 0 dan semua token dapat digunakan kembali.')) {
                      resetAllElectionData();
                    }
                  }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Kosongkan Kotak Suara (Reset Perolehan Suara)
                </button>
                <button
                  onClick={() => {
                    if (confirm('Kembalikan ke data sampel bawaan SMPN 50 Jakarta?')) {
                      resetToDefaultSampleData();
                    }
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Muat Ulang Data Sampel Bawaan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPABASE DATABASE & DEPLOYMENT */}
        {adminTab === 'supabase' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            <div className={`p-4 rounded-xl border ${
              supabaseConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Status Database Supabase: {supabaseConnected ? 'TERHUBUNG (Realtime Aktif)' : 'Mode Penyimpanan Lokal (Offline Ready)'}</span>
                </div>
                {supabaseConnected && (
                  <button
                    onClick={disconnectSupabase}
                    className="text-xs text-rose-700 hover:underline font-semibold"
                  >
                    Putuskan Koneksi
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Ketika terhubung dengan Supabase, setiap perubahan kandidat, DPT, dan perolehan suara langsung tersimpan secara terpusat di cloud Supabase.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                Pengaturan Kredensial Supabase
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SUPABASE PROJECT URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full p-2.5 text-xs font-mono border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SUPABASE ANON KEY (PUBLIC API KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 text-xs font-mono border rounded-lg"
                  />
                </div>
              </div>

              {supabaseStatusMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  supabaseStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {supabaseStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{supabaseStatusMsg.text}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isTestingSupabase}
                  onClick={async () => {
                    setIsTestingSupabase(true);
                    setSupabaseStatusMsg(null);
                    const res = await connectSupabase(supabaseUrlInput, supabaseKeyInput);
                    setSupabaseStatusMsg({
                      type: res.success ? 'success' : 'error',
                      text: res.message
                    });
                    setIsTestingSupabase(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isTestingSupabase ? 'Menghubungkan...' : 'Uji & Simpan Koneksi Supabase'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Skema SQL Supabase
                  </h4>
                  <p className="text-xs text-slate-500">
                    Unduh skrip skema tabel (settings, candidates, voters, votes, audit_logs) untuk di-run di SQL Editor Supabase.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSqlSchema}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh supabase_schema.sql</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH PASLON BARU (Requested feature) */}
        {showAddCandidateModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  Tambah Pasangan Calon (Paslon) Baru
                </h3>
                <button
                  onClick={() => setShowAddCandidateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCandidate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Urut Paslon
                    </label>
                    <input
                      type="text"
                      value={newCandNumber}
                      onChange={(e) => setNewCandNumber(e.target.value)}
                      placeholder={`Contoh: 0${candidates.length + 1}`}
                      className="w-full p-2 text-xs font-bold border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Warna Identitas (Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newCandColor}
                        onChange={(e) => setNewCandColor(e.target.value)}
                        className="w-8 h-8 p-0.5 border rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newCandColor}
                        onChange={(e) => setNewCandColor(e.target.value)}
                        className="flex-1 p-2 text-xs font-mono border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Photo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Foto Paslon
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={newCandImage}
                      alt="Preview Foto"
                      className="w-16 h-20 rounded-lg object-cover border"
                    />
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        ref={newCandPhotoRef}
                        onChange={(e) => handlePhotoUpload(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => newCandPhotoRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border"
                      >
                        Pilih File Foto
                      </button>
                      <input
                        type="text"
                        value={newCandImage}
                        onChange={(e) => setNewCandImage(e.target.value)}
                        placeholder="Atau masukkan URL foto"
                        className="w-full p-1.5 text-xs border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Calon Ketua
                    </label>
                    <input
                      type="text"
                      value={newCandChairmanName}
                      onChange={(e) => setNewCandChairmanName(e.target.value)}
                      placeholder="Nama Calon Ketua"
                      className="w-full p-2 text-xs border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kelas Calon Ketua
                    </label>
                    <input
                      type="text"
                      value={newCandChairmanClass}
                      onChange={(e) => setNewCandChairmanClass(e.target.value)}
                      placeholder="Contoh: Kelas VIII-A"
                      className="w-full p-2 text-xs border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Calon Wakil Ketua
                    </label>
                    <input
                      type="text"
                      value={newCandViceName}
                      onChange={(e) => setNewCandViceName(e.target.value)}
                      placeholder="Nama Calon Wakil Ketua"
                      className="w-full p-2 text-xs border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kelas Calon Wakil Ketua
                    </label>
                    <input
                      type="text"
                      value={newCandViceClass}
                      onChange={(e) => setNewCandViceClass(e.target.value)}
                      placeholder="Contoh: Kelas VII-B"
                      className="w-full p-2 text-xs border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Slogan Kampanye
                  </label>
                  <input
                    type="text"
                    value={newCandTagline}
                    onChange={(e) => setNewCandTagline(e.target.value)}
                    placeholder="Contoh: Menuju OSIS Berkarakter dan Mandiri"
                    className="w-full p-2 text-xs border rounded-lg"
                    required
                  />
                </div>

                {/* Color Presets */}
                <div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] text-slate-500 mr-1">Preset Warna:</span>
                    {[
                      { name: 'Biru', hex: '#2563eb' },
                      { name: 'Hijau', hex: '#16a34a' },
                      { name: 'Ungu', hex: '#9333ea' },
                      { name: 'Oranye', hex: '#ea580c' },
                      { name: 'Merah', hex: '#dc2626' },
                      { name: 'Teal', hex: '#0d9488' },
                      { name: 'Emas', hex: '#d97706' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNewCandColor(col.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          newCandColor === col.hex ? 'border-slate-900 ring-2 ring-slate-400 scale-105' : 'border-white'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visi Paslon
                  </label>
                  <textarea
                    rows={2}
                    value={newCandVision}
                    onChange={(e) => setNewCandVision(e.target.value)}
                    placeholder="Tuliskan visi paslon..."
                    className="w-full p-2 text-xs border rounded-lg"
                    required
                  />
                </div>

                {/* Dynamic Missions */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Butir Misi Paslon
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewCandMissions([...newCandMissions, ''])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Butir Misi</span>
                    </button>
                  </div>
                  {newCandMissions.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={m}
                        onChange={(e) => {
                          const updated = [...newCandMissions];
                          updated[idx] = e.target.value;
                          setNewCandMissions(updated);
                        }}
                        placeholder={`Misi nomor ${idx + 1}...`}
                        className="flex-1 p-2 text-xs border rounded-lg"
                      />
                      {newCandMissions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewCandMissions(newCandMissions.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dynamic Work Programs */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Program Kerja Unggulan
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewCandPrograms([
                          ...newCandPrograms,
                          { title: `Program Kerja Unggulan ${newCandPrograms.length + 1}`, desc: '' }
                        ])
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Program Kerja</span>
                    </button>
                  </div>
                  {newCandPrograms.map((prog, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border bg-slate-50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Program #{idx + 1}</span>
                        {newCandPrograms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewCandPrograms(newCandPrograms.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 text-xs"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={prog.title}
                        onChange={(e) => {
                          const updated = [...newCandPrograms];
                          updated[idx].title = e.target.value;
                          setNewCandPrograms(updated);
                        }}
                        placeholder="Judul Program (contoh: Porseni OSIS 50)"
                        className="w-full p-1.5 text-xs border rounded bg-white font-medium"
                      />
                      <input
                        type="text"
                        value={prog.desc}
                        onChange={(e) => {
                          const updated = [...newCandPrograms];
                          updated[idx].desc = e.target.value;
                          setNewCandPrograms(updated);
                        }}
                        placeholder="Deskripsi singkat program..."
                        className="w-full p-1.5 text-xs border rounded bg-white text-slate-600"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                  >
                    Simpan & Daftarkan Paslon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH 1 PEMILIH */}
        {showAddVoterModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Data Pemilih Baru
              </h3>

              <form onSubmit={handleAddSingleVoter} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Lengkap Pemilih
                  </label>
                  <input
                    type="text"
                    value={newVoterName}
                    onChange={(e) => setNewVoterName(e.target.value)}
                    placeholder="Contoh: Muhammad Rizki"
                    className="w-full p-2 text-xs border rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kelas / Unit
                    </label>
                    <input
                      type="text"
                      value={newVoterClass}
                      onChange={(e) => setNewVoterClass(e.target.value.toUpperCase())}
                      placeholder="7A / Guru / TU"
                      className="w-full p-2 text-xs border rounded-lg uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jenis Pemilih
                    </label>
                    <select
                      value={newVoterCategory}
                      onChange={(e) => setNewVoterCategory(e.target.value as VoterCategory)}
                      className="w-full p-2 text-xs border rounded-lg"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Tata Usaha">Tata Usaha</option>
                      <option value="Tendik">Tendik</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kode Token (Kosongkan untuk otomatis)
                  </label>
                  <input
                    type="text"
                    value={newVoterToken}
                    onChange={(e) => setNewVoterToken(e.target.value.toUpperCase())}
                    placeholder="Auto-generate"
                    className="w-full p-2 text-xs border rounded-lg font-mono uppercase"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVoterModal(false)}
                    className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Tambahkan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: IMPORT DATA PEMILIH CSV (Nama Lengkap, Kelas, Jenis Pemilih) */}
        {showImportModal && (() => {
          // Parse summary in real-time
          const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          const firstLineLower = (lines[0] || '').toLowerCase();
          const hasHeader =
            firstLineLower.includes('nama') ||
            firstLineLower.includes('kelas') ||
            firstLineLower.includes('jenis');
          const dataLines = hasHeader ? lines.slice(1) : lines;

          let countSiswa = 0;
          let countGuru = 0;
          let countTU = 0;
          let countTendik = 0;
          const previewList: { name: string; classGroup: string; category: string }[] = [];

          dataLines.forEach((line, idx) => {
            const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
            if (!parts[0]) return;
            const name = parts[0];
            const classGroup = (parts[1] || 'UMUM').toUpperCase();
            const rawCat = (parts[2] || '').toLowerCase();

            let cat: VoterCategory = 'Siswa';
            if (rawCat.includes('guru')) {
              cat = 'Guru';
              countGuru++;
            } else if (rawCat.includes('tata usaha') || rawCat.includes('tu')) {
              cat = 'Tata Usaha';
              countTU++;
            } else if (rawCat.includes('tendik') || rawCat.includes('kependidikan') || rawCat.includes('staf')) {
              cat = 'Tendik';
              countTendik++;
            } else {
              cat = 'Siswa';
              countSiswa++;
            }

            if (idx < 5) {
              previewList.push({ name, classGroup, category: cat });
            }
          });

          const totalParsed = countSiswa + countGuru + countTU + countTendik;

          return (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Import Data Pemilih (Format CSV)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kolom: <code>Nama Lengkap, Kelas, Jenis Pemilih</code> (Siswa, Guru, Tata Usaha, Tendik)
                    </p>
                  </div>
                  <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Upload file button & template link */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border rounded-xl">
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    onChange={handleCsvFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih File CSV dari Komputer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs text-blue-700 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Contoh Template CSV</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Atau Tempelkan Teks CSV / Baris Data:
                  </label>
                  <textarea
                    rows={6}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`Nama Lengkap,Kelas,Jenis Pemilih\nAhmad Fauzan,7A,Siswa\nBunga Lestari,7B,Siswa\nCahya Pratama,8A,Siswa\nDewi Anggraeni,9C,Siswa\nDrs. Bambang Wijaya,Guru,Guru\nSiti Nurhaliza S.Pd,Guru,Guru\nRahmat Hidayat S.E,TU,Tata Usaha\nJoko Susilo,Tendik,Tendik`}
                    className="w-full p-2.5 text-xs border rounded-lg font-mono leading-relaxed"
                  />
                </div>

                {/* Real-time CSV Summary & Preview */}
                {totalParsed > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">
                        Hasil Analisis CSV: {totalParsed} Calon Pemilih Terdeteksi
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800 font-medium">
                        Siswa: {countSiswa}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-medium">
                        Guru: {countGuru}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 font-medium">
                        Tata Usaha: {countTU}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800 font-medium">
                        Tendik: {countTendik}
                      </span>
                    </div>

                    <div className="border-t border-blue-200 pt-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                        Pratinjau 5 Baris Pertama:
                      </span>
                      <div className="overflow-x-auto text-[11px] bg-white rounded border">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="p-1.5">Nama</th>
                              <th className="p-1.5">Kelas</th>
                              <th className="p-1.5">Jenis</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {previewList.map((row, idx) => (
                              <tr key={idx}>
                                <td className="p-1.5 font-medium">{row.name}</td>
                                <td className="p-1.5 text-slate-600">{row.classGroup}</td>
                                <td className="p-1.5">{row.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessCsvImport}
                    disabled={totalParsed === 0}
                    className="flex-1 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold transition-colors"
                  >
                    Proses & Masukkan {totalParsed > 0 ? `(${totalParsed} Pemilih)` : ''} ke DPT
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL: RESET DAFTAR PEMILIH DENGAN PILIHAN LENGKAP */}
        {showResetVotersModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Pilihan Reset Daftar Pemilih (DPT)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saat ini terdaftar {tokens.length} pemilih di DPT SMPN 50 Jakarta.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {/* Opsi 1: Kosongkan Seluruh DPT */}
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Kosongkan Seluruh DPT (Reset Total)
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Hapus bersih seluruh daftar siswa, guru, dan token. DPT akan menjadi 0, siap untuk diimpor file CSV baru.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin MENGOSONGKAN SELURUH DPT (${tokens.length} pemilih)? Tindakan ini akan menghapus semua token pemilih.`)) {
                          resetVotersList();
                          setShowResetVotersModal(false);
                          alert('Seluruh DPT berhasil dikosongkan.');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {/* Opsi 2: Reset Status Coblos Saja */}
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        Reset Status Memilih (Kembalikan Belum Coblos)
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Tetap simpan nama dan token semua pemilih, namun kembalikan statusnya menjadi Belum Memilih dan kosongkan kotak suara ke 0.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Yakin ingin mereset status semua pemilih menjadi Belum Memilih dan mengosongkan perolehan suara?')) {
                          resetTokensVoteStatus();
                          setShowResetVotersModal(false);
                          alert('Status seluruh pemilih berhasil dikembalikan ke Belum Memilih.');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      Reset Status
                    </button>
                  </div>
                </div>

                {/* Opsi 3: Pulihkan Data Sampel Bawaan */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-slate-600" />
                        Pulihkan Data Sampel Default SMPN 50
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Memulihkan kembali contoh data pemilih lengkap (Kelas 7, 8, 9, Guru, dan Tendik) beserta simulasi suara.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Kembalikan ke data sampel bawaan SMPN 50 Jakarta?')) {
                          resetToDefaultSampleData();
                          setShowResetVotersModal(false);
                          alert('Data sampel default berhasil dimuat kembali.');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      Pulihkan
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetVotersModal(false)}
                  className="w-full py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Tutup / Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT SINGLE VOTER */}
        {editingVoter && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Edit Data Pemilih
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Token
                  </label>
                  <input
                    type="text"
                    value={editingVoter.token}
                    disabled
                    className="w-full p-2 text-xs border rounded-lg bg-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Pemilih
                  </label>
                  <input
                    type="text"
                    value={editingVoter.voterName || ''}
                    onChange={(e) => setEditingVoter({ ...editingVoter, voterName: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kelas / Unit
                    </label>
                    <input
                      type="text"
                      value={editingVoter.classGroup}
                      onChange={(e) => setEditingVoter({ ...editingVoter, classGroup: e.target.value.toUpperCase() })}
                      className="w-full p-2 text-xs border rounded-lg uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jenis Pemilih
                    </label>
                    <select
                      value={editingVoter.category}
                      onChange={(e) => setEditingVoter({ ...editingVoter, category: e.target.value as VoterCategory })}
                      className="w-full p-2 text-xs border rounded-lg"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Tata Usaha">Tata Usaha</option>
                      <option value="Tendik">Tendik</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isUsedCheck"
                    checked={editingVoter.isUsed}
                    onChange={(e) =>
                      setEditingVoter({
                        ...editingVoter,
                        isUsed: e.target.checked,
                        usedAt: e.target.checked ? new Date().toISOString() : undefined
                      })
                    }
                  />
                  <label htmlFor="isUsedCheck" className="text-xs text-slate-700">
                    Tandai sudah menggunakan hak suara
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVoter(null)}
                  className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateVoter(editingVoter.token, editingVoter);
                    setEditingVoter(null);
                  }}
                  className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINT MODAL */}
        {showPrintModal && (
          <PrintTokenModal
            tokens={filteredTokens}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    </div>
  );
};
