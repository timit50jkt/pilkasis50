import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { TimelineItem, TimelineStatus } from '../types/election';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  PlayCircle,
  Clock3,
  Vote,
  BarChart3,
  Printer,
  SlidersHorizontal,
  Table as TableIcon,
  GitCommit,
  Info
} from 'lucide-react';

interface TimelineViewProps {
  onGoToVoting: () => void;
  onGoToQuickCount: () => void;
  onOpenAdmin?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  onGoToVoting,
  onGoToQuickCount,
  onOpenAdmin
}) => {
  const { timeline, settings } = useElection();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Normalize each item's status to strictly 'completed' | 'ongoing' | 'upcoming'
  const normalizedTimeline = useMemo(() => {
    return timeline.map((item) => {
      const s = String(item.status || '').trim().toLowerCase();
      let status: TimelineStatus = 'upcoming';
      if (s === 'completed' || s === 'selesai') {
        status = 'completed';
      } else if (s === 'ongoing' || s === 'sedang berlangsung' || s === 'berlangsung') {
        status = 'ongoing';
      } else {
        status = 'upcoming';
      }
      return { ...item, status };
    });
  }, [timeline]);

  // Guaranteed synchronized counts across Selesai + Sedang Berlangsung + Akan Datang === Total
  const totalCount = normalizedTimeline.length;
  const completedCount = normalizedTimeline.filter((t) => t.status === 'completed').length;
  const ongoingCount = normalizedTimeline.filter((t) => t.status === 'ongoing').length;
  const upcomingCount = normalizedTimeline.filter((t) => t.status === 'upcoming').length;
  const activeItem = normalizedTimeline.find((t) => t.status === 'ongoing');

  // Filter items
  const filteredTimeline = normalizedTimeline.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const getStatusBadge = (status: TimelineStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PlayCircle className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Sedang Berlangsung</span>
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Akan Datang</span>
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wide">
              <Calendar className="w-4 h-4" />
              <span>JADWAL RESMI PEMILIHAN OSIS & MPK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Timeline & Tahapan Proses Pilkasis
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Agenda resmi seluruh rangkaian pelaksanaan Pemilihan Ketua dan Wakil Ketua OSIS {settings.schoolName} Periode {settings.academicYear}. Seluruh tahapan dipantau secara terbuka, transparan, dan akuntabel.
            </p>
          </div>

          {/* Quick Metrics: All 4 synchronized boxes (Total = Selesai + Berlangsung + Akan Datang) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[78px]">
              <div className="text-xl font-bold text-slate-800 tabular-nums">
                {totalCount}
              </div>
              <div className="text-[11px] font-medium text-slate-500">Total Tahapan</div>
            </div>
            <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center min-w-[78px]">
              <div className="text-xl font-bold text-emerald-700 tabular-nums">
                {completedCount}
              </div>
              <div className="text-[11px] font-medium text-emerald-700">Selesai</div>
            </div>
            <div className="px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[78px]">
              <div className="text-xl font-bold text-blue-700 tabular-nums">
                {ongoingCount}
              </div>
              <div className="text-[11px] font-medium text-blue-700">Berlangsung</div>
            </div>
            <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[78px]">
              <div className="text-xl font-bold text-amber-700 tabular-nums">
                {upcomingCount}
              </div>
              <div className="text-[11px] font-medium text-amber-700">Akan Datang</div>
            </div>
          </div>
        </div>

        {/* Highlight for Active Stage (if any) */}
        {activeItem && (
          <div className="mt-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                <PlayCircle className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-900">
                    TAHAPAN AKTIF HARI INI
                  </span>
                  <span className="text-xs text-blue-700 font-medium">
                    · {activeItem.dayDate}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeItem.activity}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {activeItem.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onGoToVoting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <Vote className="w-4 h-4" />
                <span>Buka Bilik Suara</span>
              </button>
              <button
                onClick={onGoToQuickCount}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Lihat Hasil</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Semua Tahapan ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('ongoing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'ongoing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Sedang Berlangsung ({ongoingCount})
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'upcoming'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Akan Datang ({upcomingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Alur Kronologis"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Alur</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Lengkap"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            title="Cetak Jadwal Agenda"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-xs transition-colors"
              title="Atur timeline di Panel Admin"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Kelola Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTimeline.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Tidak ada tahapan dengan filter ini
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Silakan pilih filter lain atau klik tombol "Semua Tahapan" untuk melihat jadwal lengkap.
          </p>
          <button
            onClick={() => setFilterStatus('all')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Tampilkan Semua Tahapan
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* VIEW 1: CHRONOLOGICAL VERTICAL TIMELINE */
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {filteredTimeline.map((item, index) => {
            const isOngoing = item.status === 'ongoing';
            const isCompleted = item.status === 'completed';

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Dot / Step */}
                <div
                  className={`absolute -left-6 sm:-left-10 top-5 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform ${
                    isOngoing
                      ? 'bg-blue-600 border-white text-white shadow-md ring-4 ring-blue-100 scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 border-white text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                  ) : (
                    <span className="text-[11px] font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Timeline Card */}
                <div
                  className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs hover:shadow-md ${
                    isOngoing
                      ? 'border-blue-300 ring-2 ring-blue-50 bg-gradient-to-br from-white to-blue-50/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.dayDate}</span>
                      </div>
                      {item.time && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>

                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  {/* Activity & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {item.activity}
                    </h3>
                    <div className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Keterangan Pelaksanaan</span>
                      </div>
                      <p className="whitespace-pre-line text-slate-700">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Contextual actions for ongoing stage */}
                  {isOngoing && (
                    <div className="mt-4 pt-3 border-t border-blue-100 flex items-center gap-2">
                      <button
                        onClick={onGoToVoting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>Buka Bilik Suara Sekarang</span>
                      </button>
                      <button
                        onClick={onGoToQuickCount}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lihat Perolehan Suara</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: INSTITUTIONAL AGENDA TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tabel Rincian Jadwal & Kegiatan Pilkasis
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen jadwal tahapan resmi Panitia Pemilihan OSIS & MPK {settings.schoolName}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total {filteredTimeline.length} Kegiatan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-48 whitespace-nowrap">Hari & Tanggal</th>
                  <th className="py-3 px-4 w-64">Kegiatan</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTimeline.map((item, index) => {
                  const isOngoing = item.status === 'ongoing';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOngoing ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5 text-center font-bold text-slate-500 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.dayDate}</span>
                        </div>
                        {item.time && (
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-normal">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.activity}
                        {item.location && (
                          <div className="text-[11px] text-slate-500 mt-0.5 font-normal flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed text-xs">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Institutional Note Card */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800">Catatan Panitia MPK:</span> Jadwal dan tahapan kegiatan dapat disesuaikan sewaktu-waktu oleh Panitia dengan persetujuan Pembina OSIS & Kepala Sekolah. Untuk perubahan data jadwal, Panitia dapat mengaturnya melalui menu <span className="font-semibold text-blue-700">Panitia MPK → Tab Timeline & Agenda Pilkasis</span>.
        </div>
      </div>
    </div>
  );
};
