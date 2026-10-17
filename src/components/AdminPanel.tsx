import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useElection } from '../context/ElectionContext';
import { cleanSupabaseUrl } from '../utils/supabase';
import { CandidatePair, VoterToken, VoterCategory, TimelineItem, TimelineStatus } from '../types/election';
import { generateUniqueToken } from '../utils/tokenGenerator';
import { compressImageFile } from '../utils/imageCompressor';
import { PrintTokenModal } from './PrintTokenModal';
import { PrintBallotModal } from './PrintBallotModal';
import { TableImportModal } from './TableImportModal';
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
  FileDown,
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
  RotateCcw,
  RotateCw,
  Sliders,
  Table,
  Calendar,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Share2,
  ExternalLink,
  RefreshCw,
  UploadCloud
} from 'lucide-react';

export interface TableImportRow {
  id: string;
  name: string;
  classGroup: string;
  category: VoterCategory;
  token: string;
}

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
    fixDuplicateTokens,
    simulateVotes,
    resetAllElectionData,
    resetToDefaultSampleData,
    resetVotersList,
    resetTokensVoteStatus,
    updateSettings,
    validateAdminPassword,
    updateAdminPassword,
    connectSupabase,
    disconnectSupabase,
    uploadToSupabase,
    refreshFromSupabase,
    timeline,
    addTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
    reorderTimeline,
    resetTimelineToDefault
  } = useElection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Tabs
  const [adminTab, setAdminTab] = useState<'paslon' | 'voters' | 'timeline' | 'school' | 'control' | 'supabase'>('paslon');

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

  const loadedCandidateIdRef = useRef<number | null>(null);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);

  // When changing editing candidate (only re-populate if switching candidate tab or initial load)
  React.useEffect(() => {
    if (activeEditingCandidate && (loadedCandidateIdRef.current !== editingCandidateId || !candidateForm)) {
      loadedCandidateIdRef.current = editingCandidateId;
      const cloned = JSON.parse(JSON.stringify(activeEditingCandidate));
      if (!cloned.workPrograms || !Array.isArray(cloned.workPrograms)) {
        cloned.workPrograms = [];
      }
      setCandidateForm(cloned);
      setCandidateSaveMsg(null);
    }
  }, [editingCandidateId]);

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
  const [tableRows, setTableRows] = useState<TableImportRow[]>([]);
  const [pasteBoxText, setPasteBoxText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [tableTokenPrefix, setTableTokenPrefix] = useState<string>(
    settings.tokenPrefix && !settings.tokenPrefix.includes('SMP50') ? settings.tokenPrefix : 'S'
  );

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
    votingSubtitle: settings.votingSubtitle || 'Gunakan token 5 digit unik Anda (contoh: S7A01). Setiap token hanya berlaku satu kali coblos.',
    tokenPrefix: settings.tokenPrefix && !settings.tokenPrefix.includes('SMP50') ? settings.tokenPrefix : 'S',
    tokenLength: 5
  });
  const [schoolSaveMsg, setSchoolSaveMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

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
  const [isUploadingToSupabase, setIsUploadingToSupabase] = useState(false);
  const [isRefreshingFromSupabase, setIsRefreshingFromSupabase] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedSqlSchema, setCopiedSqlSchema] = useState(false);

  // Modals & Refs
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintBallotModal, setShowPrintBallotModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const newCandPhotoRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Timeline Admin State
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineDayDate, setTimelineDayDate] = useState('');
  const [timelineActivity, setTimelineActivity] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [timelineStatus, setTimelineStatus] = useState<TimelineStatus>('upcoming');
  const [timelineTime, setTimelineTime] = useState('');
  const [timelineLocation, setTimelineLocation] = useState('');

  const handleOpenAddTimeline = () => {
    setEditingTimelineId(null);
    setTimelineDayDate('');
    setTimelineActivity('');
    setTimelineDescription('');
    setTimelineStatus('upcoming');
    setTimelineTime('');
    setTimelineLocation('');
    setShowTimelineModal(true);
  };

  const handleOpenEditTimeline = (item: TimelineItem) => {
    setEditingTimelineId(item.id);
    setTimelineDayDate(item.dayDate);
    setTimelineActivity(item.activity);
    setTimelineDescription(item.description);
    setTimelineStatus(item.status);
    setTimelineTime(item.time || '');
    setTimelineLocation(item.location || '');
    setShowTimelineModal(true);
  };

  const handleSaveTimelineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineDayDate.trim() || !timelineActivity.trim() || !timelineDescription.trim()) {
      showToast('Hari tanggal, Kegiatan, dan Keterangan wajib diisi.');
      return;
    }

    if (editingTimelineId) {
      updateTimelineItem(editingTimelineId, {
        dayDate: timelineDayDate.trim(),
        activity: timelineActivity.trim(),
        description: timelineDescription.trim(),
        status: timelineStatus,
        time: timelineTime.trim() || undefined,
        location: timelineLocation.trim() || undefined
      });
      showToast(`✓ Tahapan "${timelineActivity.trim()}" berhasil diperbarui.`);
    } else {
      const newItem: TimelineItem = {
        id: `timeline-${Date.now()}`,
        dayDate: timelineDayDate.trim(),
        activity: timelineActivity.trim(),
        description: timelineDescription.trim(),
        status: timelineStatus,
        time: timelineTime.trim() || undefined,
        location: timelineLocation.trim() || undefined
      };
      addTimelineItem(newItem);
      showToast(`✓ Tahapan "${timelineActivity.trim()}" berhasil ditambahkan.`);
    }

    setShowTimelineModal(false);
  };

  const handleDeleteTimeline = (item: TimelineItem) => {
    deleteTimelineItem(item.id);
    showToast(`✓ Tahapan "${item.activity}" berhasil dihapus.`);
  };

  const handleMoveTimeline = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= timeline.length) return;
    reorderTimeline(fromIndex, toIndex);
  };

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

  // Handle Photo Upload with Automatic Image Optimization & Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewCandidate = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Memproses dan mengompres foto paslon...');
      const compressedDataUrl = await compressImageFile(file, 900, 1100, 0.85);
      if (isNewCandidate) {
        setNewCandImage(compressedDataUrl);
      } else if (candidateForm) {
        setCandidateForm((prev) => (prev ? { ...prev, posterImage: compressedDataUrl } : null));
      }
      showToast('✓ Foto paslon berhasil dioptimasi. Klik "Simpan Perubahan Paslon" untuk menyimpan permanen.');
    } catch {
      showToast('Gagal memproses file foto. Pastikan format file JPG/PNG.');
    }
  };

  // Handle Logo Upload with Automatic Image Optimization & Compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Memproses logo sekolah...');
      const compressedLogo = await compressImageFile(file, 600, 600, 0.88);
      setSchoolForm((prev) => ({ ...prev, logoUrl: compressedLogo }));
      showToast('✓ Logo sekolah berhasil diperbarui. Klik "Simpan Identitas Sekolah" untuk menyimpan.');
    } catch {
      showToast('Gagal memproses logo sekolah.');
    }
  };

  // Handle Save Candidate Changes (Async with guaranteed persistence)
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm) return;

    setIsSavingCandidate(true);
    setCandidateSaveMsg(null);
    try {
      const res = await updateCandidate(candidateForm);
      setCandidateSaveMsg(res.message);
      loadedCandidateIdRef.current = candidateForm.id;
      showToast(`✓ Perubahan Paslon No. ${candidateForm.number} (${candidateForm.chairman.name}) berhasil disimpan permanen ke sistem!`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Gagal menyimpan: ${error?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingCandidate(false);
      setTimeout(() => setCandidateSaveMsg(null), 4000);
    }
  };

  // Handle Add New Candidate (Async with guaranteed persistence)
  const handleCreateCandidate = async (e: React.FormEvent) => {
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
      showToast('Minimal harus ada 1 pasangan calon untuk pemilihan OSIS.');
      return;
    }
    const targetNum = activeEditingCandidate?.number;
    deleteCandidate(editingCandidateId);
    const remaining = candidates.filter((c) => c.id !== editingCandidateId);
    if (remaining.length > 0) {
      setEditingCandidateId(remaining[0].id);
    }
    showToast(`✓ Paslon No. ${targetNum} berhasil dihapus.`);
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
      announcementText: schoolForm.announcementText,
      quickCountTitle: schoolForm.quickCountTitle,
      quickCountSubtitle: schoolForm.quickCountSubtitle,
      votingTitle: schoolForm.votingTitle,
      votingSubtitle: schoolForm.votingSubtitle,
      tokenPrefix: schoolForm.tokenPrefix,
      tokenLength: Number(schoolForm.tokenLength) || 4
    });
    setSchoolSaveMsg('Pengaturan sekolah, judul tampilan, dan format token berhasil disimpan!');
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
    const cleanClass = newVoterClass.trim().toUpperCase() || '7A';
    const cleanToken =
      newVoterToken.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      makeToken(cleanClass, settings.tokenPrefix);

    if (tokens.some((t) => t.token === cleanToken)) {
      showToast(`Token "${cleanToken}" sudah terdaftar di DPT. Gunakan token unik.`);
      return;
    }

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

  // Download TRUE Microsoft Excel (.xlsx) Template with separate columns
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
      ws['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Template_DPT');
      XLSX.writeFile(wb, 'Template_DPT_SMPN50.xlsx');
      showToast('✓ Berhasil mengunduh Template_DPT_SMPN50.xlsx (Kolom A: Nama Lengkap, B: Kelas/Unit, C: Jenis DPT terpisah).');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file Excel.');
    }
  };

  // Download Sample CSV Template with proper quote formatting and BOM
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
    showToast(`✓ Template CSV (${delimiter === ';' ? 'Pemisah Titik Koma ;' : 'Pemisah Koma ,'}) berhasil diunduh. Kolom: Nama Lengkap | Kelas/Unit | Jenis DPT.`);
  };

  // Token Generator for Table Rows & Voters (100% Collision-free 5-char Token)
  const makeToken = (classGroup: string, prefixVal?: string, indexNum?: number, customSet?: Set<string>) => {
    const usedSet = customSet || new Set([...tokens.map((t) => t.token), ...tableRows.map((r) => r.token)]);
    return generateUniqueToken(
      classGroup,
      'Siswa',
      usedSet,
      prefixVal || settings.tokenPrefix || 'S',
      indexNum
    );
  };

  // Convert raw text (CSV, TSV, Semicolon) into Table rows with proper delimiter & quote support
  const parseRawTextToRows = (raw: string, currentPrefix?: string): TableImportRow[] => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const filteredLines = lines.filter((l) => !l.toLowerCase().startsWith('sep='));
    if (filteredLines.length === 0) return [];

    const firstLineLower = filteredLines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('nama') ||
      firstLineLower.includes('lengkap') ||
      firstLineLower.includes('siswa') ||
      firstLineLower.includes('kelas') ||
      firstLineLower.includes('unit') ||
      firstLineLower.includes('jenis') ||
      firstLineLower.includes('dpt') ||
      firstLineLower.includes('token');

    const dataLines = hasHeader ? filteredLines.slice(1) : filteredLines;
    const generated: TableImportRow[] = [];

    // CRITICAL: Declare usedSet and classCounters OUTSIDE the loop so each row accumulates unique tokens!
    const usedSet = new Set<string>();
    tokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    tableRows.forEach((r) => r.token && usedSet.add(r.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};

    dataLines.forEach((line, idx) => {
      let delimiter = ',';
      if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(';')) {
        delimiter = ';';
      }

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
      const rawCategory = (cleanParts[2] || '').toLowerCase();
      const customToken = cleanParts[3] ? cleanParts[3].toUpperCase() : '';

      let category: VoterCategory = 'Siswa';
      if (rawCategory.includes('guru')) {
        category = 'Guru';
      } else if (rawCategory.includes('tata usaha') || rawCategory.includes('tu')) {
        category = 'Tata Usaha';
      } else if (rawCategory.includes('tendik') || rawCategory.includes('kependidikan') || rawCategory.includes('staf')) {
        category = 'Tendik';
      } else {
        category = 'Siswa';
      }

      classCounters[classGroup] = (classCounters[classGroup] || 0) + 1;

      let token = customToken;
      if (!token || usedSet.has(token)) {
        token = generateUniqueToken(
          classGroup,
          category,
          usedSet,
          currentPrefix || tableTokenPrefix || settings.tokenPrefix || 'S',
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

  // Handle CSV / File Upload to Table
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const rows = parseRawTextToRows(content, tableTokenPrefix);
        if (rows.length > 0) {
          setTableRows((prev) => [...prev, ...rows]);
          showToast(`✓ Berhasil memuat ${rows.length} baris ke dalam tabel dengan token unik!`);
        } else {
          showToast('Tidak ditemukan baris data yang valid dari file ini.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Process text pasted from Excel / Spreadsheet
  const handleProcessPastedExcel = () => {
    if (!pasteBoxText.trim()) return;
    const rows = parseRawTextToRows(pasteBoxText, tableTokenPrefix);
    if (rows.length > 0) {
      setTableRows((prev) => [...prev, ...rows]);
      setPasteBoxText('');
      setShowPasteBox(false);
      showToast(`✓ Berhasil menambahkan ${rows.length} baris dari Excel dengan token unik.`);
    } else {
      showToast('Format data tidak sesuai. Pastikan Anda menyalin kolom: Nama | Kelas | Jenis');
    }
  };

  // Add Blank Row
  const handleAddBlankTableRow = () => {
    const usedSet = new Set([...tokens.map((t) => t.token), ...tableRows.map((r) => r.token)]);
    const newRow: TableImportRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      classGroup: '7A',
      category: 'Siswa',
      token: generateUniqueToken('7A', 'Siswa', usedSet, tableTokenPrefix || settings.tokenPrefix || 'S')
    };
    setTableRows((prev) => [...prev, newRow]);
  };

  // Add 5 Blank Rows
  const handleAdd5BlankTableRows = () => {
    const usedSet = new Set<string>();
    tokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    tableRows.forEach((r) => r.token && usedSet.add(r.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};

    const rows: TableImportRow[] = Array.from({ length: 5 }, (_, i) => {
      classCounters['7A'] = (classCounters['7A'] || 0) + 1;
      const newToken = generateUniqueToken('7A', 'Siswa', usedSet, tableTokenPrefix || settings.tokenPrefix || 'S', classCounters['7A']);
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

  // Regenerate all tokens in Table
  const handleRegenerateAllTokens = () => {
    if (tableRows.length === 0) return;
    const usedSet = new Set<string>();
    tokens.forEach((t) => t.token && usedSet.add(t.token.trim().toUpperCase()));
    const classCounters: Record<string, number> = {};
    setTableRows((prev) =>
      prev.map((r) => {
        classCounters[r.classGroup] = (classCounters[r.classGroup] || 0) + 1;
        const newToken = generateUniqueToken(
          r.classGroup,
          r.category,
          usedSet,
          tableTokenPrefix || settings.tokenPrefix || 'S',
          classCounters[r.classGroup]
        );
        usedSet.add(newToken.toUpperCase());
        return {
          ...r,
          token: newToken
        };
      })
    );
    showToast('✓ Seluruh token berhasil dibuat ulang dan dipastikan 100% unik tanpa ada yang sama.');
  };

  // Save Table to DPT
  const handleSaveTableToDpt = () => {
    if (tableRows.length === 0) {
      showToast('Tabel masih kosong. Tambahkan atau tempel data pemilih terlebih dahulu.');
      return;
    }

    // Check empty names or tokens
    const emptyNameIdx = tableRows.findIndex((r) => !r.name.trim());
    if (emptyNameIdx !== -1) {
      showToast(`Baris ke-${emptyNameIdx + 1} belum memiliki nama pemilih.`);
      return;
    }

    const emptyTokenIdx = tableRows.findIndex((r) => !r.token.trim());
    if (emptyTokenIdx !== -1) {
      showToast(`Baris ke-${emptyTokenIdx + 1} belum memiliki token. Silakan isi atau klik tombol acak token.`);
      return;
    }

    // Check duplicate tokens in table
    const tokenSet = new Set<string>();
    for (let i = 0; i < tableRows.length; i++) {
      const tok = tableRows[i].token.trim().toUpperCase();
      if (tokenSet.has(tok)) {
        showToast(`Terdapat token duplikat dalam tabel: "${tok}" pada baris ke-${i + 1}. Setiap pemilih wajib memiliki token unik.`);
        return;
      }
      tokenSet.add(tok);
    }

    // Convert to VoterToken[]
    const newVoters: VoterToken[] = tableRows.map((r) => ({
      token: r.token.trim().toUpperCase(),
      voterName: r.name.trim(),
      classGroup: (r.classGroup || 'UMUM').trim().toUpperCase(),
      category: r.category,
      isUsed: false
    }));

    importVoters(newVoters);
    setTableRows([]);
    setShowImportModal(false);
    showToast(`✓ Sukses! ${newVoters.length} pemilih berhasil disinkronkan ke dalam DPT.`);
  };

  // Copy Unused Tokens
  const handleCopyUnusedTokens = () => {
    const unusedList = tokens.filter((t) => !t.isUsed).map((t) => `${t.token} (${t.voterName || t.classGroup})`).join('\n');
    navigator.clipboard.writeText(unusedList);
    showToast('✓ Berhasil menyalin seluruh token belum dipakai ke papan klip!');
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
            onClick={() => setAdminTab('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              adminTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline Pilkasis ({timeline.length})</span>
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

              {/* Program Kerja Unggulan Paslon Editor */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Program Kerja Unggulan Paslon No. {candidateForm.number}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kelola program kerja unggulan paslon yang akan ditampilkan di Bilik Suara, Profil Paslon, dan Layar Informasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = candidateForm.workPrograms || [];
                      setCandidateForm({
                        ...candidateForm,
                        workPrograms: [
                          ...current,
                          {
                            title: `Program Kerja Unggulan #${current.length + 1}`,
                            desc: ''
                          }
                        ]
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Program Kerja</span>
                  </button>
                </div>

                {(!candidateForm.workPrograms || candidateForm.workPrograms.length === 0) ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-medium">Belum ada program kerja unggulan untuk Paslon ini.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCandidateForm({
                          ...candidateForm,
                          workPrograms: [
                            {
                              title: 'Program Kerja Unggulan 1',
                              desc: 'Deskripsi program kerja inovatif untuk memajukan siswa SMPN 50 Jakarta.'
                            }
                          ]
                        });
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Program Kerja Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidateForm.workPrograms.map((prog, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {pIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Program Kerja Unggulan #{pIdx + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (candidateForm.workPrograms || []).filter((_, idx) => idx !== pIdx);
                              setCandidateForm({ ...candidateForm, workPrograms: updated });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium hover:underline p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Program</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Nama / Judul Program Kerja
                          </label>
                          <input
                            type="text"
                            value={prog.title}
                            onChange={(e) => {
                              const updated = [...(candidateForm.workPrograms || [])];
                              updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                              setCandidateForm({ ...candidateForm, workPrograms: updated });
                            }}
                            placeholder="Contoh: Podcast 'Suara Rajawali 50' / Pentas Seni Akbar"
                            className="w-full p-2 text-xs font-semibold border rounded-lg bg-white border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Deskripsi & Rincian Kegiatan
                          </label>
                          <textarea
                            rows={2}
                            value={prog.desc}
                            onChange={(e) => {
                              const updated = [...(candidateForm.workPrograms || [])];
                              updated[pIdx] = { ...updated[pIdx], desc: e.target.value };
                              setCandidateForm({ ...candidateForm, workPrograms: updated });
                            }}
                            placeholder="Jelaskan tujuan kegiatan, target pelaksanaan, dan dampak positif bagi warga sekolah..."
                            className="w-full p-2 text-xs border rounded-lg bg-white border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Input & Import Tabel (Excel/CSV)</span>
                </button>
                <button
                  onClick={() => setShowPrintBallotModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  title="Unduh file PDF Surat Suara resmi A4 (3 per lembar dengan foto paslon besar dan cover resmi OSIS)"
                >
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  <span>Unduh Surat Suara PDF (Siap Cetak)</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu Token</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fixed = fixDuplicateTokens();
                    if (fixed > 0) {
                      showToast(`✓ Berhasil! Sebanyak ${fixed} nomor token yang sama/duplikat telah diperbaiki otomatis menjadi token unik.`);
                    } else {
                      showToast('✓ Sempurna! Seluruh nomor token DPT saat ini sudah 100% unik tanpa ada yang sama.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-300 transition-colors shadow-2xs"
                  title="Deteksi dan pastikan seluruh token di DPT tidak ada yang sama atau kembar"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Periksa & Pastikan Token Unik</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedVoterTokens.length > 0 && (
                  <button
                    onClick={() => {
                      const count = selectedVoterTokens.length;
                      bulkDeleteVoters(selectedVoterTokens);
                      setSelectedVoterTokens([]);
                      showToast(`✓ Berhasil menghapus ${count} pemilih.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedVoterTokens.length})</span>
                  </button>
                )}

                {/* Reset Voters Buttons */}
                <button
                  onClick={() => setShowResetVotersModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors shadow-2xs"
                  title="Buka menu opsi reset DPT"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Kosongkan DPT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('PERINGATAN: Kosongkan seluruh daftar pemilih (DPT) dan kotak suara menjadi 0? Tindakan ini akan menghapus semua siswa dan token yang ada.')) {
                      resetVotersList();
                      showToast('✓ Berhasil! Seluruh DPT telah dikosongkan. Jumlah DPT sekarang: 0.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  title="Klik untuk langsung mengosongkan seluruh DPT menjadi 0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan (0)</span>
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
                    <th className="py-2.5 px-3">Token</th>
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
                                onClick={() => {
                                  setEditingVoter({ ...t });
                                  setOriginalEditingToken(t.token);
                                }}
                                title="Edit Pemilih & Token"
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  deleteVoter(t.token);
                                  showToast(`✓ Pemilih ${t.voterName || t.token} berhasil dihapus.`);
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

        {/* TAB: TIMELINE & AGENDA PILKASIS */}
        {adminTab === 'timeline' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Kelola Timeline & Tahapan Proses Pilkasis
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur Hari & Tanggal, Nama Kegiatan, Keterangan, Waktu/Tempat, serta Status tahapan (Selesai, Sedang Berlangsung, Akan Datang).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    resetTimelineToDefault();
                    showToast('✓ Jadwal agenda Pilkasis berhasil dipulihkan ke standar default bawaan.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pulihkan Standar</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddTimeline}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tahapan Baru</span>
                </button>
              </div>
            </div>

            {/* Rekap Status Timeline (Sinkron 100% dengan Jumlah Tahapan yang Dibuat) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tahapan</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{timeline.length}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  All
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Selesai</div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    {timeline.filter((t) => t.status === 'completed').length}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Sedang Berlangsung</div>
                  <div className="text-xl font-black text-blue-700 mt-0.5">
                    {timeline.filter((t) => t.status === 'ongoing').length}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  ●
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Akan Datang</div>
                  <div className="text-xl font-black text-amber-700 mt-0.5">
                    {timeline.filter((t) => t.status === 'upcoming').length}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  ⏳
                </div>
              </div>
            </div>

            {/* List / Table of Timeline Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-20 text-center">Urutan</th>
                      <th className="py-2.5 px-3 w-48">Hari & Tanggal</th>
                      <th className="py-2.5 px-3 w-56">Kegiatan</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 w-40 text-center">Status Tahap</th>
                      <th className="py-2.5 px-3 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {timeline.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada agenda tahapan. Klik "Tambah Tahapan Baru" atau "Pulihkan Standar".
                        </td>
                      </tr>
                    ) : (
                      timeline.map((item, index) => {
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              item.status === 'ongoing' ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            {/* Reorder Buttons */}
                            <td className="py-3 px-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveTimeline(index, index - 1)}
                                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600"
                                  title="Geser Naik"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-slate-700 tabular-nums w-4 text-center">
                                  {index + 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={index === timeline.length - 1}
                                  onClick={() => handleMoveTimeline(index, index + 1)}
                                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600"
                                  title="Geser Turun"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Hari & Tanggal */}
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{item.dayDate}</span>
                              </div>
                              {item.time && (
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-normal">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{item.time}</span>
                                </div>
                              )}
                            </td>

                            {/* Kegiatan */}
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {item.activity}
                              {item.location && (
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-normal">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </td>

                            {/* Keterangan */}
                            <td className="py-3 px-3 text-slate-600 leading-relaxed max-w-md">
                              {item.description}
                            </td>

                            {/* Status Selector */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <select
                                value={item.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as TimelineStatus;
                                  updateTimelineItem(item.id, { status: newStatus });
                                  showToast(`✓ Status "${item.activity}" diubah menjadi ${newStatus === 'completed' ? 'Selesai' : newStatus === 'ongoing' ? 'Sedang Berlangsung' : 'Akan Datang'}.`);
                                }}
                                className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : item.status === 'ongoing'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="upcoming">Akan Datang</option>
                                <option value="ongoing">Sedang Berlangsung</option>
                                <option value="completed">Selesai</option>
                              </select>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTimeline(item)}
                                  className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                  title="Edit Tahapan"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTimeline(item)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                  title="Hapus Tahapan"
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
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between shrink-0">
              <span>Menampilkan {timeline.length} tahapan agenda Pilkasis</span>
              <span>
                {timeline.filter((t) => t.status === 'completed').length} Selesai · {timeline.filter((t) => t.status === 'ongoing').length} Berlangsung · {timeline.filter((t) => t.status === 'upcoming').length} Akan Datang
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

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teks Pengumuman Berjalan (Marquee)
                    </label>
                    <input
                      type="text"
                      value={schoolForm.announcementText}
                      onChange={(e) => setSchoolForm({ ...schoolForm, announcementText: e.target.value })}
                      placeholder="Contoh: Pemungutan suara berlangsung hingga pukul 14:00 WIB..."
                      className="w-full p-2.5 text-xs border rounded-lg"
                    />
                  </div>
                </div>

                {/* Customizable Page Titles & Subtitles */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Kustomisasi Judul Tampilan (Bisa Diatur Penuh Oleh Admin)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ubah judul dan keterangan yang tampil di layar Quick Count maupun Bilik Suara agar sesuai dengan kebutuhan panitia.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 sm:col-span-2">
                      <span className="text-xs font-bold text-blue-900 block">
                        Pengaturan Tampilan Quick Count:
                      </span>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Judul Utama Quick Count
                        </label>
                        <input
                          type="text"
                          value={schoolForm.quickCountTitle}
                          onChange={(e) => setSchoolForm({ ...schoolForm, quickCountTitle: e.target.value })}
                          placeholder="Quick Count Perhitungan Suara Pemilihan OSIS"
                          className="w-full p-2.5 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Subjudul / Keterangan Quick Count
                        </label>
                        <input
                          type="text"
                          value={schoolForm.quickCountSubtitle}
                          onChange={(e) => setSchoolForm({ ...schoolForm, quickCountSubtitle: e.target.value })}
                          placeholder="Pantau perolehan suara resmi secara real-time, transparan, dan akurat."
                          className="w-full p-2.5 text-xs border rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3 sm:col-span-2">
                      <span className="text-xs font-bold text-emerald-900 block">
                        Pengaturan Tampilan Bilik Suara (Voting):
                      </span>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Judul Halaman Bilik Suara
                        </label>
                        <input
                          type="text"
                          value={schoolForm.votingTitle}
                          onChange={(e) => setSchoolForm({ ...schoolForm, votingTitle: e.target.value })}
                          placeholder="Masuk dengan Token Pemilihan"
                          className="w-full p-2.5 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Subjudul / Petunjuk Bilik Suara
                        </label>
                        <input
                          type="text"
                          value={schoolForm.votingSubtitle}
                          onChange={(e) => setSchoolForm({ ...schoolForm, votingSubtitle: e.target.value })}
                          placeholder="Gunakan token unik Anda yang telah dibagikan oleh Panitia. Setiap token hanya berlaku satu kali coblos."
                          className="w-full p-2.5 text-xs border rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 block">
                          Format Otomatis Generator Token (5 Digit Ringkas Tanpa -):
                        </span>
                        <span className="text-[11px] text-purple-700 font-mono font-bold bg-purple-100 px-2 py-0.5 rounded">
                          Pratinjau: {(schoolForm.tokenPrefix || 'S').charAt(0)}7A01
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Awalan / Prefix Huruf Token
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            value={schoolForm.tokenPrefix}
                            onChange={(e) => setSchoolForm({ ...schoolForm, tokenPrefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                            placeholder="S (Siswa: S7A01, Guru: G5001, TU: T5001)"
                            className="w-full p-2.5 text-xs border rounded-lg font-mono bg-white uppercase font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Format Standar Sistem
                          </label>
                          <div className="p-2.5 text-xs font-medium text-slate-700 bg-white rounded-lg border border-slate-200">
                            5 Digit Huruf & Angka (Contoh: S7A01, S8B05, G5001)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan & Judul Tampilan</span>
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

            {/* Export & Dokumen Pemilihan */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Dokumen Resmi & Rekapitulasi Pemilihan
              </h4>
              <p className="text-xs text-slate-500">
                Cetak surat suara fisik format A4 (3 per lembar dengan token unik DPT) dan unduh data rekapitulasi suara masuk untuk berita acara resmi.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setShowPrintBallotModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  <span>Unduh & Cetak Surat Suara Resmi (PDF A4)</span>
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Data Suara (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Reset Area */}
            <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Area Riset Kotak Suara</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetAllElectionData();
                    showToast('✓ Kotak suara berhasil dikosongkan. Perolehan suara direset ke 0.');
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  Kosongkan Kotak Suara (Reset Perolehan Suara)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetToDefaultSampleData();
                    showToast('✓ Data sampel bawaan SMPN 50 Jakarta berhasil dimuat.');
                  }}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
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
            {/* Status Card */}
            <div className={`p-4 rounded-xl border ${
              supabaseConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <Database className={`w-5 h-5 ${supabaseConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span>
                    Status Cloud Database Supabase:{' '}
                    {supabaseConnected ? 'TERHUBUNG AKTIF (Realtime Antar Perangkat)' : 'Mode Lokal (Belum Terhubung ke Cloud)'}
                  </span>
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
              <p className="text-xs mt-1.5 leading-relaxed">
                {supabaseConnected
                  ? 'Setiap penambahan/pengeditan paslon, foto, program kerja unggulan, DPT, dan perolehan suara langsung tersinkron secara REALTIME ke seluruh HP, laptop, dan proyektor di manapun!'
                  : 'Saat ini sistem berjalan dalam penyimpanan browser lokal. Agar perubahan dapat dilihat oleh siapapun dari HP atau device lain (termasuk saat di-deploy ke Vercel), Anda wajib menghubungkan Supabase.'}
              </p>
            </div>

            {/* Quick Sync & Cloud Push Actions */}
            {supabaseConnected && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-blue-900 uppercase">
                    Sinkronisasi Data Lokal ke Cloud Supabase
                  </h4>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Jika Anda baru saja selesai mengedit nama Paslon, mengunggah foto, menambah program kerja, atau mengimpor DPT di komputer ini, klik tombol di bawah agar seluruh data lokal segera terunggah ke database cloud Supabase sehingga langsung tampil di HP siapapun.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isUploadingToSupabase}
                    onClick={async () => {
                      setIsUploadingToSupabase(true);
                      const res = await uploadToSupabase();
                      showToast(res.message);
                      setIsUploadingToSupabase(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingToSupabase ? 'Mengunggah Data ke Cloud...' : 'Unggah Seluruh Data Lokal ke Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefreshingFromSupabase}
                    onClick={async () => {
                      setIsRefreshingFromSupabase(true);
                      const res = await refreshFromSupabase();
                      showToast(res.message);
                      setIsRefreshingFromSupabase(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFromSupabase ? 'animate-spin' : ''}`} />
                    <span>Tarik Data Terbaru dari Supabase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?sb_url=${encodeURIComponent(supabaseUrlInput || settings.supabaseUrl || '')}&sb_key=${encodeURIComponent(supabaseKeyInput || settings.supabaseAnonKey || '')}`;
                      navigator.clipboard.writeText(shareUrl);
                      setCopiedShareLink(true);
                      showToast('✓ Link akses sinkron HP disalin! Kirim via WhatsApp/buka di HP.');
                      setTimeout(() => setCopiedShareLink(false), 3000);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    {copiedShareLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedShareLink ? 'Link Tersalin!' : 'Salin Link Akses HP (Auto-Connect)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Vercel Deployment Instructions Box */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-[11px] font-bold">
                    PANDUAN VERCEL
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    Mengapa Perubahan Tidak Tampil di HP Saat Dibuka di Vercel?
                  </h4>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  Vercel merupakan hosting frontend statis. File server lokal (<code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">server.ts</code>) tidak dijalankan oleh Vercel. Oleh karena itu, <strong>setiap device baru (HP/laptop lain) membutuhkan database cloud Supabase</strong> agar dapat melihat perubahan paslon, program kerja, dan perolehan suara.
                </p>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-2 mt-2">
                  <p className="font-semibold text-white text-[11px]">
                    Langkah agar seluruh HP langsung sinkron otomatis saat membuka web Vercel:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                    <li>
                      Buka <strong>Vercel Dashboard</strong> &rarr; pilih Project Anda &rarr; klik tab <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                    </li>
                    <li>
                      Tambahkan 2 variabel berikut:
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                        <div className="bg-slate-950 p-2 rounded border border-slate-700 font-mono text-[10px]">
                          <span className="text-slate-400 block">KEY 1:</span>
                          <span className="text-emerald-400 font-bold">VITE_SUPABASE_URL</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-700 font-mono text-[10px]">
                          <span className="text-slate-400 block">KEY 2:</span>
                          <span className="text-emerald-400 font-bold">VITE_SUPABASE_ANON_KEY</span>
                        </div>
                      </div>
                    </li>
                    <li>
                      Klik <strong>Save</strong> lalu lakukan <strong>Redeploy</strong> di Vercel. Setelah itu, setiap orang yang membuka web di HP manapun otomatis langsung terhubung ke database dan sinkron realtime tanpa perlu setup apapun!
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Supabase Credentials Form */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                Pengaturan Kredensial Database Supabase
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      SUPABASE PROJECT URL
                    </label>
                    <span className="text-[11px] text-amber-600 font-medium">
                      (Wajib tanpa /rest/v1/)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes('/rest/v1')) {
                        const cleaned = cleanSupabaseUrl(val);
                        setSupabaseUrlInput(cleaned);
                        showToast('✓ Otomatis merapikan: akhiran /rest/v1/ dihapus.');
                      } else {
                        setSupabaseUrlInput(val);
                      }
                    }}
                    onBlur={() => {
                      if (supabaseUrlInput.trim()) {
                        setSupabaseUrlInput(cleanSupabaseUrl(supabaseUrlInput));
                      }
                    }}
                    placeholder="Contoh: https://wvhdmsljkmvyicfoxlai.supabase.co"
                    className="w-full p-2.5 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format yang benar adalah alamat domain saja, misal: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">https://wvhdmsljkmvyicfoxlai.supabase.co</code> (jangan sertakan <code className="text-rose-600 line-through">/rest/v1/</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SUPABASE ANON KEY (PUBLIC API KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value.trim())}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  {isTestingSupabase ? 'Menghubungkan & Memeriksa Database...' : 'Uji & Simpan Koneksi Supabase'}
                </button>
              </div>
            </div>

            {/* SQL Schema Script Box */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Skema SQL Lengkap Supabase (Idempotent)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mencakup 6 tabel: <code>settings</code>, <code>candidates</code>, <code>voters</code>, <code>votes</code>, <code>audit_logs</code>, dan <code>timeline</code> beserta Realtime & RLS.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/supabase_schema.sql');
                        const text = await res.text();
                        await navigator.clipboard.writeText(text);
                        setCopiedSqlSchema(true);
                        showToast('✓ Seluruh skrip SQL skema disalin ke clipboard! Tempelkan di Supabase SQL Editor.');
                        setTimeout(() => setCopiedSqlSchema(false), 3000);
                      } catch {
                        handleDownloadSqlSchema();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    {copiedSqlSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSqlSchema ? 'SQL Tersalin!' : 'Salin SQL Skema'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSqlSchema}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh supabase_schema.sql</span>
                  </button>
                </div>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Token (Otomatis atau Ketik Manual)
                  </label>
                  <input
                    type="text"
                    value={newVoterToken}
                    onChange={(e) => setNewVoterToken(e.target.value.toUpperCase())}
                    placeholder="Otomatis di-generate sistem (atau ketik khusus)"
                    className="w-full p-2.5 text-xs border rounded-lg font-mono uppercase bg-amber-50/40 border-amber-200"
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

        {/* MODAL: INPUT & IMPORT DPT BERBENTUK TABEL (SPREADSHEET MODE) */}
        <TableImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          defaultPrefix={settings.tokenPrefix || "S"}
          onSaveVoters={(newVoters, replaceAll) => {
            importVoters(newVoters, replaceAll);
            setShowImportModal(false);
            if (replaceAll) {
              showToast(`✓ Sukses! DPT telah digantikan & disinkronkan dengan ${newVoters.length} pemilih baru.`);
            } else {
              showToast(`✓ Sukses! ${newVoters.length} pemilih berhasil disinkronkan ke dalam DPT.`);
            }
          }}
          existingTokens={tokens}
          onDownloadTemplate={handleDownloadCsvTemplate}
        />

        {/* MODAL: RESET DAFTAR PEMILIH DENGAN PILIHAN LENGKAP */}
        {showResetVotersModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                        resetVotersList();
                        setShowResetVotersModal(false);
                        showToast('✓ Berhasil! Seluruh DPT dan token telah dikosongkan.');
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
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
                        resetTokensVoteStatus();
                        setShowResetVotersModal(false);
                        showToast('✓ Status seluruh pemilih berhasil dikembalikan ke Belum Memilih.');
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
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
                        resetToDefaultSampleData();
                        setShowResetVotersModal(false);
                        showToast('✓ Data sampel default SMPN 50 Jakarta berhasil dimuat kembali.');
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Token Pemilih (Bisa Di-Custom Admin)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newToken = makeToken(editingVoter.classGroup, settings.tokenPrefix);
                        setEditingVoter({
                          ...editingVoter,
                          token: newToken
                        });
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Acak Token</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingVoter.token}
                    onChange={(e) => setEditingVoter({ ...editingVoter, token: e.target.value.trim().toUpperCase() })}
                    placeholder="Masukkan atau sesuaikan token..."
                    className="w-full p-2.5 text-xs font-mono font-bold border rounded-lg focus:ring-2 focus:ring-blue-600 uppercase bg-amber-50/50 border-amber-200"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Admin dapat mengetik manual token khusus atau klik 'Acak Token'.
                  </p>
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
                  onClick={() => {
                    setEditingVoter(null);
                    setOriginalEditingToken(null);
                  }}
                  className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingVoter.token.trim()) {
                      showToast('Token tidak boleh kosong.');
                      return;
                    }
                    const targetOrig = originalEditingToken || editingVoter.token;
                    // Check duplicate if token changed
                    if (editingVoter.token !== targetOrig && tokens.some((t) => t.token === editingVoter.token)) {
                      showToast(`Token "${editingVoter.token}" sudah digunakan oleh pemilih lain. Gunakan token unik.`);
                      return;
                    }
                    updateVoter(targetOrig, editingVoter);
                    setEditingVoter(null);
                    setOriginalEditingToken(null);
                    showToast('✓ Data pemilih dan token berhasil diperbarui.');
                  }}
                  className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH / EDIT TAHAPAN TIMELINE */}
        {showTimelineModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingTimelineId ? 'Edit Tahapan Pilkasis' : 'Tambah Tahapan Agenda Pilkasis'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Isi rincian hari, kegiatan, dan keterangan tahapan pemilihan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTimelineItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari & Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={timelineDayDate}
                    onChange={(e) => setTimelineDayDate(e.target.value)}
                    placeholder="Contoh: Senin, 21 Oktober 2024 atau 14 - 18 Oktober 2024"
                    className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format bebas: dapat berupa hari tunggal atau rentang tanggal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={timelineActivity}
                    onChange={(e) => setTimelineActivity(e.target.value)}
                    placeholder="Contoh: Pemungutan Suara E-Voting & Quick Count Real-Time"
                    className="w-full p-2.5 text-xs font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={timelineDescription}
                    onChange={(e) => setTimelineDescription(e.target.value)}
                    placeholder="Deskripsi rincian pelaksanaan, ketentuan peserta, atau catatan penting tahapan ini..."
                    className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Tahapan
                    </label>
                    <select
                      value={timelineStatus}
                      onChange={(e) => setTimelineStatus(e.target.value as TimelineStatus)}
                      className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="upcoming">Akan Datang</option>
                      <option value="ongoing">Sedang Berlangsung</option>
                      <option value="completed">Selesai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu Pelaksanaan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={timelineTime}
                      onChange={(e) => setTimelineTime(e.target.value)}
                      placeholder="Contoh: 07.30 - 14.00 WIB"
                      className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Tempat (Opsional)
                  </label>
                  <input
                    type="text"
                    value={timelineLocation}
                    onChange={(e) => setTimelineLocation(e.target.value)}
                    placeholder="Contoh: Ruang Komputer / Lapangan Utama"
                    className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTimelineModal(false)}
                    className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
                  >
                    {editingTimelineId ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINT MODAL KARTU TOKEN */}
        {showPrintModal && (
          <PrintTokenModal
            tokens={filteredTokens}
            onClose={() => setShowPrintModal(false)}
          />
        )}

        {/* PRINT MODAL SURAT SUARA RESMI A4 (3 PER LEMBAR) */}
        {showPrintBallotModal && (
          <PrintBallotModal
            tokens={tokens}
            onClose={() => setShowPrintBallotModal(false)}
          />
        )}

        {/* FLOATING TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-70 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
