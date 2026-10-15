import { CandidatePair, ElectionSettings, VoterToken, VoteRecord } from '../types/election';

export const INITIAL_SETTINGS: ElectionSettings = {
  electionName: 'Pemilihan Ketua & Wakil Ketua OSIS',
  academicYear: '2024/2025',
  schoolName: 'SMP Negeri 50 Jakarta',
  schoolAddress: 'Jl. Cipinang Muara I No. 57, Jatinegara, Jakarta Timur',
  isOpen: true,
  totalRegisteredVoters: 720,
  adminPin: '5050',
  announcementText: 'Pemungutan suara berlangsung hingga pukul 14:00 WIB. Gunakan token unik Anda dengan bijak dan rahasia.'
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
    { name: '7A', category: 'Kelas 7' as const, count: 12 },
    { name: '7B', category: 'Kelas 7' as const, count: 12 },
    { name: '7C', category: 'Kelas 7' as const, count: 10 },
    { name: '8A', category: 'Kelas 8' as const, count: 12 },
    { name: '8B', category: 'Kelas 8' as const, count: 12 },
    { name: '8C', category: 'Kelas 8' as const, count: 10 },
    { name: '9A', category: 'Kelas 9' as const, count: 12 },
    { name: '9B', category: 'Kelas 9' as const, count: 12 },
    { name: '9C', category: 'Kelas 9' as const, count: 10 },
    { name: 'GURU', category: 'Guru & Staf' as const, count: 12 }
  ];

  let voteCounter = 1;
  const now = new Date();

  classes.forEach((c) => {
    for (let i = 1; i <= c.count; i++) {
      const padNum = String(i).padStart(2, '0');
      const tokenStr = `SMP50-${c.name}-${padNum}${Math.floor(100 + Math.random() * 900)}`;

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

      tokens.push({
        token: tokenStr,
        voterName: c.name === 'GURU' ? `Bapak/Ibu Guru & Staf ${i}` : `Siswa/i ${c.name} Absen ${i}`,
        classGroup: c.name,
        category: c.category,
        isUsed: isVoted,
        usedAt: usedAtStr
      });
    }
  });

  return { tokens, votes };
}
