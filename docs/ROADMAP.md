# Peta Jalan Peoplo

Status: per 2026-10-06. Tidak ada yang di bawah ini komitmen permanen; pemelihara meninjau kembali saat prioritas berubah. Ide dan permintaan selamat datang sebagai [GitHub issues](https://github.com/redmonkin/core-hr-hub/issues).

## Berikutnya

- **Rilis v1.2.0**: tag pekerjaan yang terdaftar di [Unreleased](../CHANGELOG.md#unreleased) dan terbitkan di GitHub Releases, agar self-hosters mendapat pemberitahuan pembaruan.
- **Email autentikasi bermerek**: sesuaikan template undangan dan reset kata sandi Supabase (**Authentication → Emails → Templates**) agar sesuai dengan Peoplo.

## Dilakukan: instance ter hosted dan operasional

Diperlukan sebelum instance ter hosted (peoplo.redmonk.in) tumbuh.

- [ ] **Cadangan database.** Pindahkan proyek ke rencana dengan cadangan harian, atau jalankan `npx supabase db dump` dalam jadwal ke penyimpanan pribadi. Jangan gunakan artifacts GitHub Actions: pada repositori publik orang lain dapat mengunduhnya.
- [ ] **Ketersediaan dan pemantauan error.** Satu pemantauan ketersediaan di beranda dan satu edge function; pelacakan error lebih lanjut (membutuhkan pembaruan CSP di `vercel.json`).
- [ ] **Kebijakan privasi dan syarat-syarat ditinjau.** Mintalah pengacara meninjau `/privacy-policy` dan `/terms-of-service` untuk DPDP Act 2023 India (dan GDPR untuk karyawan UE). Biarkan self-hosters menunjuk ke dokumen mereka sendiri.
- [ ] **Jeda rencana gratis.** Supabase menghentikan proyek gratis setelah sekitar satu minggu tanpa aktivitas; workspace produksi harus pada rencana berbayar.

## Ide, belum dirancang

- Ekspor data untuk admin ( semua catatan sebagai Excel atau JSON).
- Single sign-on (Google Workspace / Microsoft) untuk pengguna yang diundang.
- Aturan akumulasi cuti dan penggulirannya.
- Laporan statutory (PF, ESI, pajak profesional) dan pembuatan Form 16.