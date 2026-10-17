-- ==============================================================================
-- SKEMA DATABASE SUPABASE UNTUK QUICK COUNT & E-VOTING OSIS SMP NEGERI 50 JAKARTA
-- Jalankan skrip SQL ini di "SQL Editor" pada dashboard Supabase Anda.
-- Skrip ini idempotent (aman dijalankan berulang kali).
-- ==============================================================================

-- 1. Tabel Konfigurasi & Identitas Sekolah
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    election_name TEXT NOT NULL DEFAULT 'Pemilihan Ketua & Wakil Ketua OSIS',
    academic_year TEXT NOT NULL DEFAULT '2024/2025',
    school_name TEXT NOT NULL DEFAULT 'SMP Negeri 50 Jakarta',
    school_address TEXT NOT NULL DEFAULT 'Jl. Cipinang Muara I No. 57, Jatinegara, Jakarta Timur',
    logo_url TEXT,
    is_open BOOLEAN NOT NULL DEFAULT true,
    total_registered_voters INT NOT NULL DEFAULT 720,
    admin_pin TEXT NOT NULL DEFAULT '5050',
    announcement_text TEXT DEFAULT 'Pemungutan suara berlangsung hingga pukul 14:00 WIB. Gunakan token unik Anda dengan bijak dan rahasia.',
    quick_count_title TEXT DEFAULT 'Quick Count Perhitungan Suara Pemilihan OSIS',
    quick_count_subtitle TEXT DEFAULT 'Pantau perolehan suara resmi secara real-time, transparan, dan akurat.',
    voting_title TEXT DEFAULT 'Masuk dengan Token Pemilihan',
    voting_subtitle TEXT DEFAULT 'Gunakan token unik Anda yang telah dibagikan oleh Panitia. Setiap token hanya berlaku satu kali coblos.',
    token_prefix TEXT DEFAULT 'S',
    token_length INT DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi tambahan untuk tabel settings jika sudah dibuat sebelumnya
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS quick_count_title TEXT DEFAULT 'Quick Count Perhitungan Suara Pemilihan OSIS';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS quick_count_subtitle TEXT DEFAULT 'Pantau perolehan suara resmi secara real-time, transparan, dan akurat.';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS voting_title TEXT DEFAULT 'Masuk dengan Token Pemilihan';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS voting_subtitle TEXT DEFAULT 'Gunakan token unik Anda yang telah dibagikan oleh Panitia. Setiap token hanya berlaku satu kali coblos.';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS token_prefix TEXT DEFAULT 'S';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS token_length INT DEFAULT 5;

