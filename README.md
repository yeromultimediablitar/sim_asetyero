# SIM Karyawan & Aset — cangkang PWA (GitHub Pages)

Folder ini adalah "cangkang" PWA yang menampilkan aplikasi Google Apps Script layar penuh dan
membuatnya bisa dipasang di layar utama HP/komputer. Aplikasi sebenarnya tetap berjalan di Apps Script.

## Urutan penting
1. Deploy `Kode.gs` + `Index.html` terbaru di Apps Script (versi baru) **lebih dulu**. Cangkang bergantung pada tanda
   "siap" yang dikirim `Index.html`; tanpa itu cangkang mengira aplikasi gagal dimuat.
2. Baru unggah folder ini ke GitHub.

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

## Bila aplikasi tidak tampil (halaman error Google di dalam PWA)
Kadang browser yang sedang login ke akun Google (terutama lebih dari satu akun) membuat Google menolak aplikasi
yang ditanam di bingkai. Cangkang menanganinya otomatis, berurutan:
1. Memuat normal. Bila aplikasi tidak memberi tanda "siap" dalam 18 detik...
2. ...mencoba mode **tanpa cookie akun Google** (atribut `credentialless`, hanya Chrome/Edge/Brave).
3. Bila masih gagal, muncul bar **"Aplikasi tidak tampil?"** dengan tombol **Buka langsung** / **Selalu buka langsung**
   (membuka aplikasi tanpa bingkai).

Mode yang berhasil diingat untuk peluncuran berikutnya.

### Mode diagnosa
Buka alamat PWA dengan tambahan `?diag` (contoh `https://NAMAANDA.github.io/sim-karyawan/?diag`). Panel kecil di atas layar
menampilkan: mode yang dipakai, apakah browser mendukung `credentialless`, kapan bingkai termuat, apakah tanda "siap"
dari aplikasi diterima, dan pesan terakhir dari bingkai. Tiga tombol di panel mencoba tiap mode satu per satu.
Kirim tangkapan layar panel ini bila ada masalah.

Untuk menguji satu mode saja: `?mode=normal`, `?mode=credentialless`, atau `?mode=langsung`.

### Memaksa buka langsung untuk semua pengguna
Di `app.js` ubah `var MODE_AWAL = 'otomatis';` menjadi `'langsung'`, lalu unggah ulang. PWA hanya menjadi pintasan
berikon yang membuka aplikasi langsung (tanpa bingkai), cara yang paling pasti berhasil. Untuk mengembalikan ke mode normal, buka alamat PWA
dengan tambahan `?reset` (contoh: `https://NAMAANDA.github.io/sim-karyawan/?reset`).
Catatan: pada mode `credentialless`, sesi login tidak disimpan antar peluncuran (harus login tiap kali dibuka).

## Tidak bisa dipasang?
Buka `?diag` dan baca baris **Tampilan**, **Prompt pasang**, **Service worker**, **Manifest**, **Ikon**, dan **HTTPS**.
Penyebab yang paling sering:
1. **Mode "buka langsung" tersimpan** (dari tombol "Selalu buka langsung" atau `MODE_AWAL = 'langsung'`). Halaman yang
   langsung berpindah ke script.google.com tidak bisa dipasang. Sekarang di tab browser halaman TETAP terbuka
   (tampil layar "Aplikasi siap dibuka"); pengalihan otomatis hanya terjadi saat dibuka dari ikon yang sudah terpasang.
   Buka alamat dengan `?reset` untuk membersihkan pilihan lama.
2. **Folder `icons` tidak ikut terunggah** (baris Ikon menyebut GAGAL). Unggah ulang foldernya.
3. **Bukan Chrome/Edge.** Brave dan beberapa browser lain tidak menyediakan "Pasang aplikasi" penuh.
4. **Ajakan pasang pernah ditutup.** Pakai menu browser (Chrome: tiga titik, lalu *Pasang aplikasi*), atau buka `?reset`.
5. **Service worker belum aktif.** Buka halaman, tunggu beberapa detik, muat ulang sekali.
Catatan: "Tambahkan ke layar utama" hanya membuat pintasan. Yang Anda cari adalah **"Pasang aplikasi"**.
