// i18n.js: BM and English strings. CB is the app namespace.
'use strict';
window.CB = window.CB || {};
(function(){
  const STR = {
    ms: {
      intro: 'Ambil gambar anak berdiri, kemudian cuba topi, baju, seluar dan kasut padanya.',
      takePhoto: 'Ambil gambar anak', pickPhoto: 'Pilih gambar dari galeri', tryDemo: 'Cuba dengan contoh dahulu',
      privacy: 'Gambar anak anda tidak dihantar ke mana-mana. Semua diproses dalam peranti ini sahaja dan hilang apabila halaman ditutup.',
      points: 'Titik badan', save: 'Simpan', hat: 'Topi', top: 'Baju', pants: 'Seluar', shoes: 'Kasut',
      upload: 'Pilih gambar', camera: 'Ambil gambar', samples: 'Contoh sedia ada', close: 'Tutup',
      garmentTip: 'Petua: letak pakaian rata di atas lantai atau cadar satu warna, dan ambil gambar dari atas. Latar akan dibuang sendiri.',
      flip: 'Balikkan', pair: 'Sepasang', reset: 'Asal', remove: 'Buang', done: 'Siap',
      size: 'Saiz', width: 'Lebar', height: 'Tinggi', length: 'Panjang', rotate: 'Pusing', bg: 'Buang latar',
      dragHint: 'Seret pada gambar untuk alih. Guna dua jari untuk besarkan dan pusing.',
      loading: 'Sedang mencari badan...', found: 'Badan dijumpai. Pilih pakaian di bawah.',
      notFound: 'Badan tidak dapat dikesan. Seret titik ke bahu, pinggul, lutut dan kaki anak.',
      offline: 'Pengesan tidak dapat dimuatkan. Seret titik ke badan anak.',
      ptsOn: 'Seret titik supaya kena pada badan, kemudian tekan Titik badan sekali lagi.',
      saved: 'Gambar disimpan.', addFor: 'Tambah', demoNote: 'Ini contoh sahaja. Tekan rumah untuk guna gambar anak.',
    },
    en: {
      intro: 'Take a photo of your child standing, then try a hat, top, pants and shoes on them.',
      takePhoto: 'Take a photo', pickPhoto: 'Choose from gallery', tryDemo: 'Try the example first',
      privacy: 'Your child\'s photo is not sent anywhere. Everything is processed on this device only and is gone when the page closes.',
      points: 'Body points', save: 'Save', hat: 'Hat', top: 'Top', pants: 'Pants', shoes: 'Shoes',
      upload: 'Choose image', camera: 'Take photo', samples: 'Ready-made examples', close: 'Close',
      garmentTip: 'Tip: lay the clothing flat on a plain floor or sheet and photograph it from above. The background is removed for you.',
      flip: 'Flip', pair: 'Pair', reset: 'Reset', remove: 'Remove', done: 'Done',
      size: 'Size', width: 'Width', height: 'Height', length: 'Length', rotate: 'Rotate', bg: 'Remove bg',
      dragHint: 'Drag on the picture to move. Use two fingers to resize and rotate.',
      loading: 'Finding the body...', found: 'Body found. Pick clothes below.',
      notFound: 'Could not detect the body. Drag the points onto the shoulders, hips, knees and feet.',
      offline: 'The detector could not load. Drag the points onto the body.',
      ptsOn: 'Drag the points onto the body, then press Body points again.',
      saved: 'Picture saved.', addFor: 'Add', demoNote: 'This is only an example. Press home to use your child\'s photo.',
    },
  };
  let lang = 'ms';
  try { lang = localStorage.getItem('cb-lang') || 'ms'; } catch (e) {}
  CB.t = (k) => (STR[lang] && STR[lang][k]) || STR.en[k] || k;
  CB.lang = () => lang;
  CB.setLang = (l) => { lang = l; try { localStorage.setItem('cb-lang', l); } catch (e) {} CB.applyText(); };
  CB.applyText = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = CB.t(el.dataset.t); });
    document.getElementById('langBtn').textContent = lang === 'ms' ? 'BM' : 'EN';
    document.getElementById('oLang').textContent = lang === 'ms' ? 'English' : 'Bahasa Melayu';
  };
})();
