Berikut adalah **Spesifikasi Teknis Final dan Lengkap** untuk refaktor sistem HRIS. Dokumen ini dirancang sebagai *single source of truth* (sumber kebenaran tunggal) bagi tim pengembang. Dokumen ini **bukan roadmap**, melainkan spesifikasi keadaan akhir (*target state*) yang harus dicapai, lengkap dengan aturan migrasi untuk memastikan workflow yang ada tidak rusak.

---

# SPESIFIKASI TEKNIS FINAL: REFAKTOR KONFIGURASI & LOKALISASI HRIS

## 1. Prinsip Dasar Arsitektur
Setiap perubahan kode atau skema database **wajib** mematuhi tiga prinsip ini:
1. **Effective Dating (Tanggal Berlaku)**: Setiap konfigurasi yang memengaruhi uang, waktu, atau hak karyawan harus memiliki `effective_from` dan `effective_to`. Perubahan tidak boleh bersifat retrospektif terhadap data yang sudah difinalisasi.
2. **Snapshotting (Rekam Jejak)**: Setiap kali proses kritis (seperti *payroll run*) dieksekusi, sistem harus menyimpan ID versi konfigurasi dan tabel regulasi yang digunakan saat itu. Perhitungan ulang di masa depan harus menghasilkan angka yang identik.
3. **Graceful Degradation**: Kegagalan integrasi pihak ketiga (misal: API lokasi down) tidak boleh menggagalkan proses inti (misal: absensi tetap tersimpan sebagai koordinat mentah).

---

## 2. Invarian Keamanan (Tidak Dapat Diubah via Dashboard)
Aturan berikut **wajib** dipertahankan di level database (RLS/Trigger) dan Edge Function. Tidak ada toggle di dashboard untuk mematikan ini:
- **Row-Level Security (RLS)**: Semua tabel baru wajib memiliki RLS yang menggunakan fungsi `can(module, level)`, `is_manager_of()`, dan `is_not_blocked()`. Dilarang menggunakan `USING (true)`.
- **Larangan Self-Approval**: Pemohon tidak dapat menyetujui permintaan cuti, reimbursement, revisi gaji, atau koreksi absensinya sendiri.
- **Larangan Backdate**: Absensi tidak dapat dicatat mundur atau diubah setelah *clock-out*, kecuali melalui alur "Koreksi Absensi" yang membutuhkan persetujuan.
- **Immutabilitas Payroll**: Record `payroll_runs` dengan status `final` atau `paid` tidak dapat diubah. Koreksi hanya boleh dilakukan via `salary_adjustments` di periode berikutnya.
- **Last Admin Guard**: Trigger database mencegah penghapusan atau penonaktifan pengguna jika itu adalah satu-satunya pengguna dengan role `admin`.
- **Service Role Isolation**: `SUPABASE_SERVICE_ROLE_KEY` tidak boleh pernah terekspos ke frontend atau disimpan di tabel yang dapat dibaca klien.

---

## 3. Spesifikasi Skema Database (Perubahan & Penambahan)

### 3.1. Tabel Konfigurasi Organisasi
- **`organization_settings`** (Perluasan)
  - `key` (text, primary key)
  - `value` (jsonb)
  - `updated_by` (uuid, ref auth.users)
  - `updated_at` (timestamptz)
  - *Catatan*: Hanya untuk nilai skalar sederhana (nama perusahaan, timezone, currency).

### 3.2. Tabel Regulasi Berversi (Versioned Rate Tables)
Menggantikan hardcode tarif dan aturan.
- **`rate_tables`**: Metadata tabel (id, code `bpjs_jht`, name, unit).
- **`rate_versions`**: 
  - `id` (uuid)
  - `table_id` (uuid, ref rate_tables)
  - `effective_from` (date)
  - `effective_to` (date, nullable)
  - `status` (enum: 'draft', 'published')
  - `source_reference` (text, misal: "Permenaker No. X Tahun Y")
- **`rate_rows`**: 
  - `version_id` (uuid, ref rate_versions)
  - `data` (jsonb, berisi array objek sesuai struktur tabel, divalidasi oleh trigger/check constraint).

