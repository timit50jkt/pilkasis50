import React, { useState, useRef } from 'react';
import { useElection } from '../context/ElectionContext';
import { CandidatePair, VoterToken, VoterCategory } from '../types/election';
import { PrintTokenModal } from './PrintTokenModal';
import {
  ShieldCheck,
  Lock,
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
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText
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
    updateSettings,
    connectSupabase,
    disconnectSupabase
  } = useElection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Tabs
  const [adminTab, setAdminTab] = useState<'paslon' | 'voters' | 'school' | 'control' | 'supabase'>('paslon');

  // Candidate editor state
  const [editingCandidateId, setEditingCandidateId] = useState<number>(candidates[0]?.id || 1);
  const activeEditingCandidate = candidates.find((c) => c.id === editingCandidateId) || candidates[0];
  const [candidateForm, setCandidateForm] = useState<CandidatePair | null>(null);
  const [candidateSaveMsg, setCandidateSaveMsg] = useState<string | null>(null);

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
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importClass, setImportClass] = useState('7A');
  const [importCategory, setImportCategory] = useState<VoterCategory>('Kelas 7');

  // New voter form
  const [newVoterName, setNewVoterName] = useState('');
  const [newVoterClass, setNewVoterClass] = useState('7A');
  const [newVoterCategory, setNewVoterCategory] = useState<VoterCategory>('Kelas 7');
  const [newVoterToken, setNewVoterToken] = useState('');

  // School identity state
  const [schoolForm, setSchoolForm] = useState({
    schoolName: settings.schoolName,
    schoolAddress: settings.schoolAddress,
    academicYear: settings.academicYear,
    electionName: settings.electionName,
    logoUrl: settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg',
    adminPin: settings.adminPin,
    announcementText: settings.announcementText || ''
  });
  const [schoolSaveMsg, setSchoolSaveMsg] = useState<string | null>(null);

  // Supabase connection state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(settings.supabaseAnonKey || '');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // PIN Unlock Screen
  if (!isAuthenticated) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (pinInput === settings.adminPin || pinInput === '5050') {
        setIsAuthenticated(true);
        setPinError(null);
      } else {
        setPinError(`PIN Panitia salah. Harap coba lagi (PIN saat ini: ${settings.adminPin}).`);
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
            Akses pengaturan profil paslon, data DPT, identitas sekolah, dan database Supabase untuk Panitia MPK {settings.schoolName}.
          </p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <label htmlFor="adminPinInput" className="block text-xs font-semibold text-slate-700 mb-1">
                MASUKKAN PIN PANITIA
              </label>
              <input
                id="adminPinInput"
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder={`PIN Default: ${settings.adminPin}`}
                className="w-full px-3 py-2.5 text-center text-lg tracking-widest font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                autoFocus
              />
              <span className="text-[11px] text-slate-400 mt-1 block text-center">
                PIN Bawaan: <strong>{settings.adminPin}</strong>
              </span>
            </div>

            {pinError && (
              <div className="text-xs text-rose-600 font-medium text-center">
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

  // Handle Photo Upload via FileReader (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidateForm) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCandidateForm({
          ...candidateForm,
          posterImage: reader.result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Upload via FileReader (Base64)
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
        setSchoolForm((prev) => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Candidate Changes
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm) return;

    updateCandidate(candidateForm);
    setCandidateSaveMsg(`Perubahan Paslon No. ${candidateForm.number} berhasil disimpan!`);
    setTimeout(() => setCandidateSaveMsg(null), 3000);
  };

  // Save School Settings
  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      schoolName: schoolForm.schoolName,
      schoolAddress: schoolForm.schoolAddress,
      academicYear: schoolForm.academicYear,
      electionName: schoolForm.electionName,
      logoUrl: schoolForm.logoUrl,
      adminPin: schoolForm.adminPin,
      announcementText: schoolForm.announcementText
    });
    setSchoolSaveMsg('Informasi sekolah dan logo berhasil diperbarui!');
    setTimeout(() => setSchoolSaveMsg(null), 3000);
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

  // Handle Manual Add Voter
  const handleAddSingleVoter = (e: React.FormEvent) => {
    e.preventDefault();
    const token = newVoterToken.trim().toUpperCase() || `SMP50-${newVoterClass.trim().toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    addVoter({
      token,
      voterName: newVoterName.trim() || `${newVoterCategory} ${newVoterClass}`,
      classGroup: newVoterClass.trim().toUpperCase(),
      category: newVoterCategory,
      isUsed: false
    });

    setNewVoterName('');
    setNewVoterToken('');
    setShowAddVoterModal(false);
  };

  // Handle Bulk Import
  const handleProcessImport = () => {
    const lines = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const newVoters: VoterToken[] = lines.map((name, idx) => {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      return {
        token: `SMP50-${importClass.toUpperCase()}-${randomCode}`,
        voterName: name,
        classGroup: importClass.toUpperCase(),
        category: importCategory,
        isUsed: false
      };
    });

    importVoters(newVoters);
    setImportText('');
    setShowImportModal(false);
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

  // Download CSV
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
                    Supabase Live
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Penyimpanan Lokal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {settings.schoolName} · Tahun Ajaran {settings.academicYear}
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
            <span>Identitas Sekolah & Logo</span>
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
            <span>Kendali Pemungutan</span>
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
            {/* Candidate Selector */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Pilih Pasangan Calon yang Diedit:</span>
              <div className="flex items-center gap-2">
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
                      onChange={handlePhotoUpload}
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

              {/* Work Programs Editor */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Program Kerja Unggulan Paslon No. {candidateForm.number}
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setCandidateForm({
                        ...candidateForm,
                        workPrograms: [
                          ...candidateForm.workPrograms,
                          { title: 'Program Kerja Baru', desc: 'Deskripsi program kerja...' }
                        ]
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Program</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {candidateForm.workPrograms.map((prog, pIdx) => (
                    <div key={pIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={prog.title}
                          onChange={(e) => {
                            const updated = [...candidateForm.workPrograms];
                            updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                            setCandidateForm({ ...candidateForm, workPrograms: updated });
                          }}
                          placeholder="Nama Program Kerja"
                          className="flex-1 p-1.5 text-xs font-bold border rounded-md bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = candidateForm.workPrograms.filter((_, idx) => idx !== pIdx);
                            setCandidateForm({ ...candidateForm, workPrograms: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={prog.desc}
                        onChange={(e) => {
                          const updated = [...candidateForm.workPrograms];
                          updated[pIdx] = { ...updated[pIdx], desc: e.target.value };
                          setCandidateForm({ ...candidateForm, workPrograms: updated });
                        }}
                        placeholder="Deskripsi singkat program kerja..."
                        className="w-full p-2 text-xs border rounded-md bg-white"
                      />
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

        {/* TAB 2: DATA PEMILIH (DPT & TOKEN) */}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Daftar Nama Siswa</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu Token ({filteredTokens.length})</span>
                </button>
              </div>

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
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama siswa / token / kelas..."
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
                <option value="unused">Belum Digunakan</option>
                <option value="used">Sudah Digunakan</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Semua Kategori</option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
                <option value="Guru & Staf">Guru & Staf</option>
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
                    <th className="py-2.5 px-3">Nama Siswa / Pemilih</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Status</th>
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
                          <td className="py-2 px-3 text-slate-600">{t.category}</td>
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
              <span>Total {filteredTokens.length} pemilih ditampilkan</span>
              <span>
                {tokens.filter((t) => t.isUsed).length} Sudah Coblos · {tokens.filter((t) => !t.isUsed).length} Belum Coblos
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: IDENTITAS SEKOLAH & LOGO */}
        {adminTab === 'school' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {schoolSaveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{schoolSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchoolSettings} className="space-y-6">
              {/* Logo Settings */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Logo Resmi Sekolah
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

                    <div className="text-[11px] text-slate-500">Atau gunakan URL Logo:</div>
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
                  Informasi Sekolah & Periode
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Keamanan Panitia
                    </label>
                    <input
                      type="text"
                      value={schoolForm.adminPin}
                      onChange={(e) => setSchoolForm({ ...schoolForm, adminPin: e.target.value })}
                      className="w-full p-2.5 text-xs font-mono font-bold border rounded-lg"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      PIN ini digunakan untuk mengakses panel admin ini.
                    </span>
                  </div>
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
            </form>
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

            {/* Reset */}
            <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Area Riset & Pengosongan Data</span>
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
                  Kosongkan Kotak Suara (Reset ke 0)
                </button>
                <button
                  onClick={() => {
                    if (confirm('Kembalikan ke data sampel bawaan SMPN 50 Jakarta?')) {
                      resetToDefaultSampleData();
                    }
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Muat Ulang Data Sampel Default
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPABASE DATABASE & DEPLOYMENT */}
        {adminTab === 'supabase' && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Status box */}
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

            {/* Supabase Configuration Form */}
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

            {/* SQL Migration Script & Deployment Guide */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    1. Skema SQL Supabase
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

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  2. Panduan Deploy ke GitHub & Vercel
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Inisialisasi Git & Push ke GitHub:</strong> Jalankan <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">git add . && git commit -m "OSIS Quick Count" && git push origin main</code>.
                  </li>
                  <li>
                    <strong>Import di Vercel:</strong> Buka <em>vercel.com</em> &rarr; <em>Add New Project</em> &rarr; Pilih repositori GitHub Anda.
                  </li>
                  <li>
                    <strong>Environment Variables di Vercel:</strong> Pada tab <em>Settings &rarr; Environment Variables</em>, tambahkan:
                    <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                      VITE_SUPABASE_URL = (URL Supabase Anda)<br />
                      VITE_SUPABASE_ANON_KEY = (Anon Key Supabase Anda)
                    </div>
                  </li>
                  <li>
                    <strong>Deploy:</strong> Klik <em>Deploy</em>. Konfigurasi <code className="bg-white px-1 font-mono">vercel.json</code> sudah otomatis disertakan sehingga SPA routing berjalan sempurna!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Tambah 1 Pemilih Baru */}
        {showAddVoterModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Data Pemilih Baru
              </h3>

              <form onSubmit={handleAddSingleVoter} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Siswa / Guru
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
                      Kelas / Rombel
                    </label>
                    <input
                      type="text"
                      value={newVoterClass}
                      onChange={(e) => setNewVoterClass(e.target.value.toUpperCase())}
                      placeholder="7A / 8B / GURU"
                      className="w-full p-2 text-xs border rounded-lg uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={newVoterCategory}
                      onChange={(e) => setNewVoterCategory(e.target.value as VoterCategory)}
                      className="w-full p-2 text-xs border rounded-lg"
                    >
                      <option value="Kelas 7">Kelas 7</option>
                      <option value="Kelas 8">Kelas 8</option>
                      <option value="Kelas 9">Kelas 9</option>
                      <option value="Guru & Staf">Guru & Staf</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kode Token (Opsional, kosongkan untuk buat otomatis)
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

        {/* MODAL: Import DPT Massal */}
        {showImportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Import Daftar Siswa Massal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin dan tempel daftar nama siswa (1 baris per siswa). Token akan dibuatkan otomatis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kelas / Rombel
                  </label>
                  <input
                    type="text"
                    value={importClass}
                    onChange={(e) => setImportClass(e.target.value.toUpperCase())}
                    placeholder="Contoh: 7B"
                    className="w-full p-2 text-xs border rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value as VoterCategory)}
                    className="w-full p-2 text-xs border rounded-lg"
                  >
                    <option value="Kelas 7">Kelas 7</option>
                    <option value="Kelas 8">Kelas 8</option>
                    <option value="Kelas 9">Kelas 9</option>
                    <option value="Guru & Staf">Guru & Staf</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daftar Nama Siswa (1 Nama per Baris)
                </label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Ahmad Fauzan&#10;Bunga Lestari&#10;Dimas Anggara&#10;Eka Novita..."
                  className="w-full p-2 text-xs border rounded-lg font-sans"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={!importText.trim()}
                  className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold"
                >
                  Proses & Buat Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Edit Single Voter */}
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
                      Kelas
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
                      Kategori
                    </label>
                    <select
                      value={editingVoter.category}
                      onChange={(e) => setEditingVoter({ ...editingVoter, category: e.target.value as VoterCategory })}
                      className="w-full p-2 text-xs border rounded-lg"
                    >
                      <option value="Kelas 7">Kelas 7</option>
                      <option value="Kelas 8">Kelas 8</option>
                      <option value="Kelas 9">Kelas 9</option>
                      <option value="Guru & Staf">Guru & Staf</option>
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

        {/* Print Modal */}
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
