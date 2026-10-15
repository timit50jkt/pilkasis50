import { CandidatePair, ElectionSettings, VoterToken, VoteRecord, TimelineItem } from '../types/election';

export const INITIAL_SETTINGS: ElectionSettings = {
  electionName: 'Pemilihan Ketua & Wakil Ketua OSIS',
  academicYear: '2024/2025',
  schoolName: 'SMP Negeri 50 Jakarta',
  schoolAddress: 'Jl. Cipinang Muara I No. 57, Jatinegara, Jakarta Timur',
  isOpen: true,
  totalRegisteredVoters: 94,
  adminPin: '5050',
  announcementText: 'Pemungutan suara berlangsung hingga pukul 14:00 WIB. Gunakan token unik Anda dengan bijak dan rahasia.',
  quickCountTitle: 'Quick Count Perhitungan Suara Pemilihan OSIS',
  quickCountSubtitle: 'Pantau perolehan suara resmi secara real-time, transparan, dan akurat.',
  votingTitle: 'Masuk dengan Token Pemilihan',
  votingSubtitle: 'Gunakan token 5 digit unik Anda (contoh: S7A01). Setiap token hanya berlaku satu kali coblos.',
  tokenPrefix: 'S',
  tokenLength: 5
};

export const CANDIDATE_PAIRS: CandidatePair[] = [
  {
    id: 1,
    number: '01',
    chairman: {
      name: 'Andra Pratama',
      class: 'Kelas VIII-A',
      role: 'Calon Ketua OSIS'
    },
    viceChairman: {
      name: 'Maya Lestari',
      class: 'Kelas VII-B',
      role: 'Calon Wakil Ketua OSIS'
    },
    tagline: 'Bersatu, Berprestasi & Berintegritas',
    posterImage: '/src/assets/images/paslon_1_smp50_1792047092011.jpg',
    color: {
      primary: '#1d4ed8', // blue-700
      accent: '#3b82f6',
      bgSoft: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af'
    },
    vision: 'Mewujudkan OSIS SMPN 50 Jakarta sebagai wadah pengembangan potensi siswa yang berkarakter Pancasila, berintegritas tinggi, kreatif, serta unggul dalam bidang akademik dan non-akademik di tingkat DKI Jakarta.',
    missions: [
      'Menumbuhkan ketakwaan dan toleransi beragama melalui kegiatan keagamaan teratur serta peringatan hari besar keagamaan.',
      'Mengembangkan minat dan bakat siswa lewat penguatan program ekstrakurikuler serta festival pekan seni dan olahraga (Porseni 50).',
      'Membangun budaya disiplin, literasi aktif 15 menit, dan kepedulian lingkungan sekolah (Gerakan Sekolah Hijau & Bebas Sampah Plastik).',
      'Menyediakan kotak aspirasi digital "Suara 50" yang transparan untuk menampung kritik dan saran seluruh warga sekolah.'
    ],
    workPrograms: [
      {
        title: 'Porseni & E-Sport Edukatif "Fifty Cup"',
        desc: 'Kompetisi tahunan cabang olahraga basket, futsal, tari tradisional, dan cerdas cermat antar kelas.'
      },
      {
        title: 'Gerakan Sahabat Peduli Siswa',
        desc: 'Program bimbingan konseling sebaya dan penggalangan bantuan sosial bagi siswa yang membutuhkan.'
      },
      {
        title: 'Green School SMPN 50',
        desc: 'Inisiatif bank sampah kelas dan pemeliharaan taman sekolah secara bergilir setiap Jumat pagi.'
      }
    ]
  },
  {
    id: 2,
    number: '02',
    chairman: {
      name: 'Rafi H.',
      class: 'Kelas VIII-C',
      role: 'Calon Ketua OSIS'
    },
    viceChairman: {
      name: 'Alya N.',
      class: 'Kelas VII-D',
      role: 'Calon Wakil Ketua OSIS'
    },
    tagline: 'Bersama Mewujudkan OSIS SMPN 50 yang Aktif, Inovatif & Berprestasi',
    posterImage: '/src/assets/images/paslon_2_smp50_1792047092389.jpg',
    color: {
      primary: '#059669', // emerald-600
      accent: '#10b981',
      bgSoft: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46'
    },
    vision: 'Menjadikan OSIS SMPN 50 Jakarta sebagai motor penggerak siswa yang adaptif dengan era digital, berjiwa wirausaha muda, berakhlak mulia, dan berdaya saing dengan semangat gotong royong.',
    missions: [
      'Memanfaatkan teknologi digital dalam publikasi kegiatan siswa melalui siniar (Podcast Siswa 50) dan majalah dinding digital interaktif.',
      'Meningkatkan keterampilan kepemimpinan (*Student Leadership Training*) untuk pengurus kelas dan perwakilan ekstrakurikuler.',
      'Menjalin kolaborasi produktif dengan OSIS SMP lain di Jakarta Timur untuk studi banding dan kegiatan sosial bersama.',
      'Menciptakan lingkungan sekolah yang ramah anak, bebas perundungan (*zero bullying*), dan penuh keakraban antar angkatan.'
    ],
    workPrograms: [
      {
        title: 'Podcast "Suara Rajawali 50"',
        desc: 'Kanal siniar mingguan membahas prestasi siswa, tips belajar, karya sastra, dan wawancara alumni inspiratif.'
      },
      {
        title: 'Peer Tutoring Club',
        desc: 'Kelompok belajar kolaboratif menjelang Asesmen Sumatif Akhir Semester dan bimbingan lomba OSN/FLS2N.'
      },
      {
        title: 'Kampanye Duta Anti-Bullying 50',
        desc: 'Pelatihan duta damai tiap kelas untuk mendeteksi dini konflik dan menciptakan suasana belajar yang nyaman.'
      }
    ]
  }
];

