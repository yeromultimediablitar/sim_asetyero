/* Cangkang PWA untuk aplikasi Google Apps Script "SIM Karyawan & Aset". */
(function () {
  'use strict';

  // ===================== PENGATURAN: isi sekali =====================
  // Salin URL web app dari Apps Script (Deploy > Manage deployments), harus berakhiran /exec
  var URL_WEBAPP = 'https://script.google.com/macros/s/AKfycby5P7PGCH6gKGIfC45AsuTXORWoSOX1dFhwGkmtPSY9yiH5hUBIMl73q07_gYAq12c/exec';
  // 'otomatis' = tampilkan di dalam PWA (dengan cadangan otomatis).
  // 'langsung' = selalu buka aplikasi langsung tanpa bingkai (paling pasti berhasil bila bingkai bermasalah).
  var MODE_AWAL = 'otomatis';
  // ==================================================================

  var POLA_URL = /^https:\/\/script\.google\.com\/(?:a\/macros\/[A-Za-z0-9.\-]+|macros)\/s\/[A-Za-z0-9_\-]+\/exec$/;
  var POLA_ASAL = /^https:\/\/[a-z0-9.\-]+\.googleusercontent\.com$/;   // asal tanda "siap" dari aplikasi
  var BATAS_MUAT_MS = 25000;   // bingkai belum selesai dimuat
  var BATAS_SIAP_MS = 12000;   // bingkai termuat, tetapi aplikasi belum memberi tanda "siap"
  var KUNCI_MODE = 'pwa_mode';
  var NORMAL = 'normal', TANPA_KUKI = 'credentialless', LANGSUNG = 'langsung';
  var IZIN_BINGKAI = 'camera *; geolocation *; clipboard-write *; fullscreen *';

  var $ = function (id) { return document.getElementById(id); };
  var layarMuat = $('layar-muat'), layarPesan = $('layar-pesan'), barMasalah = $('bar-masalah');
  var frame = null, timerMuat = null, timerSiap = null, sudahMuat = false, siap = false;
  var tMulai = 0, tMuat = 0, tSiap = 0, pesanTerakhir = '(belum ada)';
  var swStatus = 'belum didaftarkan', manifestStatus = 'memeriksa...', ikonStatus = 'memeriksa...';
  var dukungTanpaKuki = 'credentialless' in document.createElement('iframe');
  var qs = (window.location && window.location.search) || '';
  var diag = /[?&]diag(?:[=&]|$)/.test(qs);
  var paksa = (/[?&]mode=(normal|credentialless|langsung)(?:&|$)/.exec(qs) || [])[1] || null;   // hanya untuk uji, tidak disimpan

  function modeTersimpan() {
    try { return localStorage.getItem(KUNCI_MODE); } catch (e) { return null; }
  }
  function simpanMode(m) { try { localStorage.setItem(KUNCI_MODE, m); } catch (e) { /* abaikan */ } }
  try { if (/[?&]reset(?:[=&]|$)/.test(qs)) { localStorage.removeItem(KUNCI_MODE); localStorage.removeItem('pwa_pasang_ditutup'); } } catch (e) { /* abaikan */ }

  function tentukanMode() {
    if (paksa === TANPA_KUKI) return dukungTanpaKuki ? TANPA_KUKI : NORMAL;
    if (paksa) return paksa;
    if (MODE_AWAL === 'langsung') return LANGSUNG;
    var m = modeTersimpan();
    if (m === LANGSUNG || (m === TANPA_KUKI && dukungTanpaKuki)) return m;
    return NORMAL;
  }
  var mode = tentukanMode();

  function tampilPesan(judul, isi, tombolLangsung) {
    $('pesan-judul').textContent = judul;
    $('pesan-isi').textContent = isi;
    var link = $('link-langsung');
    link.textContent = 'Buka tanpa PWA';
    if (tombolLangsung && POLA_URL.test(URL_WEBAPP)) { link.href = URL_WEBAPP; link.hidden = false; } else { link.hidden = true; }
    layarMuat.hidden = true;
    layarPesan.hidden = false;
  }

  function bukaLangsung() { window.location.replace(URL_WEBAPP); }   // tanpa bingkai

  // Mode langsung di TAB BROWSER: jangan mengalihkan otomatis. Halaman ini harus tetap terbuka agar Chrome bisa
  // menawarkan "Pasang aplikasi" (halaman yang langsung berpindah ke script.google.com tidak bisa dipasang).
  // Pengalihan otomatis hanya dilakukan saat dibuka dari ikon yang sudah terpasang (mode standalone).
  function tampilPeluncur() {
    $('pesan-judul').textContent = 'Aplikasi siap dibuka';
    $('pesan-isi').textContent = 'Pasang aplikasi ini di layar utama agar bisa dibuka dari ikonnya, atau buka sekarang.';
    var link = $('link-langsung');
    link.href = URL_WEBAPP; link.textContent = 'Buka aplikasi sekarang'; link.hidden = false;
    $('btn-coba').hidden = true;
    layarMuat.hidden = true;
    layarPesan.hidden = false;
  }

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
    sudahMuat = false; siap = false; tMulai = Date.now(); tMuat = 0; tSiap = 0;
    layarPesan.hidden = true; barMasalah.hidden = true;

    if (!POLA_URL.test(URL_WEBAPP)) {
      $('btn-coba').hidden = true;
      tampilPesan('URL aplikasi belum diatur',
        'Buka berkas app.js, lalu isi URL_WEBAPP dengan alamat web app Apps Script Anda (berakhiran /exec).', false);
      return;
    }
    $('btn-coba').hidden = false;
    if (mode === LANGSUNG) { if (standalone) { bukaLangsung(); } else { tampilPeluncur(); } return; }
    if (!navigator.onLine) { tampilPesan('Tidak ada koneksi internet', 'Aplikasi memerlukan internet. Periksa jaringan Anda, lalu coba lagi.', true); return; }

    layarMuat.hidden = false;
    buatFrame(mode === TANPA_KUKI).src = URL_WEBAPP;   // alamat apa adanya, tanpa parameter tambahan
    timerMuat = setTimeout(function () {
      if (!sudahMuat) tampilPesan('Memuat lebih lama dari biasa',
        'Koneksi mungkin lambat. Anda bisa mencoba lagi, atau membuka aplikasi tanpa PWA.', true);
    }, BATAS_MUAT_MS);
  }

  function saatFrameMuat() {
    if (!frame || !frame.getAttribute('src')) return;
    sudahMuat = true; tMuat = Date.now();
    clearTimeout(timerMuat); clearTimeout(timerSiap);
    layarMuat.hidden = true;
    layarPesan.hidden = true;
    timerSiap = setTimeout(gagalSiap, BATAS_SIAP_MS);
  }

  // Aplikasi mengirim {simReady:true} setelah semua skripnya termuat. Tanpa tanda itu, yang tampil kemungkinan
  // halaman error Google, jadi coba mode lain; bila tetap gagal tampilkan bar bantuan.
  function gagalSiap() {
    if (siap) return;
    if (mode === NORMAL && dukungTanpaKuki && !paksa) { mode = TANPA_KUKI; mulaiMuat(); return; }
    barMasalah.hidden = false;
  }

  window.addEventListener('message', function (e) {
    pesanTerakhir = String(e.origin) + ' -> ' + (function () { try { return JSON.stringify(e.data).slice(0, 60); } catch (x) { return '(tak terbaca)'; } })();
    if (!e.data || e.data.simReady !== true || !POLA_ASAL.test(e.origin)) return;
    siap = true; tSiap = Date.now();
    clearTimeout(timerSiap);
    barMasalah.hidden = true;
    if (mode !== LANGSUNG && !paksa) simpanMode(mode);   // ingat mode yang berhasil untuk peluncuran berikutnya
  });

  $('btn-coba').addEventListener('click', mulaiMuat);
  $('btn-langsung-sekali').addEventListener('click', bukaLangsung);
  $('btn-langsung-selalu').addEventListener('click', function () { simpanMode(LANGSUNG); bukaLangsung(); });
  $('btn-tutup-masalah').addEventListener('click', function () { barMasalah.hidden = true; });
  window.addEventListener('online', function () { if (!sudahMuat) mulaiMuat(); });
  window.addEventListener('offline', function () {
    if (!sudahMuat) tampilPesan('Tidak ada koneksi internet', 'Aplikasi memerlukan internet. Periksa jaringan Anda, lalu coba lagi.', true);
  });

  // ---------- pemeriksaan syarat pemasangan (untuk panel ?diag) ----------
  function periksaInstalasi() {
    if (typeof fetch !== 'function') { manifestStatus = 'fetch tidak tersedia'; ikonStatus = '-'; return; }
    fetch('manifest.webmanifest', { cache: 'no-store' }).then(function (res) {
      if (!res.ok) { manifestStatus = 'GAGAL: berkas tidak ditemukan (HTTP ' + res.status + ')'; ikonStatus = '-'; return null; }
      return res.json().then(function (m) {
        var ok = m && m.name && m.start_url && m.display && m.icons && m.icons.length;
        manifestStatus = ok ? 'OK (' + m.name + ', display=' + m.display + ')' : 'GAGAL: isi manifest tidak lengkap';
        if (!m.icons) { ikonStatus = 'GAGAL: tidak ada ikon'; return; }
        return Promise.all(m.icons.map(function (ic) {
          return fetch(ic.src, { cache: 'no-store' }).then(function (r) { return r.ok ? ic.sizes : null; }).catch(function () { return null; });
        })).then(function (hasil) {
          var baik = hasil.filter(Boolean), hilang = m.icons.length - baik.length;
          ikonStatus = hilang ? 'GAGAL: ' + hilang + ' dari ' + m.icons.length + ' ikon tidak ditemukan (folder icons sudah diunggah?)'
                              : baik.length + ' dari ' + m.icons.length + ' ikon OK (' + baik.join(', ') + ')';
        });
      });
    }).catch(function (e) { manifestStatus = 'GAGAL: ' + String((e && e.message) || e); ikonStatus = '-'; });
  }

  // ---------- panel diagnosa (?diag) ----------
  if (diag) {
    var panel = $('panel-diag'), teks = $('diag-teks');
    var detik = function (t) { return t ? ((t - tMulai) / 1000).toFixed(1) + ' dtk' : 'belum'; };
    var perbarui = function () {
      teks.textContent = [
        'Mode sekarang      : ' + mode + (paksa ? ' (dipaksa lewat alamat)' : ''),
        'Mode tersimpan     : ' + (modeTersimpan() || '-'),
        'credentialless     : ' + (dukungTanpaKuki ? 'didukung' : 'TIDAK didukung browser ini'),
        'Bingkai termuat    : ' + detik(tMuat),
        'Tanda "siap"       : ' + (siap ? 'DITERIMA ' + detik(tSiap) : 'belum'),
        'Pesan terakhir     : ' + pesanTerakhir,
        'Cookie diizinkan   : ' + (navigator.cookieEnabled === false ? 'tidak' : 'ya'),
        'Layar              : ' + window.innerWidth + 'x' + window.innerHeight,
        'Tampilan           : ' + (standalone ? 'APLIKASI TERPASANG (standalone)' : 'tab browser'),
        'Prompt pasang      : ' + (promptPasang ? 'SIAP (tombol Pasang tersedia)' : 'belum diterima dari browser'),
        'Service worker     : ' + swStatus,
        'Manifest           : ' + manifestStatus,
        'Ikon               : ' + ikonStatus,
        'HTTPS              : ' + (window.isSecureContext === false ? 'TIDAK (PWA tidak bisa dipasang)' : 'ya'),
        'Alamat halaman     : ' + String(window.location.href || '').slice(0, 90),
        'Browser            : ' + String(navigator.userAgent || '').slice(0, 100)
      ].join('\n');
    };
    panel.hidden = false;
    perbarui(); setInterval(perbarui, 1000);
    periksaInstalasi();
    $('btn-diag-normal').addEventListener('click', function () { mode = NORMAL; mulaiMuat(); });
    $('btn-diag-kuki').addEventListener('click', function () { mode = dukungTanpaKuki ? TANPA_KUKI : NORMAL; mulaiMuat(); });
    $('btn-diag-langsung').addEventListener('click', bukaLangsung);
  }

  // ---------- ajakan memasang ----------
  var promptPasang = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ditutup = false;
  try { ditutup = localStorage.getItem('pwa_pasang_ditutup') === '1'; } catch (e) { /* penyimpanan dibatasi */ }

  function tampilBarPasang(teksPasang, bisaPasang) {
    if (standalone || ditutup) return;
    $('teks-pasang').textContent = teksPasang;
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
  if (!('serviceWorker' in navigator)) swStatus = 'tidak didukung / bukan HTTPS';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        swStatus = 'terdaftar (scope ' + reg.scope + ')' + (navigator.serviceWorker.controller ? ', mengontrol halaman' : ', belum mengontrol halaman (muat ulang sekali)');
        var tawarkan = function (sw) { $('bar-update').hidden = false; $('btn-update').onclick = function () { sw.postMessage('SKIP_WAITING'); }; };
        if (reg.waiting && navigator.serviceWorker.controller) tawarkan(reg.waiting);
        reg.addEventListener('updatefound', function () {
          var baru = reg.installing;
          if (!baru) return;
          baru.addEventListener('statechange', function () {
            if (baru.state === 'installed' && navigator.serviceWorker.controller) tawarkan(baru);
          });
        });
      }).catch(function (e) { swStatus = 'GAGAL didaftarkan: ' + String((e && e.message) || e); /* PWA tetap berjalan tanpa service worker */ });
      var sudahMuatUlang = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (sudahMuatUlang) return; sudahMuatUlang = true; window.location.reload();
      });
    });
  }

  mulaiMuat();
})();