### 3.3. Tabel Referensi Pengganti Enum
Enum database yang sering berubah diubah menjadi tabel relasional agar tidak memerlukan migrasi schema saat ada penambahan kategori.
- **`leave_policies`**: `id`, `code`, `name_id`, `name_en`, `is_paid`, `accrual_type`, `max_days`, `requires_document`, `is_active`.
- **`pay_components`**: `id`, `code`, `name_id`, `type` (income/deduction/company_contribution), `is_taxable`, `is_bpjs_base`, `formula_type` (fixed/percentage/manual), `is_active`.
- **`document_types`**: `id`, `code`, `name_id`, `is_required_onboarding`, `retention_months`. *(Hapus hardcoded India: Form 16, 26AS. Ganti dengan: KTP, NPWP, KK, BPJS, Ijazah)*.
- **`expense_categories`**: `id`, `name`, `max_limit_per_claim`, `max_limit_per_month`, `requires_receipt`.
- **`exit_reasons`**: `id`, `name`, `triggers_severance` (boolean).

### 3.4. Modifikasi Tabel Payroll & Absensi
- **`payroll_runs`** (Baru): `id`, `period_month`, `period_year`, `status` (draft/calculating/final/paid), `config_snapshot` (jsonb, menyimpan ID versi regulasi yang dipakai), `engine_version` (text).
- **`payroll_records`**: Tambahkan kolom `payroll_run_id` (uuid), `rate_version_snapshot` (jsonb). Tambahkan unique constraint `(employee_id, payroll_run_id)`.
- **`attendance_logs`**: Tambahkan kolom `location_mode_used` (enum: 'coordinate_only', 'nominatim_public', 'nominatim_selfhost') dan `gps_accuracy_meters` (numeric).

---

## 4. Spesifikasi Modul Konfigurasi Dashboard

Setiap halaman konfigurasi harus memiliki tombol "Simpan", pratinjau dampak, dan validasi Zod di frontend serta validasi schema di backend.

### 4.1. Profil Perusahaan
- **Nama, NPWP, Alamat, Logo**.
- **Zona Waktu**: Default `Asia/Jakarta`. Digunakan untuk semua cron job dan batas tanggal.
- **Mata Uang & Format**: Default `IDR`, format angka `id-ID`, format tanggal `dd MMM yyyy`.
- **Bahasa UI**: Default `Indonesia`.

### 4.2. Lokasi & Absensi
- **Lokasi Kantor**: Nama, Lat/Long, Radius (default 100m, max 1000m), Status Aktif.
- **Mode Reverse Geocoding**: Pilihan: `Nonaktif`, `Hanya Koordinat` (Default), `Nominatim Publik`, `Nominatim Self-Host` (input URL).
- **Akurasi GPS**: Batas maksimal toleransi (default 100m). Di atas ini, sistem memberi peringatan atau menolak (tergantung aturan).
- **Aturan Luar Radius**: Pilihan: `Blokir`, `Izinkan sebagai WFH`, `Izinkan dengan Alasan Wajib`.
- **Retensi Koordinat**: Pilihan: `0` (hapus segera), `3`, `6`, `12` bulan. Dijalankan oleh cron job pembersihan.

### 4.3. Kalender & Hari Kerja
- **Hari Kerja Default**: Checkbox Senin-Minggu. Bisa di-override per karyawan di tabel `work_schedules`.
- **Kalender Libur**: Tabel dengan `date_start`, `date_end`, `type` (nasional, cuti bersama, perusahaan), `name`.
- **Impor CSV**: Fitur upload dengan pratinjau. Jika ada 1 baris invalid, seluruh impor ditolak dengan pesan error spesifik.

### 4.4. Aturan Payroll
- **Pembagi Prorasi**: Pilihan tetap: `30` (kalender), `21` (hari kerja standar), `25` (hari kerja alternatif). *Algoritma prorasi tetap di kode, hanya pembaginya yang dikonfigurasi*.
- **Pembulatan**: Pilihan: `Tidak ada`, `Ke Rupiah Terdekat`, `Ke Atas`, `Ke Bawah`.
- **Jadwal Generate**: Tanggal dan jam eksekusi otomatis (disimpan di tabel `job_schedules` yang memicu pg_cron).
- **Alur Persetujuan**: Pilihan: `Otomatis Final` atau `Butuh Persetujuan` (dengan penunjuk role/user).

