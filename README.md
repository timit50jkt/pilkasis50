# Quick Count & E-Voting Pemilihan OSIS SMP Negeri 50 Jakarta

Aplikasi Web modern siap pakai untuk **Quick Count Real-Time** dan **E-Voting Pemilihan Ketua & Wakil Ketua OSIS** dengan otentikasi token unik, panel admin Panitia MPK, dan integrasi database **Supabase** serta konfigurasi siap deploy ke **GitHub & Vercel**.

---

## 🚀 Fitur Utama

1. **Quick Count Real-Time Otomatis:**
   - Perolehan suara per kandidat dengan persentase dan bar animasi halus.
   - Distribusi perolehan suara secara komparatif.
   - Rincian perolehan suara per angkatan (Kelas 7, Kelas 8, Kelas 9, Guru & Staf) dan tabel per kelas.
   - Sinkronisasi otomatis antar tab browser (*BroadcastChannel*) dan cloud realtime (*Supabase Realtime*).

2. **Bilik Suara (E-Voting) Token Unik:**
   - Sistem login token unik (1 Token = 1 Hak Suara Sah, otomatis hangus setelah digunakan).
   - Surat suara digital resmi dengan foto paslon dan visi misi.
   - Dialog konfirmasi pencoblosan & Bukti Tanda Terima Digital (E-Ballot).
   - Menjaga kerahasiaan pilihan (LUBER JURDIL).

3. **Panel Admin Panitia MPK (PIN: 5050):**
   - **Atur Paslon:** Edit foto (upload file / URL), nama ketua, nama wakil, kelas, tagline, visi, misi, dan program kerja unggulan.
   - **Atur Data Pemilih (DPT):** Tambah pemilih, edit nama/kelas/status token, hapus pemilih, import daftar nama siswa secara massal, salin token aktif, dan cetak kartu token.
   - **Atur Identitas Sekolah:** Ganti logo sekolah, nama sekolah, alamat, tahun ajaran, dan ganti PIN Panitia.
   - **Kendali Pemungutan:** Buka/Tutup pemungutan suara, simulator suara masuk, reset kotak suara, dan ekspor CSV berita acara.
   - **Mode Proyektor Aula:** Tampilan layar penuh kontras tinggi untuk diproyeksikan di panggung / aula sekolah.

---

## 🗄️ Panduan Menyiapkan Database Supabase

1. Buka [Supabase Dashboard](https://supabase.com) dan buat Project baru (misal: `osis-smpn50`).
2. Masuk ke menu **SQL Editor** di sidebar kiri.
3. Buka file `supabase_schema.sql` yang ada di repositori ini, salin seluruh isinya, lalu tempelkan ke SQL Editor Supabase dan klik **Run**.
4. Skema database (tabel `settings`, `candidates`, `voters`, `votes`, `audit_logs`) beserta RLS dan Realtime replication akan otomatis aktif.
5. Salin kredensial API dari **Project Settings &rarr; API**:
   - `Project URL`
   - `anon / public API Key`
6. Masukkan URL dan Anon Key tersebut di panel **Panitia MPK &rarr; Supabase & Deploy** pada web app, atau set di file `.env`.

---

## 🌐 Panduan Deploy ke GitHub & Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Inisialisasi Quick Count OSIS SMPN 50 Jakarta"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

### 2. Deploy ke Vercel
1. Buka [Vercel](https://vercel.com) &rarr; klik **Add New...** &rarr; **Project**.
2. Pilih repositori GitHub Anda.
3. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
4. Klik **Deploy**.
5. File `vercel.json` sudah tersedia di dalam repositori untuk menangani routing SPA (Single Page Application) secara otomatis tanpa error 404!

---

## 🔒 Akses Default Panitia
- **Default PIN Panitia:** `5050` (Dapat diubah kapan saja di Panel Admin &rarr; Identitas Sekolah & Logo).
