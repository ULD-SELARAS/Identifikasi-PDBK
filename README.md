# Identifikasi Anak Berkebutuhan Khusus (ABK)

Aplikasi web berbentuk ceklis untuk instrumen identifikasi ABK. Fitur:

- 10 instrumen: Penglihatan, Pendengaran, Intelektual (Tunagrahita), Fisik Motorik, Emosi (Tunalaras), Autism, ADHD/GPPH, Slow Learner, Kesulitan Belajar (Disleksia/Disgrafia/Diskalkulia), dan Cerdas Istimewa
- Skor dihitung otomatis dengan rumus yang sama seperti di spreadsheet: **skor = bobot × (Ya = 1, Tidak = 0)**. Hasilnya **"Diduga …"** bila skor gejala ≥ 100, dan **"Tidak teridentifikasi"** bila kurang dari 100
- Kesimpulan dugaan gabungan, ditambah narasi kesimpulan yang bisa diisi otomatis lalu diedit
- Tanda tangan guru/pemeriksa: digambar langsung di layar atau diunggah dari foto
- Unduh laporan PDF (format seperti contoh: identitas, tabel instrumen, rekap, kesimpulan, dan tanda tangan)
- Simpan ke Google Spreadsheet (sheet **Rekap** dan **Detail**). File PDF juga bisa ikut tersimpan ke Google Drive
- Isian otomatis tersimpan di browser sebagai draf, jadi tidak hilang kalau halaman tertutup

---

## 1. Hubungkan ke Google Spreadsheet (sekali saja)

1. Buka <https://sheets.new> untuk membuat Google Spreadsheet baru, lalu beri nama, misalnya **Data Identifikasi ABK**.
2. Pilih menu **Ekstensi → Apps Script**.
3. Hapus semua isi `Code.gs`, lalu tempel seluruh isi file [`apps-script/Code.gs`](apps-script/Code.gs). Klik **Simpan** 💾.
4. Pilih fungsi **`izinkanAkses`** di toolbar, lalu klik **Jalankan**. Ikuti langkah pemberian izin: pilih akun, klik *Advanced/Lanjutan*, lalu *Go to … (unsafe)* dan *Allow/Izinkan*. Izin ini dipakai untuk menulis ke spreadsheet dan menyimpan PDF ke Drive.
5. Klik **Terapkan → Deployment baru**, klik ikon ⚙ lalu pilih **Aplikasi web**:
   - *Jalankan sebagai*: **Saya**
   - *Yang memiliki akses*: **Siapa saja** (*Anyone*)
6. Klik **Terapkan**, lalu salin **URL aplikasi web** (berakhiran `/exec`).
7. Tempel URL tersebut di salah satu tempat ini:
   - **`js/config.js`** pada `SCRIPT_URL: "…"`. Cara ini disarankan karena semua guru otomatis memakai URL yang sama.
   - Atau tombol **⚙ Setelan** di aplikasi. Dengan cara ini URL hanya tersimpan di browser yang dipakai saat mengisi.

> Jika nanti `Code.gs` diubah, pilih **Terapkan → Kelola deployment → ✎ Edit → Versi: Versi baru → Terapkan** agar URL tetap sama.

Sheet `Rekap` dan `Detail` dibuat otomatis saat data pertama kali disimpan. Kalau data anak yang sama disimpan ulang (ID sama), baris lamanya **diperbarui** sehingga tidak muncul dobel.

## 2. Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `identifikasi-abk`.
2. Unggah **seluruh isi folder ini** (termasuk folder `css`, `js`, `apps-script`, dan file `.nojekyll`). Bisa lewat **Add file → Upload files**, atau dengan perintah:
   ```bash
   git init && git add . && git commit -m "Aplikasi identifikasi ABK"
   git branch -M main
   git remote add origin https://github.com/USERNAME/identifikasi-abk.git
   git push -u origin main
   ```
3. Di repository, buka **Settings → Pages**. Pada *Source*, pilih **Deploy from a branch**, lalu *Branch*: **main** / **(root)**, dan klik **Save**.
4. Setelah 1–2 menit, aplikasi bisa dibuka di `https://USERNAME.github.io/identifikasi-abk/`.

## 3. Cara pakai

1. Isi **Identitas Anak**.
2. Buka tab tiap instrumen, lalu pilih **Ya** atau **Tidak** untuk setiap gejala. Tombol **Sisanya Tidak** mengisi butir yang belum dijawab dengan "Tidak". Mengklik ulang pilihan yang sama akan membatalkannya.
3. Di bagian **Kesimpulan**, dugaan tampil otomatis. Centang instrumen yang ingin dicetak, lalu klik **Isi otomatis** untuk membuat narasi kesimpulan dan edit seperlunya.
4. Isi **Tanda tangan**: kota, tanggal, dan nama pemeriksa, lalu tanda tangan di kotak yang tersedia.
5. Klik **Pratinjau & Unduh PDF** dan/atau **Simpan ke Spreadsheet**.
6. Klik **Formulir baru** untuk anak berikutnya. Nama asesor, sekolah, dan tanda tangan tetap terisi.

## Struktur file

```
index.html              halaman aplikasi
css/style.css           tampilan aplikasi
css/laporan.css         tampilan laporan PDF / cetak
js/config.js            pengaturan (URL Apps Script, kota default, dll.)
js/instrumen.js         daftar pertanyaan, bobot, teknik & batas skor (edit di sini)
js/app.js               logika aplikasi
js/vendor/html2pdf…     pustaka pembuat PDF (disertakan, tanpa CDN)
apps-script/Code.gs     backend Google Spreadsheet
```

## Catatan perbedaan dari file Excel

- Excel **Penglihatan butir B13** ("Penglihatan teropong") memakai rumus `=SUM(F36)`, sehingga skornya hanya 1. Butir lain memakai `bobot × jawaban`. Di aplikasi ini butir tersebut disamakan menjadi `20 × jawaban`, sesuai bobotnya.
- Beberapa salah ketik diperbaiki, misalnya "kontrak mata" → "kontak mata", "DISKLEKSIA" → "Disleksia", "inisitif" → "inisiatif", dan "menyali" → "menyalin".

Hasil aplikasi ini adalah **dugaan awal (identifikasi)**, bukan diagnosis. Hasilnya perlu ditindaklanjuti dengan asesmen oleh tenaga ahli.