### 4.5. Notifikasi & Template
- **Event Rules**: Toggle per event (cuti diajukan, payroll siap, dll). Pilihan channel: `In-App`, `Email`, `Push`.
- **Template Editor**: Textarea dengan variabel yang divalidasi (misal: `{{nama_karyawan}}`, `{{tanggal}}`). Konten di-*escape* sebelum dikirim untuk mencegah XSS.
- **Jam Tenang (Quiet Hours)**: Start time dan End time (misal: 21:00 - 07:00) di mana notifikasi push ditunda.

---

## 5. Spesifikasi Integrasi Pihak Ketiga

| Integrasi | Fungsi | Data yang Keluar | Kontrol Dashboard |
| :--- | :--- | :--- | :--- |
| **Reverse Geocoding** | Konversi Lat/Long ke Alamat | Lat/Long Karyawan | Mode: Nonaktif / Koordinat Saja / Nominatim Publik / Self-Host. |
| **Email (Resend/SMTP)** | Undangan, Notifikasi, Payslip | Email, Nama, Isi Pesan | Provider: Resend (API Key) atau SMTP Custom. Tombol "Test Send". |
| **Web Push (VAPID)** | Notifikasi Browser/PWA | Endpoint Push Browser | Toggle Aktif/Nonaktif. Kunci VAPID disimpan di Edge Secret. |
| **Version Check** | Cek Update GitHub | Tidak ada data karyawan | Toggle Aktif/Nonaktif. Default Nonaktif untuk instalasi internal. |

**Aturan Keamanan Integrasi**:
1. Secret (API Key, Password SMTP) **hanya** ditulis sekali via dashboard, disimpan di Supabase Vault atau Edge Function Secrets. Dashboard hanya menampilkan `****` dan "Terakhir diubah: [tanggal]".
2. Semua panggilan keluar (outbound calls) dicatat di tabel `integration_logs` (tanpa menyimpan payload sensitif) untuk audit jumlah panggilan dan tingkat kegagalan.

---

## 6. Spesifikasi Mesin Payroll (Payroll Engine)

- **Lokasi Kode**: Harus berupa modul bersama (`src/shared/payroll-engine.ts`) yang merupakan *pure function*.
- **Input**: Data karyawan, komponen gaji, daftar kehadiran, dan `rate_version_snapshot`.
- **Output**: Objek rincian gaji (bruto, potongan, net) dan log perhitungan.
- **Aturan PPh 21**: Harus mendukung perhitungan kumulatif. Engine harus menjumlahkan penghasilan bruto dan PPh 21 yang sudah dipotong dari Januari hingga bulan sebelumnya untuk perhitungan rekonsiliasi bulan Desember.
- **Idempotensi**: Fungsi generate payroll harus mengecek apakah `payroll_run` untuk periode tersebut sudah berstatus `final` atau `paid`. Jika ya, tolak permintaan atau kembalikan data yang sudah ada tanpa memproses ulang.
- **Simulasi**: Frontend memanggil fungsi ini dengan data mock untuk menampilkan "Pratinjau Slip Gaji" sebelum disimpan ke database.

---

## 7. Panduan Refaktor & Migrasi Data (Anti-Rusak)

Untuk memastikan workflow tidak hancur, ikuti urutan eksekusi ini secara ketat:

### Tahap 1: Ekspansi Schema (Tanpa Menghapus)
1. Buat semua tabel baru (`rate_tables`, `leave_policies`, dll) **bersamaan** dengan enum lama. Jangan drop enum lama dulu.
2. Terapkan RLS pada semua tabel baru segera setelah dibuat.
3. Buat fungsi database `get_active_config(key)` yang membaca dari `organization_settings`, dengan fallback ke nilai default yang aman jika key belum ada.

