# Berkontribusi pada HRISINDO

Terima kasih atas bantuan Anda dalam meningkatkan HRISINDO. Panduan ini menjelaskan cara menyiapkan lingkungan pengembangan dan apa yang membuat sebuah pull request yang baik. Silakan ikuti [Kode Etik](CODE_OF_CONDUCT.md).

## Sebelum Memulai

- **Ketikuan**: cari issue yang ada terlebih dahulu, kemudian buka satu menggunakan template laporan bug.
- **Fitur**: buka issue untuk membahas ide sebelum menulis banyak code, dan periksa [docs/ROADMAP.md](docs/ROADMAP.md) untuk melihat apakah sudah direncanakan.
- **Isu Keamanan**: jangan buka issue publik. Ikuti [SECURITY.md](SECURITY.md).

## Pengaturan Pengembangan

Ikuti [Pengembangan Lokal](README.md#local-development) di README. Anda akan membutuhkan proyek Supabase sendiri; panduan [self-hosting](docs/self-hosting.md) menjalankan migrasi dan menerapkan edge function ke dalamnya. Jangan pernah arahkan salinan pengembangan ke proyek produksi.

## Membuat Perubahan

1. Fork repo dan buat branch dari `main`.
2. Buat setiap pull request berfokus pada satu perubahan.
3. Jalankan sama seperti yang dijalankan CI sebelum mengirim:

   ```sh
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

   Jika Anda mengubah migrasi, jalankan juga uji database terhadap Postgres lokal 15+ (`supabase/tests/run.sh`; atur `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` sesuai kebutuhan).

4. Buka pull request dan isi template. Sertakan screenshot desktop dan ponsel untuk perubahan UI.

## Konvensi

[CLAUDE.md](CLAUDE.md) mendeskripsikan arsitektur secara rinci. Aturan yang paling penting:

- **Akses diputuskan di database.** Setiap tabel memiliki keamanan baris-level (RLS). Akses seluruh organisasi melalui `public.can('<module>', 'view' | 'manage')`; baris Anda sendiri melalui `get_my_employee_id()` / `auth.uid()`; tim Anda melalui `is_manager_of()`. Jangan pernah mengandalkan menyembunyikan sesuatu di UI.
- **Tabel baru dikirim dengan RLS** dan kebijakan "Tolak pengguna yang diblokir" yang ketat dalam migrasi yang sama. CI menolak migrasi yang mengandung `USING (true)`; jika sebuah tabel memang publik, jelaskan alasan dalam komentar dan minta tinjauan eksplisit.
- **Modul atau level izin baru** masuk ke dalam enum `app_module`, `src/lib/permissions.ts` dan matriks pengaturan bersamaan, dengan uji database di `supabase/tests/permissions.test.sql`.
- **Migrasi hanya ditambahkan.** Tambahkan file bernomor timestamp baru di `supabase/migrations/` daripada mengedit yang sudah dirilis.
- **Perubahan sensitif diawasi oleh trigger** (misalnya, karyawan tidak dapat menyetujui cuti mereka sendiri). Jika Anda menambahkan alur kerja yang memiliki dampak persetujuan atau keuangan, tambahkan trigger penjaga dan uji.
- **Edge function** menangani preflight CORS `OPTIONS`, mengotentikasi pemanggil dengan `authenticateCaller()` dari `_shared/auth.ts` (atau `verifyCronSecret()` untuk function terjadwal), memeriksa izin dengan `userCan()`, memuat data dari database daripada memercayai body permintaan, dan mengescape setiap nilai yang dimasukkan ke HTML email dengan `escapeHtml()`.
- **UI** menggunakan komponen shadcn/ui di `src/components/ui/` dan token Tailwind di `src/index.css`. Jangan hardcode warna. Badge status menggunakan `statusBadgeClass()` / `formatStatus()` dari `src/lib/statusStyles.ts`. Setiap halaman harus berfungsi pada lebar 390px; tabel beralih ke tata kartu di bawah `sm`, dan tombol ikon-only membutuhkan `aria-label`.
- **Mata uang** adalah ₹ yang diformats dengan locale `en-IN`; tanggal ditampilkan sebagai `MMM d, yyyy`.

## Pesan Commit

Tulis subjek imperatif singkat (contoh, "Add half-day leave to the leave calendar"), diikuti dengan body menjelaskan *mengapa* ketika tidak jelas.

## Lisensi

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda dilisensikan di bawah [AGPL-3.0](LICENSE), lisensi yang sama dengan proyek.