# Changelog

Semua perubahan penting pada Peoplo tercantum di sini. Formatnya mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), dan versi mengikuti [Semantic Versioning](https://semver.org/). Rilis hingga v1.1.1 dijelaskan di [GitHub Releases](https://github.com/redmonkin/core-hr-hub/releases).

Saat Anda memperbarui salinan self-hosting, baca **Catatan Upgrade** setiap versi sejak versi Anda: mereka mencantumkan migrasi baru, rahasia dan pengaturan. Langkah-langkahnya ada di [Memperbarui ke versi baru](docs/self-hosting.md#updating-to-a-new-version).

## [Unreleased]

### Revisi gaji (penilaian)

- **Revisi gaji** dari Payroll → Struktur gaji atau Karyawan → Edit → Gaji: jenis (penilaian tahunan, promosi, koreksi pasar, penyesuaian, lain), tanggal efektif, alasan, ulasan kinerja yang terkait secara opsional, dan komponen baru. "Naikkan setiap komponen pendapatan dengan %" dengan cepat mengisi mereka; perbandingan lama vs baru dan persentase perubahan ditampilkan sebelum menyimpan.
- **Berlaku pada tanggalnya**: revisi masa depan menunggu sebagai *Dijadwalkan* dan diterapkan secara otomatis; revisi di tengah bulan yang belum diproses akan dihitung proporsional; revisi **mundur** menambahkan **keterlambatan** ke payroll berikutnya, ditampilkan pada slip gaji sebagai "Revisi Gaji Keterlambatan".
- **Slip gaji tetap mempertahankan gaji saat dibuat**, sehingga revisi tidak pernah mengubah slip gaji lama.
- **Aturan**: hanya orang dengan akses manajemen payroll yang dapat merevisi; tidak ada yang merevisi (atau membatalkan revisi) gaji sendiri kecuali admin, dan dicatat dengan nama mereka. Revisi tidak dapat diedit, hanya dapat dibatalkan dan diulang.
- **Persetujuan opsional** (Pengaturan → Payroll, mati secara default, hanya admin): revisi kemudian menunggu persetujuan dari admin payroll lain; tidak ada yang menyetujui revisi yang mereka ajukan atau revisi pada gaji mereka sendiri. Revisi yang menunggu persetujuan tercantum pada halaman Payroll. Pengaturan gaji seseorang untuk pertama kalinya tidak memerlukan persetujuan.
- **Surat revisi** (PDF) dan **email** kepada karyawan saat revisi diterapkan (dapat dicoret), serta kartu **Kompensasi** di Profil → Slip Gaji dengan gaji saat ini, revisi mendatang dan sebelumnya beserta surat mereka.
- Struktur gaji tidak lagi diedit secara langsung: tombol Edit menjadi **Revisi gaji**, yang juga menampilkan histori.

### Catatan upgrade (revisi gaji)

- Terapkan `20261011100000_salary_revisions.sql`, deploy `salary-revisions` dan redeploy `generate-monthly-payroll`, dan jadwalkan `salary-revisions-daily` (lihat panduan self-hosting). Deploy website pada saat yang sama: formulir Edit gaji lama diblokir oleh aturan baru.

### Pengalaman onboarding, disederhanakan

- **Satu langkah untuk menambah dan undang**: menambahkan karyawan di Onboarding membuat rekannya dan mengirimkan email undangan untuk menyiapkan akun mereka. Alur undangan terpisah "undang untuk self-onboard", permintaan onboarding yang diajukan karyawan, dan tab Requests telah dihapus.
- **Pending menunjukkan siapa yang belum bergabung**: setiap status undangan karyawan baru (dikirim, kadaluarsa link, tidak terkirim, dibatalkan) dengan **Kirim Ulang** dan **Batalkan Undangan**, ditambah siapa yang bergabung dalam 30 hari terakhir.
- **Bergabung otomatis**: saat karyawan baru membuka link dan memilih kata sandi (layar selamat datang baru), undangannya diterima, rekannya menjadi aktif, saldo cuti dibuat, dan siapa yang mengundangnya diberi tahu. "Tandai sebagai bergabung" masih tersedia untuk orang yang tidak akan menggunakan aplikasi.
- **Undang siapa pun tanpa akun** dari baris mereka di Karyawan.
- Formulir Tambah karyawan tidak lagi meminta gaji dasar; tetapkan gaji di **Karyawan → Edit → Gaji**, yang mencakup struktur lengkap (tensi dan potongan).
- **Satu email undangan**, dengan link yang berfungsi: sebelumnya email Supabase dan kami dikeduanya, dan yang kedua membuat link pertama tidak valid. Mengirim ulang ke siapa yang belum menyiapkan akun mereka sekarang berfungsi.
- Pengingat harian onboarding hanya memberi tahu HR tentang karyawan baru yang linknya kadaluarsa atau yang tidak pernah diundang, alih-alih mengirim email ke setiap karyawan pending dengan link yang tidak bisa mereka gunakan.

### Catatan upgrade (onboarding)

- Terapkan `20261006100000_onboarding_invites.sql` dan redeploy `invite-employee` dan `onboarding-reminders`. Fungsi `onboarding-request-notification` tidak lagi digunakan dan dapat dihapus dari proyek Anda.

### Email offboarding

- **Daftar periksa offboarding per departemen** (IT, HR, Keuangan, Fasilitas/Admin), diedit dari Onboarding → Berhenti → **Edit daftar periksa**.
- Saat HR memulai offboarding atau menyetujui pengunduran diri, mereka **memilih siapa yang menerima email daftar periksa**: siapa pun dalam tim (manajer pelaporan dan manajer departemen disarankan) dan alamat luar seperti it@company.com, dengan catatan opsional dan **preview**. Balasan akan dikirim ke orang HR yang mengirimkannya. **Pengingat** dikirim ke orang-orang yang sama pada hari kerja terakhir, dan email dapat dikirim ulang dari tab Berhenti.
- **Pengunduran diri dikirim melalui email** ke HR dan manajer pelaporan, dengan konfirmasi ke karyawan; persetujuan (dengan hari terakhir yang dikonfirmasi) dan penolakan dikirim melalui email ke karyawan.
- Daftar periksa kotak centang dalam aplikasi diganti oleh daftar periksa yang dikirim melalui email; tim mengonfirmasi dengan membalas email.

### Catatan upgrade (offboarding emails)

- Terapkan `20261009100000_offboarding_emails.sql`, deploy `offboarding-email` dan `offboarding-reminders`, dan jadwalkan pengingat (lihat panduan self-hosting).


- **Mulai offboarding** dari baris karyawan di Karyawan: alasan, tanggal pemberitahuan dan hari kerja terakhir. Mereka tetap aktif selama periode pemberitahuan dan ditampilkan sebagai "Berhenti <tanggal>".
- **Pengunduran diri**: karyawan dapat mengundurkan diri dari profil mereka dengan hari terakhir yang diusulkan; HR menyetujui (mengonfirmasi tanggal) atau menolak dengan catatan. Karyawan dapat menariknya kembali hingga disetujui.
- **Tab Berhenti** di Onboarding: pengunduran diri untuk ditinjau, semua orang yang berhenti dengan daftar periksa (setiap aset yang harus dikembalikan, yang mencentang itself saat aset dikembalikan, ditambah pengembalian, cuti, payroll akhir, penyerahan pekerjaan dan wawancara keluar, serta item Anda sendiri), dan siapa yang berhenti dalam 90 hari terakhir.
- **Otomatis pada hari terakhir**: besok pagi setelah hari kerja terakhir, orang tersebut ditandai sebagai offboarded, masuknya diblokir dan cuti yang belum diproses dibatalkan; HR dan manajer mereka diberi tahu. HR juga dapat menyelesaikannya pada hari itu, mengubah tanggal, atau membatalkannya.
- **Payroll** tidak lagi membayar orang yang telah berhenti, dan dihitung proporsional bulan terakhir hingga hari kerja terakhir. Laporan menghitung orang yang berhenti berdasarkan hari kerja terakhir mereka.
- **Status karyawan kini ditetapkan oleh alur kerja** (bergabung dan offboarding) dan ditampilkan sebagai read-only saat diedit; status **Tidak Aktif** yang tidak digunakan dan tindakan bulk "Tetapkan sebagai aktif / tidak aktif" telah dihapus.

### Catatan upgrade (offboarding)

- Terapkan `20261008100000_offboarding.sql`, redeploy `generate-monthly-payroll`, dan jadwalkan tugas harian: `select cron.schedule('process-employee-exits', '30 0 * * *', $$select public.process_employee_exits()$$);`

### Detail bank

- Detail bank karyawan kini mencakup **kode IFSC** (Karyawan → Edit → Pribadi). Format standar 11 karakter diperiksa dan ditampilkan pada slip gaji.

### Catatan upgrade (detail bank)

- Terapkan `20261007100000_bank_ifsc.sql`.

### Payroll di akhir bulan

- Payroll kini dibuat secara otomatis pada **hari terakhir setiap bulan** (sebelumnya tanggal 27).
- PDF slip gaji ditanggalkan pada **hari terakhir bulan gaji mereka** ("Dibuat pada 30 September 2026"), bukan hari diunduh.

### Catatan upgrade (payroll)

- Jadwalkan ulang tugas payroll: `select cron.schedule('monthly-payroll-generation', '0 9 $ * *', ...)` dengan perintah yang sama seperti sebelumnya (lihat [Tugas yang Dijadwalkan](docs/self-hosting.md)). Jadwalkan tugas dengan nama yang sama akan menggantinya.

### Lisensi

- Peoplo kini dilisensikan di bawah **AGPL-3.0** (sebelumnya MIT). Versi yang dirilis sebelum perubahan ini tetap tersedia di bawah MIT. Aplikasi menampilkan tautan **Kode sumber**, yang dapat dikonfigurasi dengan `VITE_REPO_URL`.

### Fitur

- **Izin per modul**: peran menetapkan akses tampil/kelola default untuk setiap modul (karyawan, onboarding, kehadiran, cuti, pengembalian, kinerja, aset, payroll, kalender, pengaturan), dan admin dapat memberikan akses tambahan pada satu orang dari **Pengaturan → Pengguna & akses**.
- **Akun hanya undangan**: tidak ada yang dapat mendaftar tanpa undangan. Undangan dikelola dari **Onboarding**, dapat dicabut atau diperpanjang, dan dapat dibatasi pada domain email yang disetujui.
- **Payroll**: pilih bulan saat membuat payroll; karyawan yang bergabung pertengahan bulan dihitung proporsional. PDF slip gaji mengikuti tata letak slip gaji standar. Halaman Payroll memiliki pemilih periode payroll yang membuka pada bulan terbaru dengan catatan.
- **Direktori rekan kerja** untuk karyawan, menampilkan hanya bidang yang aman.
- **Halaman landing dan fitur baru** yang menyajikan Peoplo sebagai open source, dengan pratinjau produk 3D yang dibuat ulang alih-alih tangkapan layar, dan panduan self-hosting.

### Perbaikan

- Tab Pending di Onboarding selalu kosong; dialog detail karyawan tidak menampilkan manajer.
- Mengedit aset menghapus tanggal pembelian dan vendor.
- Kartu ringkasan payroll mengabaikan bulan yang dipilih; formulir gaji kehilangan fokus pada setiap tekanan tombol.
- Filter, pengurutan dan ekspor cuti yang diproses tidak berfungsi; tanggal cuti dapat bergeser satu hari di beberapa zona waktu.
- Laporan: sumbu payroll dalam ₹, jumlah karyawan yang konsisten, sumbu bilangan bulat.
- Perhitungan dan penandaan kalender, rentang tanggal kalender tim, "status hari ini" di dasbor pada hari non-kerja.
- Pengiriman notifikasi, dan tautan dalam email kini menggunakan alamat aplikasi yang dikonfigurasi.
- Seluler: setiap halaman muat di layar ponsel, tabel menjadi kartu, dialog tetap menampilkan tombolnya, menu menutup saat navigasi, dan pinch-zoom bekerja lagi. Kontras teks dan label pembaca layar di seluruhnya.

### Keamanan

- Aturan akses setiap tabel dibangun ulang berdasarkan izin modul dan ditegakkan dengan keamanan baris, ditambah kebijakan restriktif yang mengunci pengguna yang diblokir.
- Pemicu melindungi perubahan sensitif: permintaan cuti dan pengembalian selalu dimulai sebagai pending dan hanya pengeset yang tepat yang dapat memutuskannya; kehadiran tidak dapat ditentukan mundur atau diedit setelah check-out; penilaian hanya dapat ditetapkan oleh pemiliknya; pengakuan ulasan dan dokumen onboarding diperiksa.
- Detail bank dipindahkan dari `employees` ke tabel terpisah `employee_bank_details`, dapat dibaca hanya oleh karyawan dan orang dengan akses payroll atau manajemen karyawan.
- Kebijakan penyimpanan mengikuti izin modul.
- Fungsi edge memverifikasi pemanggil dan izin mereka, memuat data dari basis data alih-alih mempercaya permintaan, melarikan semua HTML email, dan memvalidasi URL pengalihan undangan. Fungsi yang dijadwalkan memerlukan header `x-cron-secret`.

### Catatan upgrade

- Terapkan semua migrasi hingga `20261003100300_integrity_guards.sql` dengan `npx supabase db push`. Ini memindahkan detail bank ke tabel baru dan membangun ulang setiap aturan akses; ambil cadangan terlebih dahulu.
- Redeploy **semua** fungsi edge (`npx supabase functions deploy`).
- Tetapkan rahasia fungsi `APP_URL` (alamat `https://` situs Anda), `RESEND_FROM_EMAIL` dan `CRON_SECRET`. Fungsi yang dijadwalkan menolak setiap panggilan hingga `CRON_SECRET` ditetapkan; perbarui tugas `pg_cron` Anda untuk mengirimkannya dalam header `x-cron-secret` (lihat [Tugas yang Dijadwalkan](docs/self-hosting.md#part-6-scheduled-jobs)).
- Pengguna lama tetap mempertahankan peran mereka. Matikan **Izinkan pengguna baru untuk mendaftar** di Supabase Auth, dan tetapkan **Pengaturan → Daftar putih domain**.
- Opsional: tetapkan `VITE_REPO_URL` jika Anda menjalankan fork yang dimodifikasi.

[Unreleased]: https://github.com/redmonkin/core-hr-hub/compare/v1.1.1...HEAD