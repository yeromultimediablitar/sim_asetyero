# SIM Karyawan & Aset — cangkang PWA (GitHub Pages)

Folder ini adalah "cangkang" PWA yang menampilkan aplikasi Google Apps Script layar penuh dan
membuatnya bisa dipasang di layar utama HP/komputer. Aplikasi sebenarnya tetap berjalan di Apps Script.

## Langkah 1 — isi URL web app
1. Apps Script: **Deploy > Manage deployments**, salin **Web app URL** (berakhiran `/exec`).
2. Buka `app.js`, ganti `GANTI_DENGAN_URL_WEB_APP_ANDA` dengan URL itu.

## Langkah 2 — unggah ke GitHub
1. Buat repository baru (mis. `sim-karyawan`). Akun gratis: repository harus **Public**.
2. Unggah SEMUA isi folder ini, termasuk folder `icons` dan berkas `.nojekyll`.
3. **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Simpan.
4. Tunggu 1–2 menit. Alamatnya: `https://NAMAANDA.github.io/sim-karyawan/`

## Langkah 3 — pasang di perangkat
- Android (Chrome): ketuk tombol **Pasang** yang muncul, atau menu ⋮ > *Pasang aplikasi*.
- iPhone (Safari): **Bagikan > Tambahkan ke Layar Utama**.
- Komputer (Chrome/Edge): ikon pasang di bilah alamat.

## Memperbarui
- Perubahan di Apps Script: deploy **versi baru** (URL tetap). Tidak perlu menyentuh GitHub.
- Perubahan berkas di folder ini: naikkan `CACHE` di `sw.js` (v1 -> v2), lalu unggah ulang.

## Jangan taruh rahasia di repository ini
Repository bersifat publik. URL web app memang bukan rahasia (aplikasi dilindungi login), tetapi jangan
menyimpan password, token, atau ID spreadsheet di sini.