// Helper to generate realistic sample tokens with pre-cast realistic voting data
export function generateInitialTokensAndVotes(): { tokens: VoterToken[]; votes: VoteRecord[] } {
  const tokens: VoterToken[] = [];
  const votes: VoteRecord[] = [];

  const classes = [
    { name: '7A', category: 'Siswa' as const, count: 12 },
    { name: '7B', category: 'Siswa' as const, count: 12 },
    { name: '8A', category: 'Siswa' as const, count: 12 },
    { name: '8B', category: 'Siswa' as const, count: 12 },
    { name: '9A', category: 'Siswa' as const, count: 12 },
    { name: '9B', category: 'Siswa' as const, count: 12 },
    { name: 'Guru', category: 'Guru' as const, count: 10 },
    { name: 'TU', category: 'Tata Usaha' as const, count: 6 },
    { name: 'Tendik', category: 'Tendik' as const, count: 6 }
  ];

  let voteCounter = 1;
  const now = new Date();

  classes.forEach((c) => {
    for (let i = 1; i <= c.count; i++) {
      const padNum = String(i).padStart(2, '0');
      let tokenStr = '';
      if (c.category === 'Guru') {
        tokenStr = `G50${padNum}`;
      } else if (c.category === 'Tata Usaha') {
        tokenStr = `T50${padNum}`;
      } else if (c.category === 'Tendik') {
        tokenStr = `K50${padNum}`;
      } else {
        const cleanClass = c.name.replace(/[^A-Z0-9]/gi, '').slice(0, 2);
        tokenStr = `S${cleanClass}${padNum}`;
      }

      // Simulate roughly 60% of voters have cast their votes to show realistic quick count graph right away
      const isVoted = i <= Math.floor(c.count * 0.65);
      
      let usedAtStr: string | undefined = undefined;
      if (isVoted) {
        // Random time within the last 4 hours
        const minutesAgo = Math.floor(Math.random() * 240);
        const voteTime = new Date(now.getTime() - minutesAgo * 60000);
        usedAtStr = voteTime.toISOString();

        // Balanced realistic vote distribution (e.g. 52% vs 48%)
        const candidateId = Math.random() < 0.53 ? 1 : 2;

        votes.push({
          id: `vote-${voteCounter++}`,
          candidateId,
          voterCategory: c.category,
          classGroup: c.name,
          timestamp: usedAtStr
        });
      }

      let voterLabel = `Siswa/i ${c.name} Absen ${i}`;
      if (c.category === 'Guru') voterLabel = `Bapak/Ibu Guru #${i}`;
      else if (c.category === 'Tata Usaha') voterLabel = `Staf Tata Usaha #${i}`;
      else if (c.category === 'Tendik') voterLabel = `Tenaga Kependidikan #${i}`;

      tokens.push({
        token: tokenStr,
        voterName: voterLabel,
        classGroup: c.name,
        category: c.category,
        isUsed: isVoted,
        usedAt: usedAtStr
      });
    }
  });

  return { tokens, votes };
}

