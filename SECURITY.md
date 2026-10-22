# Kebijakan Keamanan

## Melaporkan Kerentanan

Silakan **jangan** melaporkan kerentanan keamanan melalui issue GitHub publik, diskusi, atau pull request.

Laporkan secara pribadi melalui GitHub: buka tab **Security** dari repositori dan pilih **Report a vulnerability**. Sertakan:

- apa masalahnya dan di mana ia berada (file, edge function, tabel, atau halaman),
- langkah-langkah untuk mereproduksi, atau bukti konsep,
- dampak yang Anda perkirakan (misalnya, data apa yang dapat dibaca atau diubah oleh pengguna lain).

Kami berkomitmen untuk mengakui laporan dalam 3 hari kerja dan akan memperbarui Anda saat penyelidikan berlangsung. Setelah perbaikan dirilis, kami senang memberi kredit di catatan rilis kecuali Anda lebih suka tetap anonim.

## Versi yang Didukung

Perbaikan keamanan mendarat di `main` dan dalam rilis berikutnya. Deploi self-hosting harus memperbarui ke rilis terbaru dan menerapkan migrasi serta edge function baru (lihat [Memperbarui ke versi baru](docs/self-hosting.md#updating-to-a-new-version)).

## Cakupan

Dalam cakupan: frontend repositori ini, migrasi SQL (kebijakan keamanan baris-level, fungsi dan trigger database), dan Supabase edge function. Contoh: satu karyawan membaca gaji atau dokumen karya lain, pengguna yang bertindak pada modul yang tidak memiliki izin, akun yang diblokir atau tidak diundang mendapatkan akses, atau template email yang merender input yang tidak diescape.

Di luar cakupan: kerentanan di Supabase, Resend, atau layanan pihak ketiga lainnya (laporkan ke vendor), temuan yang memerlukan akun atau perangkat admin yang sudah dikompromisasi, dan header keamanan yang kurang tanpa dampak yang terbukti.

## Bagaimana HRISINDO Melindungi Data

- Akses ditegakkan oleh Postgres row-level security menggunakan izin per modul, tidak hanya oleh UI.
- Akun hanya dengan undangan, dapat dibatasi ke domain email yang disetujui, dan pengguna yang diblokir ditolak di semua tempat oleh kebijakan yang ketat.
- Trigger mengawasi perubahan sensitif: tidak ada persetujuan sendiri untuk cuti atau reimbursement, tidak ada attendance yang di-backdate, rating hanya oleh pemiliknya, detail bank di tabel terpisah.
- Edge function memverifikasi pemanggil, memeriksa izin modul, dan mengescape semua nilai di HTML email. Function terjadwal memerlukan header rahasia.

## Catatan untuk Self-Hosters

- Kunci **anon/publishable** Supabasenya publik dan disisipkan di website. Jangan pernah expose **service role key** ke browser; ia milik edge function rahasia saja.
- Jaga agar `CRON_SECRET` panjang dan acak, dan rotasikan (rahasia function dan pekerjaan terjadwal bersamaan) jika mungkin bocor.
- Matikan pendaftaran publik di Supabase Auth dan atur **Settings → Domain whitelist** ke domain perusahaan Anda.
- Jaga agar `RESEND_FROM_EMAIL` pada domain yang Anda miliki dan telah diverifikasi di Resend.