### Tahap 2: Migrasi Data & Seeding
1. Jalankan skrip seeding untuk mengisi `leave_policies` dengan data default Indonesia (Cuti Tahunan, Sakit, Melahirkan) dan tandai enum lama (Diwali, Holi) sebagai `is_active = false`.
2. Jalankan skrip seeding untuk `document_types` (KTP, NPWP, dll) dan nonaktifkan dokumen India.
3. Pindahkan data dari enum `expense_category` ke tabel `expense_categories`, lalu ubah foreign key di tabel transaksi (jika ada) atau biarkan sebagai text yang divalidasi.

### Tahap 3: Decoupling Kode (Mengganti Hardcode)
1. Cari dan ganti semua instance mata uang `₹` dan locale `en-IN` dengan pemanggilan ke konfigurasi `organization_settings` (default `IDR` / `id-ID`).
2. Ganti hardcode `radius = 500` di `Attendance.tsx` dengan pembacaan dari konfigurasi lokasi kantor.
3. Ganti validasi `IFSC` bank dengan validasi format rekening bank Indonesia (opsional, atau hapus validasi ketat jika tidak diperlukan).
4. Pastikan semua pemanggilan Nominatim dibungkus dengan *feature flag* dari dashboard. Jika mode "Koordinat Saja", lewati panggilan API sama sekali.

### Tahap 4: Implementasi Snapshot & Engine
1. Ubah fungsi generate payroll untuk menyertakan `config_snapshot` dan `rate_version_id` saat membuat record `payroll_runs`.
2. Pastikan fungsi ini bersifat idempoten.

### Tahap 5: Pembersihan (Cleanup) - *Hanya setelah Tahap 1-4 diverifikasi*
1. Drop enum database lama yang sudah tidak dipakai (`expense_category`, dll).
2. Hapus file kode yang khusus India (`ifsc.ts`, `indianTaxUtils.ts`).
3. Hapus link eksternal yang tidak perlu (Google Fonts, lovable.dev og:image, cal.com) dari `index.html` dan `publicSite.ts`.

---

## 8. Kriteria Penerimaan (Acceptance Criteria) & Pengujian

Sebelum kode digabung ke `main`, semua kondisi berikut **harus** lolos pengujian otomatis (unit/integration test):

1. **Uji Immutabilitas**: Mengubah tarif BPJS di dashboard dengan `effective_from` bulan depan **tidak mengubah** nilai potongan pada `payroll_records` bulan ini yang sudah berstatus `final`.
2. **Uji Simulasi vs Produksi**: Menjalankan *payroll engine* dalam mode simulasi untuk 1 karyawan dengan konfigurasi tertentu menghasilkan angka desimal yang **identik** dengan saat dijalankan sebagai edge function untuk generate resmi.
3. **Uji Degradasi Lokasi**: Menonaktifkan reverse geocoding di dashboard menyebabkan absensi tetap berhasil disimpan dengan data `lat/long` saja, tanpa error, dan tidak ada panggilan jaringan ke Nominatim (diverifikasi via mock network request).
4. **Uji Impor Gagal**: Mengimpor CSV kalender libur dengan 1 baris tanggal format salah menyebabkan seluruh transaksi impor ditolak (rollback), dengan pesan error yang menyebutkan nomor baris yang salah.
5. **Uji Keamanan RLS**: Pengguna dengan role `employee` yang mencoba melakukan `SELECT` langsung ke tabel `rate_versions` atau `organization_settings` (melalui client Supabase) mendapatkan 0 baris atau error kebijakan RLS, kecuali untuk data yang secara eksplisit diizinkan.
6. **Uji Ekspor-Impor Konfigurasi**: Mengekspor konfigurasi (tanpa secret) ke JSON, lalu mengimpornya ke instance database baru, menghasilkan sistem yang berfungsi dengan pengaturan yang sama persis.

---

Dokumen ini adalah spesifikasi final. Setiap penyimpangan dari aturan di atas (terutama pada Bagian 2 dan 7) harus melalui persetujuan arsitektur dan didokumentasikan sebagai pengecualian risiko.
