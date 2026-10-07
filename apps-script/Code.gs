/**
 * BACKEND GOOGLE SPREADSHEET untuk aplikasi Identifikasi ABK
 * ----------------------------------------------------------
 * Cara pasang (ringkas, lihat README untuk detail):
 *  1. Buat Google Spreadsheet baru.
 *  2. Menu Ekstensi > Apps Script, hapus isi Code.gs, tempel seluruh file ini, Simpan.
 *  3. Terapkan > Deployment baru > Jenis: Aplikasi web
 *       - Jalankan sebagai : Saya
 *       - Yang memiliki akses : Siapa saja
 *  4. Salin URL Web App (berakhiran /exec) ke aplikasi (tombol Setelan) atau ke js/config.js.
 *
 * Data yang tersimpan:
 *  - Sheet "Rekap"  : satu baris per anak (identitas, skor & hasil tiap instrumen, kesimpulan, link PDF)
 *  - Sheet "Detail" : satu baris per butir pertanyaan (jawaban 1/0 dan skornya)
 *  - Folder Google Drive "Identifikasi ABK" : file PDF laporan & gambar tanda tangan
 * Menyimpan ulang data dengan ID yang sama akan MEMPERBARUI baris lama (tidak dobel).
 */

var SHEET_REKAP = 'Rekap';
var SHEET_DETAIL = 'Detail';
var NAMA_FOLDER = 'Identifikasi ABK';
var HEADER_DETAIL = ['ID', 'Nama', 'Tanggal Pemeriksaan', 'Instrumen', 'Kelompok', 'No', 'Pertanyaan', 'Bobot', 'Teknik', 'Ya=1/Tidak=0', 'Skor'];

function doGet(e) {
  return json_({ ok: true, pesan: 'Backend Identifikasi ABK aktif', spreadsheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.aksi !== 'simpan') throw new Error('Aksi tidak dikenal');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var waktu = new Date();

    // ---- file ke Drive (opsional) ----
    var linkPdf = '', linkTtd = '';
    if (data.pdfBase64 || data.ttdPng) {
      var folder = folder_();
      if (data.pdfBase64) {
        var namaPdf = String(data.fileName || 'IDENTIFIKASI.pdf').replace(/\.pdf$/i, '') + '_' + data.id + '.pdf';
        hapusFileLama_(folder, namaPdf);
        var pdf = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', namaPdf));
        linkPdf = pdf.getUrl();
      }
      if (data.ttdPng) {
        var namaTtd = 'TTD_' + data.id + '.png';
        hapusFileLama_(folder, namaTtd);
        linkTtd = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.ttdPng), 'image/png', namaTtd)).getUrl();
      }
    }

    // ---- sheet Rekap ----
    var rekap = [['Waktu Simpan', waktu]].concat(data.rekap);
    rekap.push(['Link PDF', linkPdf]);
    rekap.push(['Link Tanda Tangan', linkTtd]);
    var sh = sheet_(ss, SHEET_REKAP, rekap.map(function (p) { return p[0]; }));
    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    // tambahkan kolom baru bila ada
    rekap.forEach(function (p) {
      if (header.indexOf(p[0]) === -1) {
        header.push(p[0]);
        sh.getRange(1, header.length).setValue(p[0]).setFontWeight('bold');
      }
    });
    var row = header.map(function (h) {
      for (var i = 0; i < rekap.length; i++) if (rekap[i][0] === h) return rekap[i][1];
      return '';
    });
    var idCol = header.indexOf('ID') + 1;
    var barisLama = cariBaris_(sh, idCol, data.id);
    var diperbarui = barisLama > 0;
    if (diperbarui) {
      // jangan hapus link lama bila kali ini tidak mengirim file
      var lama = sh.getRange(barisLama, 1, 1, header.length).getValues()[0];
      ['Link PDF', 'Link Tanda Tangan'].forEach(function (k) {
        var c = header.indexOf(k);
        if (c > -1 && !row[c]) row[c] = lama[c];
      });
      sh.getRange(barisLama, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }

    // ---- sheet Detail ----
    var sd = sheet_(ss, SHEET_DETAIL, HEADER_DETAIL);
    hapusBarisId_(sd, data.id);
    if (data.detail && data.detail.length) {
      sd.getRange(sd.getLastRow() + 1, 1, data.detail.length, data.detail[0].length).setValues(data.detail);
    }

    return json_({ ok: true, diperbarui: diperbarui, linkPdf: linkPdf });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helper ---------- */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(ss, nama, header) {
  var sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e3f1ed');
    sh.setFrozenRows(1);
  }
  return sh;
}

function cariBaris_(sh, col, id) {
  if (col < 1 || sh.getLastRow() < 2) return -1;
  var f = sh.getRange(2, col, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return f ? f.getRow() : -1;
}

function hapusBarisId_(sh, id) {
  var n = sh.getLastRow();
  if (n < 2) return;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  // hapus dari bawah, kelompokkan baris berurutan agar cepat
  var i = ids.length - 1;
  while (i >= 0) {
    if (ids[i][0] === id) {
      var akhir = i;
      while (i - 1 >= 0 && ids[i - 1][0] === id) i--;
      sh.deleteRows(i + 2, akhir - i + 1);
    }
    i--;
  }
}

function folder_() {
  var it = DriveApp.getFoldersByName(NAMA_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAMA_FOLDER);
}

function hapusFileLama_(folder, nama) {
  var it = folder.getFilesByName(nama);
  while (it.hasNext()) it.next().setTrashed(true);
}

/** Jalankan sekali dari editor (tombol Run) untuk memberi izin akses Spreadsheet & Drive. */
function izinkanAkses() {
  folder_();
  SpreadsheetApp.getActiveSpreadsheet().getName();
}