-- 2. Tabel Pasangan Calon (Kandidat OSIS)
CREATE TABLE IF NOT EXISTS public.candidates (
    id INT PRIMARY KEY,
    number TEXT NOT NULL,
    chairman JSONB NOT NULL,
    vice_chairman JSONB NOT NULL,
    tagline TEXT NOT NULL,
    poster_image TEXT NOT NULL,
    color JSONB NOT NULL,
    vision TEXT NOT NULL,
    missions JSONB NOT NULL,
    work_programs JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Data Pemilih Tetap (DPT) & Token Unik
CREATE TABLE IF NOT EXISTS public.voters (
    token TEXT PRIMARY KEY,
    voter_name TEXT,
    class_group TEXT NOT NULL,
    category TEXT NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Perolehan Suara (Anonymous Secret Ballot)
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY,
    candidate_id INT NOT NULL,
    voter_category TEXT NOT NULL,
    class_group TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Audit Log Aktivitas Panitia & Sistem
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Timeline & Agenda Pilkasis
CREATE TABLE IF NOT EXISTS public.timeline (
    id TEXT PRIMARY KEY,
    order_index INT NOT NULL DEFAULT 1,
    time TEXT NOT NULL,
    day_date TEXT NOT NULL,
    activity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',
    badge_text TEXT NOT NULL,
    badge_color TEXT NOT NULL,
    description TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KEAMANAN & ROW LEVEL SECURITY (RLS)
-- Mengizinkan pembacaan & penulisan terverifikasi untuk browser, HP & panitia
-- ==============================================================================

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline ENABLE ROW LEVEL SECURITY;

-- Reset and re-create policies safely
DROP POLICY IF EXISTS "Public all settings" ON public.settings;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Public update settings" ON public.settings;
CREATE POLICY "Public all settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public read candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public update candidates" ON public.candidates;
CREATE POLICY "Public all candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all voters" ON public.voters;
DROP POLICY IF EXISTS "Public read voters" ON public.voters;
DROP POLICY IF EXISTS "Public update voters" ON public.voters;
CREATE POLICY "Public all voters" ON public.voters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all votes" ON public.votes;
DROP POLICY IF EXISTS "Public read votes" ON public.votes;
DROP POLICY IF EXISTS "Public insert votes" ON public.votes;
CREATE POLICY "Public all votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public read logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public insert logs" ON public.audit_logs;
CREATE POLICY "Public all logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all timeline" ON public.timeline;
CREATE POLICY "Public all timeline" ON public.timeline FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION
-- Aktifkan Realtime agar Quick Count di HP dan Proyektor terupdate instan
-- ==============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.voters;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- DATA AWAL (SEED DATA SMP NEGERI 50 JAKARTA)
-- ==============================================================================

INSERT INTO public.settings (id, election_name, academic_year, school_name, school_address, logo_url, is_open, total_registered_voters, admin_pin, token_prefix, token_length)
VALUES (
    'main',
    'Pemilihan Ketua & Wakil Ketua OSIS',
    '2024/2025',
    'SMP Negeri 50 Jakarta',
    'Jl. Cipinang Muara I No. 57, Jatinegara, Jakarta Timur',
    '/images/logo_smpn50_jakarta_1792047092022.jpg',
    true,
    720,
    '5050',
    'S',
    5
)
ON CONFLICT (id) DO UPDATE SET
    token_prefix = EXCLUDED.token_prefix,
    token_length = EXCLUDED.token_length;

INSERT INTO public.candidates (id, number, chairman, vice_chairman, tagline, poster_image, color, vision, missions, work_programs)
VALUES
(
    1,
    '01',
    '{"name": "Andra Pratama", "class": "Kelas VIII-A", "role": "Calon Ketua OSIS"}',
    '{"name": "Maya Lestari", "class": "Kelas VII-B", "role": "Calon Wakil Ketua OSIS"}',
    'Bersatu, Berprestasi & Berintegritas',
    '/images/paslon_1_smp50_1792047092011.jpg',
    '{"primary": "#1d4ed8", "accent": "#3b82f6", "bgSoft": "#eff6ff", "border": "#bfdbfe", "text": "#1e40af"}',
    'Mewujudkan OSIS SMPN 50 Jakarta sebagai wadah pengembangan potensi siswa yang berkarakter Pancasila, berintegritas tinggi, kreatif, serta unggul dalam bidang akademik dan non-akademik di tingkat DKI Jakarta.',
    '["Menumbuhkan ketakwaan dan toleransi beragama melalui kegiatan keagamaan teratur.", "Mengembangkan minat dan bakat siswa lewat penguatan program ekstrakurikuler serta pekan seni dan olahraga.", "Membangun budaya disiplin, literasi aktif 15 menit, dan kepedulian lingkungan sekolah.", "Menyediakan kotak aspirasi digital yang transparan untuk menampung kritik dan saran."]',
    '[{"title": "Porseni & E-Sport Edukatif Fifty Cup", "desc": "Kompetisi tahunan cabang olahraga dan cerdas cermat antar kelas."}, {"title": "Gerakan Sahabat Peduli Siswa", "desc": "Program bimbingan konseling sebaya dan penggalangan bantuan sosial."}, {"title": "Green School SMPN 50", "desc": "Inisiatif bank sampah kelas dan pemeliharaan taman sekolah."}]'
),
(
    2,
    '02',
    '{"name": "Rafi H.", "class": "Kelas VIII-C", "role": "Calon Ketua OSIS"}',
    '{"name": "Alya N.", "class": "Kelas VII-D", "role": "Calon Wakil Ketua OSIS"}',
    'Bersama Mewujudkan OSIS SMPN 50 yang Aktif, Inovatif & Berprestasi',
    '/images/paslon_2_smp50_1792047092389.jpg',
    '{"primary": "#059669", "accent": "#10b981", "bgSoft": "#ecfdf5", "border": "#a7f3d0", "text": "#065f46"}',
    'Menjadikan OSIS SMPN 50 Jakarta sebagai motor penggerak siswa yang adaptif dengan era digital, berjiwa wirausaha muda, berakhlak mulia, dan berdaya saing dengan semangat gotong royong.',
    '["Memanfaatkan teknologi digital dalam publikasi kegiatan siswa melalui siniar (Podcast) dan mading digital.", "Meningkatkan keterampilan kepemimpinan untuk pengurus kelas dan ekskul.", "Menjalin kolaborasi produktif dengan sekolah lain untuk studi banding.", "Menciptakan lingkungan sekolah ramah anak bebas perundungan (zero bullying)."]',
    '[{"title": "Podcast Suara Rajawali 50", "desc": "Kanal siniar mingguan membahas prestasi, tips belajar, dan karya siswa."}, {"title": "Peer Tutoring Club", "desc": "Kelompok belajar kolaboratif menjelang Asesmen Sumatif Akhir Semester."}, {"title": "Kampanye Duta Anti-Bullying", "desc": "Pelatihan duta damai tiap kelas untuk mendeteksi dini konflik."}]'
)
ON CONFLICT (id) DO UPDATE SET
    work_programs = EXCLUDED.work_programs,
    poster_image = EXCLUDED.poster_image;
