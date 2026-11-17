/* Cangkang PWA untuk aplikasi Google Apps Script "SIM Karyawan & Aset". */
(function () {
  'use strict';

  // ===================== PENGATURAN: isi sekali =====================
  // Salin URL web app dari Apps Script (Deploy > Manage deployments), harus berakhiran /exec
  var URL_WEBAPP = 'https://script.google.com/macros/s/AKfycby5P7PGCH6gKGIfC45AsuTXORWoSOX1dFhwGkmtPSY9yiH5hUBIMl73q07_gYAq12c/exec';
  // ==================================================================

  var POLA_URL = /^https:\/\/script\.google\.com\/(?:a\/macros\/[A-Za-z0-9.\-]+|macros)\/s\/[A-Za-z0-9_\-]+\/exec$/;
  var POLA_ASAL = /^https:\/\/[a-z0-9.\-]+\.googleusercontent\.com$/;   // asal tanda "siap" dari aplikasi
  var BATAS_MUAT_MS = 25000;   // bingkai belum selesai dimuat
  var BATAS_SIAP_MS = 18000;   // bingkai termuat, tetapi aplikasi belum memberi tanda "siap"
  var KUNCI_MODE = 'pwa_mode';
  var NORMAL = 'normal', TANPA_KUKI = 'credentialless', LANGSUNG = 'langsung';
  var IZIN_BINGKAI = 'camera *; geolocation *; clipboard-write *; fullscreen *';

  var $ = function (id) { return document.getElementById(id); };
  var layarMuat = $('layar-muat'), layarPesan = $('layar-pesan'), barMasalah = $('bar-masalah');
  var frame = null, timerMuat = null, timerSiap = null, sudahMuat = false, siap = false;
  var dukungTanpaKuki = 'credentialless' in document.createElement('iframe');

  function bacaMode() {
    try { var m = localStorage.getItem(KUNCI_MODE); if (m === LANGSUNG || (m === TANPA_KUKI && dukungTanpaKuki)) return m; } catch (e) { /* penyimpanan dibatasi */ }
    return NORMAL;
  }
  function simpanMode(m) { try { localStorage.setItem(KUNCI_MODE, m); } catch (e) { /* abaikan */ } }
  try { if (/[?&]reset(?:[=&]|$)/.test(window.location.search)) localStorage.removeItem(KUNCI_MODE); } catch (e) { /* abaikan */ }
  var mode = bacaMode();

  function tampilPesan(judul, isi, tombolLangsung) {
    $('pesan-judul').textContent = judul;
    $('pesan-isi').textContent = isi;
    var link = $('link-langsung');
    if (tombolLangsung && POLA_URL.test(URL_WEBAPP)) { link.href = URL_WEBAPP; link.hidden = false; } else { link.hidden = true; }
    layarMuat.hidden = true;
    layarPesan.hidden = false;
  }

  function bukaLangsung() { window.location.replace(URL_WEBAPP); }   // tanpa bingkai: berfungsi walau bingkai diblokir akun Google

  function buatFrame(tanpaKuki) {
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    var f = document.createElement('iframe');
    f.className = 'app-frame';
    f.setAttribute('title', 'SIM Karyawan & Aset');
    f.setAttribute('allow', IZIN_BINGKAI);
    if (tanpaKuki) f.setAttribute('credentialless', '');   // tanpa cookie akun Google (seperti mode samaran)
    f.addEventListener('load', saatFrameMuat);
    document.body.insertBefore(f, document.body.firstChild);
    frame = f;
    return f;
  }

  function mulaiMuat() {
    clearTimeout(timerMuat); clearTimeout(timerSiap);
    sudahMuat = false; siap = false;
    layarPesan.hidden = true; barMasalah.hidden = true;

    if (!POLA_URL.test(URL_WEBAPP)) {
      $('btn-coba').hidden = true;
      tampilPesan('URL aplikasi belum diatur',
        'Buka berkas app.js, lalu isi URL_WEBAPP dengan alamat web app Apps Script Anda (berakhiran /exec).', false);
      return;
    }
    $('btn-coba').hidden = false;
    if (mode === LANGSUNG) { bukaLangsung(); return; }
    if (!navigator.onLine) { tampilPesan('Tidak ada koneksi internet', 'Aplikasi memerlukan internet. Periksa jaringan Anda, lalu coba lagi.', true); return; }

    layarMuat.hidden = false;
    var f = buatFrame(mode === TANPA_KUKI);
    f.src = URL_WEBAPP + (URL_WEBAPP.indexOf('?') < 0 ? '?' : '&') + 'pwa=1&t=' + Date.now();
    timerMuat = setTimeout(function () {
      if (!sudahMuat) tampilPesan('Memuat lebih lama dari biasa',
        'Koneksi mungkin lambat. Anda bisa mencoba lagi, atau membuka aplikasi tanpa PWA.', true);
    }, BATAS_MUAT_MS);
  }

  function saatFrameMuat() {
    if (!frame || !frame.getAttribute('src')) return;
    sudahMuat = true;
    clearTimeout(timerMuat); clearTimeout(timerSiap);
    layarMuat.hidden = true;
    layarPesan.hidden = true;
    timerSiap = setTimeout(gagalSiap, BATAS_SIAP_MS);
  }

  // Aplikasi mengirim {simReady:true} setelah semua skripnya termuat. Tanpa tanda itu, halaman kemungkinan
  // adalah halaman error Google (mis. akun Google ganda), sehingga coba mode lain secara otomatis.
  function gagalSiap() {
    if (siap) return;
    if (mode === NORMAL && dukungTanpaKuki) { mode = TANPA_KUKI; mulaiMuat(); return; }
    barMasalah.hidden = false;
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.simReady !== true || !POLA_ASAL.test(e.origin)) return;
    siap = true;
    clearTimeout(timerSiap);
    barMasalah.hidden = true;
    if (mode !== LANGSUNG) simpanMode(mode);   // ingat mode yang berhasil untuk peluncuran berikutnya
  });

  $('btn-coba').addEventListener('click', mulaiMuat);
  $('btn-langsung-sekali').addEventListener('click', bukaLangsung);
  $('btn-langsung-selalu').addEventListener('click', function () { simpanMode(LANGSUNG); bukaLangsung(); });
  $('btn-tutup-masalah').addEventListener('click', function () { barMasalah.hidden = true; });
  window.addEventListener('online', function () { if (!sudahMuat) mulaiMuat(); });
  window.addEventListener('offline', function () {
    if (!sudahMuat) tampilPesan('Tidak ada koneksi internet', 'Aplikasi memerlukan internet. Periksa jaringan Anda, lalu coba lagi.', true);
  });

  // ---------- ajakan memasang ----------
  var promptPasang = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ditutup = false;
  try { ditutup = localStorage.getItem('pwa_pasang_ditutup') === '1'; } catch (e) { /* penyimpanan dibatasi */ }

  function tampilBarPasang(teks, bisaPasang) {
    if (standalone || ditutup) return;
    $('teks-pasang').textContent = teks;
    $('btn-pasang').hidden = !bisaPasang;
    $('bar-pasang').hidden = false;
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptPasang = e;
    tampilBarPasang('Pasang aplikasi ini di layar utama agar lebih cepat dibuka.', true);
  });
  window.addEventListener('appinstalled', function () { $('bar-pasang').hidden = true; promptPasang = null; });

  $('btn-pasang').addEventListener('click', function () {
    if (!promptPasang) return;
    promptPasang.prompt();
    promptPasang.userChoice.then(function () { promptPasang = null; $('bar-pasang').hidden = true; });
  });
  $('btn-tutup-pasang').addEventListener('click', function () {
    $('bar-pasang').hidden = true;
    try { localStorage.setItem('pwa_pasang_ditutup', '1'); } catch (e) { /* abaikan */ }
  });

  // iOS Safari tidak punya tombol pasang otomatis
  var ua = navigator.userAgent || '';
  var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS && !standalone) tampilBarPasang('Untuk memasang: ketuk tombol Bagikan, lalu "Tambahkan ke Layar Utama".', false);

  // ---------- service worker & pembaruan cangkang ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        var tawarkan = function (sw) { $('bar-update').hidden = false; $('btn-update').onclick = function () { sw.postMessage('SKIP_WAITING'); }; };
        if (reg.waiting && navigator.serviceWorker.controller) tawarkan(reg.waiting);
        reg.addEventListener('updatefound', function () {
          var baru = reg.installing;
          if (!baru) return;
          baru.addEventListener('statechange', function () {
            if (baru.state === 'installed' && navigator.serviceWorker.controller) tawarkan(baru);
          });
        });
      }).catch(function () { /* PWA tetap berjalan tanpa service worker */ });
      var sudahMuatUlang = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (sudahMuatUlang) return; sudahMuatUlang = true; window.location.reload();
      });
    });
  }

  mulaiMuat();
})();
