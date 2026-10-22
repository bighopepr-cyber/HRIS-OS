# Self-hosting HRISINDO

Panduan ini membawa Anda dari awal hingga memiliki salinan HRISINDO Anda sendiri yang berjalan. Waktunya sekitar satu jam, sebagian besar menunggu DNS.

Setiap deployment HRISINDO adalah **satu workspace perusahaan**. Akun bersifat undangan saja dan dapat dibatasi ke domain email Anda, sehingga tidak ada halaman pendaftaran publik yang perlu dilindungi.

Anda akan menyiapkan tiga hal:

1. **Supabase**: basis data, masuk, penyimpanan file, fungsi server dan pekerjaan terjadwal.
2. **Resend**: mengirim email (undangan, persetujuan, pengingat, reset kata sandi).
3. **Host statis** untuk situs web. Panduan ini menggunakan Vercel; host statis apa pun bisa digunakan.

## Daftar isi

- [Yang Anda perlukan](#yang-anda-perlukan)
- [Bagian 1: Supabase](#bagian-1-supabase)
- [Bagian 2: Resend (email)](#bagian-2-resend-email)
- [Bagian 3: Notifikasi push (opsional)](#bagian-3-notifikasi-push-opsional)
- [Bagian 4: Deploy fungsi server](#bagian-4-deploy-fungsi-server)
- [Bagian 5: Pengaturan Supabase Auth](#bagian-5-pengaturan-supabase-auth)
- [Bagian 6: Pekerjaan terjadwal](#bagian-6-pekerjaan-terjadwal)
- [Bagian 7: Deploy situs web](#bagian-7-deploy-situs-web)
- [Bagian 8: Buat admin pertama](#bagian-8-buat-admin-pertama)
- [Bagian 9: Periksa semuanya berfungsi](#bagian-9-periksa-semuanya-berfungsi)
- [Memperbarui ke versi baru](#memperbarui-ke-versi-baru)
- [Pemecahan masalah](#pemecahan-masalah)
- [Layanan pihak ketiga](#layanan-pihak-ketiga)

## Yang Anda perlukan

- Komputer dengan [Git](https://git-scm.com/downloads) dan [Node.js](https://nodejs.org) 20 atau lebih baru.
- Akun [Supabase](https://supabase.com) (paket gratis cukup untuk memulai).
- Akun [Resend](https://resend.com) (paket gratis cukup untuk memulai).
- Domain yang catatan DNS-nya dapat Anda edit, untuk mengirim email (misalnya `example.com`).
- Akun [Vercel](https://vercel.com), atau host statis lain.

Dapatkan kode dan pasang dependensinya:

```sh
git clone https://github.com/redmonkin/core-hr-hub.git peoplo
cd peoplo
npm install
```

Semua perintah Supabase di bawah ini menggunakan `npx supabase ...`, yang menjalankan [Supabase CLI](https://supabase.com/docs/guides/cli) tanpa memasangnya. Jika Anda lebih suka, [pasang CLI-nya](https://supabase.com/docs/guides/cli/getting-started) dan hilangkan `npx`.

## Bagian 1: Supabase

### 1.1 Buat proyek

1. Masuk ke [dasbor Supabase](https://supabase.com/dashboard) dan klik **New project**.
2. Beri proyek nama (misalnya `peoplo`) dan atur **database password**. Simpan di pengelola kata sandi Anda; Anda akan membutuhkannya di langkah 1.4.
3. Pilih **region** yang paling dekat dengan tim Anda, lalu klik **Create new project**.

### 1.2 Catat detail proyek Anda

| Nilai | Tempat menemukannya | Contoh |
| --- | --- | --- |
| Project ref | **Project Settings → General → Project ID** | `abcdefghijklmnopqrst` |
| Project URL | **Project Settings → Data API** | `https://abcdefghijklmnopqrst.supabase.co` |
| Anon key | **Project Settings → API Keys** (kunci `anon` `public`) | `eyJhbGciOi...` |
| Service role key | Halaman yang sama, kunci `service_role` `secret` | `eyJhbGciOi...` |

Anon key bersifat publik by design dan dimasukkan ke situs web. **Service role key melewati setiap aturan akses**: jangan pernah memasukkannya ke situs web atau melakukan commit ke mana pun.

### 1.3 Aktifkan ekstensi penjadwalan

Di **Database → Extensions**, aktifkan `pg_cron` dan `pg_net`. Keduanya menjalankan pengingat dan pekerjaan penggajian bulanan di [Bagian 6](#bagian-6-pekerjaan-terjadwal).

### 1.4 Buat basis data

Tautkan CLI ke proyek Anda dan terapkan setiap migrasi di `supabase/migrations/`:

```sh
npx supabase login
npx supabase link --project-ref <your-project-ref>   # meminta database password
npx supabase db push
```

Ini membuat semua tabel, aturan akses (row-level security), izin modul, guard pendaftaran undangan saja, bucket penyimpanan dan trigger integritas data. Ini tidak membuat data contoh.

> Menerapkan migrasi dengan menempelkannya ke SQL Editor tidak disarankan: file yang panjang dapat terpotong saat ditempel, sehingga hanya sebagian migrasi yang diterapkan. Gunakan `db push`.

## Bagian 2: Resend (email)

HRISINDO mengirim dua jenis email: **email aplikasi** (persetujuan cuti, pengingat, pemberitahuan slip gaji) melalui Resend API dari fungsi server, dan **email akun** (undangan, reset kata sandi) dari Supabase Auth, yang akan Anda arahkan ke server SMTP Resend di [5.2](#52-kirim-email-akun-melalui-resend).

### 2.1 Tambahkan dan verifikasi domain pengirim Anda

1. Di Resend, buka **Domains → Add domain**. Gunakan subdomain seperti `mail.example.com` agar reputasi domain utama Anda tidak terpengaruh.
2. Tambahkan catatan DNS yang ditunjukkan Resend (SPF, DKIM, dan catatan MX untuk bounce) di penyedia DNS Anda.
3. Secara opsional tambahkan catatan DMARC, misalnya `_dmarc.mail.example.com TXT "v=DMARC1; p=none;"`.
4. Tunggu hingga Resend menampilkan domain sebagai **Verified**.

### 2.2 Buat API key

**API Keys → Create API key**, dengan akses **Sending**. Salin; hanya ditampilkan sekali.

### 2.3 Pilih alamat pengirim

Pilih alamat pada domain yang sudah diverifikasi, misalnya `HRISINDO <hr@mail.example.com>`. Ini menjadi `RESEND_FROM_EMAIL`.

## Bagian 3: Notifikasi push (opsional)

HRISINDO adalah progressive web app dan dapat mengirim notifikasi push (persetujuan, pengingat) ke ponsel dan desktop. Lewati bagian ini jika Anda hanya menginginkan email.

Buat pasangan kunci VAPID:

```sh
npx web-push generate-vapid-keys
```

Simpan kedua kunci. Kunci **publik** dimasukkan ke situs web (`VITE_VAPID_PUBLIC_KEY`) dan fungsi server (`VAPID_PUBLIC_KEY`); kunci **privat** hanya ke fungsi server (`VAPID_PRIVATE_KEY`).

## Bagian 4: Deploy fungsi server

Atur rahasia fungsi. `SUPABASE_URL`, `SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` diberikan ke fungsi secara otomatis; jangan atur sendiri. Daftar lengkapnya ada di [`supabase/functions/.env.example`](../supabase/functions/.env.example).

```sh
npx supabase secrets set \
  RESEND_API_KEY="re_..." \
  RESEND_FROM_EMAIL="HRISINDO <hr@mail.example.com>" \
  APP_URL="https://hr.example.com" \
  CRON_SECRET="$(openssl rand -hex 32)"

# Opsional, untuk notifikasi push (Bagian 3)
npx supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_CONTACT_EMAIL="hr@example.com"
```

- `APP_URL` adalah alamat situs web Anda, dengan `https://` dan tanpa garis miring di akhir. Tautan dalam email menggunakannya, dan undangan hanya mengalihkan ke host ini (ditambah `localhost` untuk pengembangan). Tambahkan host lain, seperti domain pratinjau, dengan `EXTRA_REDIRECT_HOSTS` (dipisahkan koma; awali dengan `*.` untuk subdomain).
- `CRON_SECRET` melindungi fungsi terjadwal. **Catat nilainya**: pekerjaan terjadwal di [Bagian 6](#bagian-6-pekerjaan-terjadwal) mengirimkannya. Tanpanya, fungsi terjadwal menolak setiap permintaan.

Lalu deploy setiap fungsi:

```sh
npx supabase functions deploy
```

`supabase/config.toml` menandai fungsi yang mengautentikasi pemanggil sendiri (`verify_jwt = false`); CLI menerapkan pengaturan tersebut untuk Anda.

## Bagian 5: Pengaturan Supabase Auth

Semuanya di dasbor Supabase di bawah **Authentication**.

### 5.1 Alamat situs web dan redirect

**URL Configuration**:

- **Site URL**: alamat situs web Anda, misalnya `https://hr.example.com`.
- **Redirect URLs**: tambahkan `https://hr.example.com/**` (dan `http://localhost:9002/**` jika Anda mengembangkan secara lokal).

### 5.2 Kirim email akun melalui Resend

Email bawaan Supabase dibatasi lajunya dan dimaksudkan untuk pengujian. Di bawah **Emails → SMTP Settings**, aktifkan SMTP kustom:

| Field | Nilai |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key Resend Anda |
| Sender email | alamat pada domain yang sudah diverifikasi |
| Sender name | `HRISINDO` (atau nama perusahaan Anda) |

### 5.3 Matikan pendaftaran publik

Di bawah **Sign In / Providers**, matikan **Allow new users to sign up**. HRISINDO bersifat undangan saja: trigger basis data sudah menolak akun tanpa undangan yang tertunda, tetapi mematikan ini menghindari error yang membingungkan di halaman masuk. Undangan tetap berfungsi, karena dikirim oleh fungsi `invite-employee` dengan service role.

### 5.4 Batasi akun ke domain email Anda (disarankan)

Setelah Anda masuk sebagai admin ([Bagian 8](#bagian-8-buat-admin-pertama)), buka **Settings → Domain whitelist** di HRISINDO dan tambahkan domain email perusahaan Anda. Undangan dan email akun di luar domain ini kemudian ditolak oleh basis data.

## Bagian 6: Pekerjaan terjadwal

Pekerjaan ini memanggil fungsi terjadwal. Tidak ada di migrasi karena berisi URL proyek dan rahasia Anda. Di **SQL Editor**, ganti `<project-ref>` dan `<CRON_SECRET>` lalu jalankan:

```sql
-- Pengingat kehadiran: setiap 10 menit selama jam kerja, Senin sampai Sabtu (UTC)
select cron.schedule('attendance-reminders-job', '*/10 8-19 * * 1-6', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/attendance-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Pengingat KPI dan tujuan: harian pukul 09:00 UTC
select cron.schedule('daily-goal-reminders', '0 9 * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/goal-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Pengingat onboarding: harian pukul 09:00 UTC
select cron.schedule('onboarding-reminders-daily', '0 9 * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/onboarding-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Acara perusahaan minggu ini: Senin pukul 08:00 UTC
select cron.schedule('weekly-event-notifications', '0 8 * * 1', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/event-notification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Selesaikan offboarding untuk orang yang hari kerja terakhirnya telah berlalu (status
-- offboarded, masuk diblokir, cuti tertunda dibatalkan): harian pukul 00:30 UTC.
-- Berjalan di dalam basis data, jadi URL atau rahasia tidak diperlukan.
select cron.schedule('process-employee-exits', '30 0 * * *', $$
  select public.process_employee_exits();
$$);

-- Terapkan revisi gaji yang tanggal efektifnya telah tiba dan kirim email ke
-- karyawan tersebut: harian pukul 00:45 UTC (06:15 IST)
select cron.schedule('salary-revisions-daily', '45 0 * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/salary-revisions',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Ingatkan tim pada hari kerja terakhir seseorang (email checklist offboarding):
-- harian pukul 03:30 UTC (09:00 IST)
select cron.schedule('offboarding-reminders-daily', '30 3 * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/offboarding-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);

-- Hasilkan catatan penggajian bulan ini: hari terakhir bulan pukul 09:00 UTC
-- ('$' berarti hari terakhir bulan; memerlukan pg_cron 1.5 atau lebih baru)
select cron.schedule('monthly-payroll-generation', '0 9 $ * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/generate-monthly-payroll',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);
```

Waktu dalam UTC; sesuaikan jam untuk zona waktu Anda. Untuk melihat atau menghapus pekerjaan: `select * from cron.job;` dan `select cron.unschedule('job-name');`.

## Bagian 7: Deploy situs web

Situs web adalah build statis yang dikonfigurasi dengan variabel lingkungan saat build (lihat [`.env.example`](../.env.example)):

| Variabel | Nilai | Wajib |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Project URL dari [1.2](#12-catat-detail-proyek-anda) | Ya |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key | Ya |
| `VITE_SUPABASE_PROJECT_ID` | Project ref | Ya |
| `VITE_VAPID_PUBLIC_KEY` | Kunci publik VAPID dari [Bagian 3](#bagian-3-notifikasi-push-opsional) | Untuk notifikasi push |
| `VITE_REPO_URL` | URL fork Anda, jika Anda mengubah kode (lihat [Lisensi](#lisensi-dan-perubahan-anda)) | Tidak |

### Di Vercel

1. **Add New → Project**, impor fork repositori Anda.
2. Vercel mendeteksi Vite. Tambahkan variabel di atas di bawah **Environment Variables**.
3. Deploy. `vercel.json` sudah menulis ulang rute aplikasi ke `index.html` dan mengatur header keamanan. Content Security Policy-nya mengizinkan `*.supabase.co`; jika Anda menggunakan domain Supabase kustom, tambahkan ke `connect-src`.
4. Tambahkan domain Anda di bawah **Settings → Domains**, dan pastikan cocok dengan `APP_URL` dan URL Situs Auth.

### Di host lain

Jalankan `npm run build` dengan variabel diatur, lalu sajikan folder `dist/`. Konfigurasi host untuk menyajikan `index.html` untuk path apa pun yang bukan file (Netlify: `public/_redirects` disertakan; nginx: `try_files $uri /index.html;`).

## Bagian 8: Buat admin pertama

Tidak ada pendaftaran publik, sehingga admin pertama diundang dari basis data:

1. Di **SQL Editor**:

   ```sql
   insert into public.user_invitations (email, roles)
   values ('you@example.com', '{admin}');
   ```

2. Di **Authentication → Users**, klik **Add user → Create new user**, masukkan alamat yang sama dan kata sandi, lalu centang **Auto Confirm User**.
3. Masuk ke HRISINDO dengan email dan kata sandi tersebut.

Jika Anda menambahkan diri sendiri sebagai karyawan nanti (**Onboarding → Add employee** dengan email Anda sendiri), catatan tersebut otomatis ditautkan ke akun Anda yang sudah ada.

Lalu atur perusahaan Anda di **Settings** (departemen, jenis cuti, ID karyawan, domain whitelist, lokasi kantor dan branding) dan tambahkan semua orang lain dari **Onboarding → Add employee**. Menambahkan seseorang membuat catatan karyawan mereka dan mengirim email berisi tautan untuk memilih kata sandi; mereka menunggu di **Pending** hingga melakukannya, lalu menjadi aktif dengan saldo cuti yang diatur. Peran menentukan akses default per modul; **Settings → Users & access → Extra access** memberikan satu orang akses lebih. Admin terakhir tidak dapat dihapus, sehingga Anda tidak dapat mengunci diri sendiri.

## Bagian 9: Periksa semuanya berfungsi

1. Gunakan **Forgot password?** di halaman masuk; email reset harus tiba dari alamat pengirim Anda.
2. Tambahkan karyawan uji dengan alamat email kedua yang Anda miliki dari **Onboarding → Add employee**. Buka email undangan, pilih kata sandi, dan periksa orang tersebut berpindah dari **Pending** menjadi aktif.
3. Sebagai karyawan tersebut, clock in dan ajukan cuti satu hari. Manajer (atau admin) harus mendapat email dan notifikasi dalam aplikasi.
4. Setujui cuti; karyawan harus diberi tahu.
5. Hari berikutnya, periksa pekerjaan terjadwal berjalan: `select * from cron.job_run_details order by start_time desc limit 20;`.

## Memperbarui ke versi baru

```sh
git pull                          # atau sinkronkan fork Anda
npm install
npx supabase db push              # menerapkan migrasi baru apa pun
npx supabase functions deploy     # menerapkan ulang fungsi server
```

Lalu deploy ulang situs web (Vercel melakukan ini saat Anda push). Baca [`CHANGELOG.md`](../CHANGELOG.md) terlebih dahulu: **Upgrade notes** setiap versi mencantumkan rahasia baru, pengaturan atau langkah manual.

## Pemecahan masalah

**Undangan atau email reset kata sandi tidak tiba.** Ini berasal dari Supabase Auth. Periksa pengaturan SMTP di [5.2](#52-kirim-email-akun-melalui-resend) (username `resend`, password API key), bahwa pengirim berada di domain yang sudah diverifikasi, dan **Authentication → Logs**.

**"Only email addresses from approved domains..."** Alamat tersebut tidak tercakup oleh **Settings → Domain whitelist**. Tambahkan domainnya di sana.

**"Sign-ups are invite-only".** Tidak ada undangan tertunda untuk alamat tersebut. Tambahkan orang tersebut dari **Onboarding** (atau, untuk admin pertama, [Bagian 8](#bagian-8-buat-admin-pertama)).

**Karyawan baru bilang tautan undangan mereka tidak berfungsi.** Tautan berlaku 24 jam. Gunakan **Resend** pada baris mereka di **Onboarding → Pending**; setiap pengiriman ulang membuat tautan sebelumnya berhenti berfungsi.

**Tidak ada email persetujuan atau pengingat.** Buka **Edge Functions → (function) → Logs**. Biasanya `RESEND_API_KEY` atau `RESEND_FROM_EMAIL` tidak diatur, atau domain belum diverifikasi. Halaman **Emails** Resend menunjukkan apa yang diterimanya.

**Email tiba tetapi tautan mengarah ke situs yang salah.** `APP_URL` tidak sama persis dengan situs web Anda (`https`, tanpa garis miring di akhir).

**Pengingat terjadwal tidak pernah keluar.** Periksa pekerjaan ada (`select * from cron.job;`) dan eksekusinya (`select * from cron.job_run_details order by start_time desc;`). 401 di `net._http_response` berarti `x-cron-secret` dalam pekerjaan tidak cocok dengan rahasia fungsi `CRON_SECRET`.

**Halaman selain beranda menampilkan 404.** Host tidak menulis ulang path yang tidak dikenal ke `index.html` ([Bagian 7](#di-host-lain)).

**Notifikasi push tidak pernah tiba.** `VITE_VAPID_PUBLIC_KEY` (situs web) dan `VAPID_PUBLIC_KEY` (fungsi) harus kunci yang sama, dan situs harus disajikan melalui HTTPS.

**Proyek berhenti merespons setelah seminggu tenang.** Supabase menjeda proyek paket gratis setelah tidak aktif. Pulihkan dari dasbor, atau gunakan paket berbayar untuk apa pun yang diandalkan perusahaan. Paket gratis juga tidak memiliki backup otomatis.

## Layanan pihak ketiga

| Layanan | Digunakan untuk | Diperlukan? |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Basis data, masuk, penyimpanan file, fungsi server dan pekerjaan terjadwal | Ya |
| [Resend](https://resend.com) | Email aplikasi melalui API-nya, email akun melalui server SMTP-nya | Untuk email apa pun. Tanpanya aplikasi berfungsi tetapi tidak ada yang dikirim via email |
| Static hosting (Vercel, Netlify, Cloudflare Pages, nginx...) | Menyajikan situs web | Ya, salah satu dari mereka |
| Web Push (layanan push vendor browser) | Notifikasi push | Opsional, hanya dengan kunci VAPID |
| [GitHub Releases API](https://docs.github.com/rest/releases) | Halaman "What's new" dalam aplikasi dan pemberitahuan pembaruan (fungsi `version-check`) | Dipanggil otomatis; fallback ke changelog bawaan |

HRISINDO tidak menggunakan layanan analitik, iklan atau pelacakan.

## Lisensi dan perubahan Anda

HRISINDO dilisensikan di bawah [AGPL-3.0](../LICENSE). Menjalankannya untuk staf perusahaan Anda sendiri tidak memerlukan penerbitan apa pun. Jika Anda memodifikasinya dan membiarkan orang menggunakan versi yang Anda modifikasi melalui jaringan, Anda harus menyediakan kode sumbernya. Sidebar aplikasi memiliki tautan **Source code** untuk ini; atur `VITE_REPO_URL` ke fork Anda agar menunjuk ke perubahan Anda.
