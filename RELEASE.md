# Proses Rilis

Dokumen ini menjelaskan cara membuat rilis baru Peoplo.

## Penomoran Versi

Peoplo mengikuti [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Perubahan yang memerlukan migrasi
- **Minor** (0.X.0): Fitur baru, kompatibel mundur
- **Patch** (0.0.X): Perbaikan bug, kompatibel mundur

## Langkah Rilis Cepat

### 1. Tingkatkan Versi

Jalankan skrip peningkatan versi:

```bash
# Untuk perbaikan bug
./scripts/bump-version.sh patch

# Untuk fitur baru
./scripts/bump-version.sh minor

# Untuk perubahan yang memecah
./scripts/bump-version.sh major
```

### 2. Perbarui Changelog

Pindahkan entri di bawah **[Unreleased]** di [`CHANGELOG.md`](CHANGELOG.md) ke bagian versi baru, termasuk **Catatan Upgrade** untuk self-hosters (migrasi baru, rahasia atau langkah manual).

Lalu perbarui array `LOCAL_CHANGELOG` di `src/lib/version.ts`, yang ditampilkan oleh halaman "What's New" dalam aplikasi saat GitHub tidak dapat dihubungi:

```typescript
const LOCAL_CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.0",
    date: "2025-01-20",
    type: "minor",
    title: "New Feature Release",
    description: "Added new functionality",
    changes: [
      { type: "feature", text: "Added employee bulk import" },
      { type: "fix", text: "Fixed date picker timezone issue" },
      { type: "security", text: "Updated dependencies" },
    ],
  },
  // ... previous versions
];
```

### 3. Commit dan Tag

```bash
git add .
git commit -m "chore: release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

### 4. Buat Rilis GitHub

1. Buka [GitHub Releases](https://github.com/redmonkin/core-hr-hub/releases/new)
2. Pilih tag baru Anda (misalnya, `v1.1.0`)
3. Tetapkan judul rilis (misalnya, "v1.1.0 - New Feature Release")
4. Tambahkan catatan rilis menggunakan format ini:

```markdown
## New Features
- Added employee bulk import
- Added CSV export for reports

## Bug Fixes
- Fixed date picker timezone issue
- Fixed pagination on mobile

## Security
- Updated dependencies to patch vulnerabilities
```

5. Klik **Publish Release**

## Cara Kerja Pemeriksaan Versi

### Untuk Pengguna Self-Hosted

1. Aplikasi menyertakan konstanta `APP_VERSION` yang di-hardcode
2. Saat startup, aplikasi memanggil fungsi edge `version-check`
3. Fungsi edge mengambil rilis terbaru dari GitHub API
4. Jika versi yang lebih baru ada, pengguna melihat notifikasi pembaruan
5. Pengguna kemudian dapat menarik perubahan terbaru dari GitHub

### Untuk Pengguna Lovable Cloud

Pembaruan diterapkan secara otomatis saat kode di-deploy.

## Jenis Perubahan

Gunakan jenis ini dalam entri changelog Anda:

| Type | Description |
|------|-------------|
| `feature` | New functionality |
| `fix` | Bug fixes |
| `security` | Security patches |
| `docs` | Documentation updates |
| `breaking` | Breaking changes |

## Pengaturan Pengembangan

Jalankan skrip pengaturan untuk menginstal git hooks:

```bash
./scripts/setup.sh
```

Ini menginstal:
- **Pre-commit hook**: Memvalidasi format versi (semver) dan memastikan `LOCAL_CHANGELOG` berisi entri untuk `APP_VERSION` saat ini

## Git Hooks

### Pre-commit Hook

Pre-commit hook berjalan otomatis saat Anda melakukan commit pada perubahan di `src/lib/version.ts` dan memvalidasi:

1. **Format versi**: Harus semver yang valid (X.Y.Z)
2. **Entri changelog**: `LOCAL_CHANGELOG` harus berisi entri yang cocok dengan `APP_VERSION`
3. **Sinkronisasi cadangan**: Memberi peringatan jika `FALLBACK_VERSION_RESPONSE.currentVersion` tidak cocok

Untuk melewati hook dalam keadaan darurat:
```bash
git commit --no-verify -m "your message"
```

## Peningkatan Versi Manual

Jika Anda lebih suka tidak menggunakan skrip, edit `src/lib/version.ts` secara manual:

```typescript
// Update this line
export const APP_VERSION = "1.1.0";
```

Dan perbarui `FALLBACK_VERSION_RESPONSE.releaseDate` ke tanggal hari ini.