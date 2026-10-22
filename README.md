<div align="center">

<img src="src/assets/hr-hub-logo.svg" alt="" width="72" height="72" />

# HRISINDO

**HR open-source untuk tim yang berkembang.**

People, onboarding, absensi, cuti, payroll, performa, reimbursement dan aset, dalam satu aplikasi aman yang bisa Anda host sendiri. Dibangun dengan React dan Supabase, dengan payroll dalam ₹.

[Website](https://peoplo.redmonk.in) · [Self-hosting](docs/self-hosting.md) · [Kontribusi](CONTRIBUTING.md) · [Keamanan](SECURITY.md) · [Changelog](CHANGELOG.md)

[![CI](https://github.com/redmonkin/core-hr-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/redmonkin/core-hr-hub/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-0284C7.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/redmonkin/core-hr-hub?style=flat&color=0284C7)](https://github.com/redmonkin/core-hr-hub/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-0284C7.svg)](CONTRIBUTING.md)

</div>

## Fitur

- **People & departemen**: satu record per orang dengan detail pekerjaan, manager, dokumen, aset dan riwayat.
- **Onboarding undangan-saja**: tambahkan karyawan baru sekali dan mereka akan dikirim email berisi tautan untuk menyiapkan akun; Pending menunjukkan siapa yang belum bergabung. Akun bisa dibatasi ke domain email perusahaan Anda.
- **Offboarding**: mulai dari tool atau biarkan karyawan mengundurkan diri untuk persetujuan HR; checklist mencakup aset yang perlu dikembalikan dan pembayaran akhir, dan pada hari terakhir orang tersebut di-offboard dan akses loginnya otomatis diblokir.
- **Absensi**: clock in dan clock out dengan lokasi dan istirahat, jadwal kerja, dan pengingat.
- **Cuti & hari libur**: tipe cuti dan saldo, persetujuan manager, kalender tim dan hari libur perusahaan.
- **Payroll & payslip**: struktur gaji, payroll bulanan, potongan PF dan lainnya, serta PDF payslip bermerek.
- **Performa**: KPI, siklus review dengan rating diri sendiri dan manager, serta analitik tim.
- **Reimbursement**: klaim dengan bukti, persetujuan manager dan pelacakan pembayaran.
- **Aset**: peralatan, siapa yang memilikinya, dan riwayat penugasan.
- **Laporan**: headcount, absensi, saldo cuti, payroll dan aset, dapat diekspor ke CSV dan PDF.
- **Izin per modul**: role menetapkan akses lihat/kelola default untuk setiap modul, dan Anda bisa memberikan akses tambahan ke satu orang (misalnya, hanya Aset).
- **Notifikasi**: in-app, email dan web push. Bisa dipasang sebagai PWA di ponsel.

Setiap deployment adalah workspace satu perusahaan.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | [Supabase](https://supabase.com): Postgres dengan row-level security, Auth, Storage, Edge Functions (Deno) |
| Email | [Resend](https://resend.com) |
| Penjadwalan | `pg_cron` + `pg_net` untuk pengingat dan payroll bulanan |

Browser berkomunikasi langsung dengan Supabase. Row-level security menentukan apa yang bisa dibaca dan ditulis setiap orang, berdasarkan izin modul mereka; trigger database menjaga perubahan sensitif (tanpa self-approval, tanpa backdated attendance). Edge functions menangani apa pun yang membutuhkan service role: undangan, email, push notification dan job terjadwal.

## Pengembangan lokal

Persyaratan: Node.js 20+ dan project Supabase (tier gratis pun cukup). [Panduan self-hosting](docs/self-hosting.md) menjelaskan cara menyiapkan project.

```sh
git clone https://github.com/redmonkin/core-hr-hub.git peoplo
cd peoplo
npm install
cp .env.example .env   # isi Supabase URL, anon key dan project ref Anda
npm run dev            # http://localhost:9002
```

Script berguna:

| Perintah | Fungsinya |
| --- | --- |
| `npm run dev` | Menjalankan dev server |
| `npm run build` | Build produksi ke `dist/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan TypeScript (build Vite tidak typecheck) |
| `npm test` | Unit test (Vitest) |
| `supabase/tests/run.sh` | Test database untuk aturan akses, terhadap Postgres lokal |

CI menjalankan lint, typecheck, unit test, test database dan build pada setiap pull request.

Sebuah `docker-compose.yml` disertakan untuk menjalankan stack lokal yang kompatibel dengan Supabase; secret default-nya adalah nilai demo publik, jadi ubah sebelum mengeksposnya ke mana pun.

## Self-hosting

HRISINDO berjalan pada satu project [Supabase](https://supabase.com), [Resend](https://resend.com) untuk email, dan host statis apa pun untuk website. **[Panduan self-hosting](docs/self-hosting.md)** memandu setiap langkah:

1. Buat project Supabase, aktifkan `pg_cron` dan `pg_net`, dan terapkan migrasi (`supabase db push`).
2. Verifikasi sending domain di Resend dan buat API key.
3. Atur secret function (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`, `CRON_SECRET`, VAPID keys opsional) dan deploy edge functions.
4. Konfigurasi Supabase Auth: site dan redirect URL, SMTP kustom melalui Resend, dan matikan public sign-up.
5. Jadwalkan job pengingat dan payroll.
6. Build frontend dengan variabel dari [`.env.example`](.env.example) dan deploy (Vercel bekerja langsung dengan `vercel.json`).
7. Undang diri Anda sebagai admin pertama.

Juga mencakup pengecekan bahwa semuanya bekerja, pembaruan ke versi baru dan troubleshooting.

## Struktur project

```
src/
  pages/            Komponen route
  components/       Komponen fitur per modul, shadcn/ui di ui/, halaman marketing di landing/
  hooks/            Data hooks (TanStack Query), usePermissions, ...
  lib/              Izin, prorata payroll, PDF payslip, style status, ...
  integrations/     Klien Supabase dan tipe database yang dihasilkan
supabase/
  migrations/       Migrasi SQL, diterapkan sesuai urutan timestamp
  functions/        Edge functions Deno (_shared/ berisi helper auth, CORS, HTML-escaping dan secret)
  tests/            Test database untuk row-level security dan trigger
docs/               Panduan self-hosting dan roadmap
```

[`CLAUDE.md`](CLAUDE.md) mendokumentasikan arsitektur lebih dalam: model izin, akun undangan-saja dan konvensi keamanan yang harus diikuti setiap perubahan.

## Kontribusi

Kontribusi diterima. Baca [CONTRIBUTING.md](CONTRIBUTING.md) sebelum membuka pull request, dan lihat [docs/ROADMAP.md](docs/ROADMAP.md) untuk apa yang direncanakan. Harap ikuti [code of conduct](CODE_OF_CONDUCT.md).

## Keamanan

Harap jangan laporkan kerentanan di isu publik. Lihat [SECURITY.md](SECURITY.md).

## Lisensi

HRISINDO dilisensikan di bawah [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). Anda boleh menggunakan, memodifikasi dan self-host secara bebas, termasuk untuk staff perusahaan sendiri. Jika Anda menjalankan versi yang dimodifikasi sebagai layanan untuk orang lain, Anda harus menyediakan source code yang dimodifikasi kepada penggunanya; tautan **Source code** aplikasi (atur `VITE_REPO_URL` ke fork Anda) adalah cara termudah melakukannya.

Versi yang dirilis sebelum perubahan lisensi tetap tersedia di bawah lisensi MIT yang dirilis bersamanya.