export const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: 'timeline-1',
    dayDate: 'Senin, 07 Oktober 2024',
    activity: 'Sosialisasi & Pengumuman Tahapan Pilkasis 2024/2025',
    description: 'Penyampaian tahapan pemilihan, kriteria calon ketua & wakil ketua OSIS saat upacara bendera, serta pembagian edaran ke seluruh kelas VII, VIII, dan IX.',
    status: 'completed',
    time: '07.00 - 08.00 WIB',
    location: 'Lapangan Upacara SMPN 50 Jakarta'
  },
  {
    id: 'timeline-2',
    dayDate: 'Rabu - Jumat, 09 - 11 Oktober 2024',
    activity: 'Pendaftaran & Pengambilan Formulir Bakal Calon',
    description: 'Pengambilan formulir pendaftaran, pengumpulan berkas portofolio, visi misi, surat persetujuan orang tua, serta surat rekomendasi wali kelas.',
    status: 'completed',
    time: '08.00 - 15.00 WIB',
    location: 'Ruang Sekretariat MPK SMPN 50'
  },
  {
    id: 'timeline-3',
    dayDate: 'Senin, 14 Oktober 2024',
    activity: 'Verifikasi Berkas, Tes Wawancara & Uji Kelayakan',
    description: 'Pemeriksaan keabsahan dokumen, wawancara kepemimpinan, komitmen kedisiplinan, dan uji kompetensi bersama Kepala Sekolah & Dewan Guru Pembina.',
    status: 'completed',
    time: '09.00 - 14.30 WIB',
    location: 'Ruang Rapat Guru'
  },
  {
    id: 'timeline-4',
    dayDate: 'Rabu, 16 Oktober 2024',
    activity: 'Rapat Pleno Penetapan Paslon & Pengundian Nomor Urut',
    description: 'Penetapan Pasangan Calon Resmi: Paslon 01 (Andra Pratama & Maya Lestari) dan Paslon 02 (Rafi H. & Alya N.) serta penandatanganan Pakta Integritas Kampanye Damai.',
    status: 'completed',
    time: '13.30 - 15.00 WIB',
    location: 'Aula Pertemuan Utama'
  },
  {
    id: 'timeline-5',
    dayDate: 'Kamis - Jumat, 17 - 18 Oktober 2024',
    activity: 'Masa Kampanye & Debat Terbuka Kandidat Paslon',
    description: 'Penyampaian visi misi dan program kerja unggulan di hadapan seluruh siswa, orasi bergilir ke ruang kelas, dan debat terbuka antar paslon.',
    status: 'completed',
    time: '07.30 - 11.30 WIB',
    location: 'Panggung Terbuka & Ruang Kelas'
  },
  {
    id: 'timeline-6',
    dayDate: 'Senin, 21 Oktober 2024',
    activity: 'Masa Tenang & Simulasi Teknis Bilik Suara E-Voting',
    description: 'Pembersihan atribut kampanye di lingkungan sekolah, pembagian token pemilih resmi ke wali kelas, serta uji beban server dan sistem Quick Count.',
    status: 'completed',
    time: '08.00 - 14.00 WIB',
    location: 'Laboratorium Komputer & Server MPK'
  },
  {
    id: 'timeline-7',
    dayDate: 'Selasa, 22 Oktober 2024',
    activity: 'Hari Pemungutan Suara (E-Voting) & Quick Count Real-Time',
    description: 'Pelaksanaan pencoblosan mandiri menggunakan token unik oleh seluruh siswa Kelas 7, 8, 9, Dewan Guru, dan Tenaga Kependidikan. Hasil rekapitulasi terpantau langsung secara live.',
    status: 'ongoing',
    time: '07.30 - 14.00 WIB',
    location: 'Bilik Suara Digital (Online / Lab Komputer)'
  },
  {
    id: 'timeline-8',
    dayDate: 'Rabu, 23 Oktober 2024',
    activity: 'Sidang Pleno Rekapitulasi Suara & Pengesahan Hasil Pilkasis',
    description: 'Penandatanganan Berita Acara Rekapitulasi Suara oleh Panitia MPK, Kepala Sekolah, dan Saksi masing-masing Paslon serta pengumuman resmi pemenang terpilih.',
    status: 'upcoming',
    time: '10.00 - 12.00 WIB',
    location: 'Ruang Multimedia SMPN 50'
  },
  {
    id: 'timeline-9',
    dayDate: 'Senin, 28 Oktober 2024',
    activity: 'Upacara Pelantikan & Serah Terima Jabatan Pengurus OSIS',
    description: 'Upacara resmi pelantikan Ketua & Wakil Ketua OSIS Terpilih Masa Bakti 2024/2025 bersamaan dengan Peringatan Hari Sumpah Pemuda.',
    status: 'upcoming',
    time: '07.00 - 08.30 WIB',
    location: 'Lapangan Upacara SMPN 50 Jakarta'
  }
];

