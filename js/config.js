/*
 * KONFIGURASI APLIKASI
 * --------------------
 * SCRIPT_URL : URL Web App dari Google Apps Script (berakhiran /exec).
 *              Jika dikosongkan, URL bisa diisi lewat tombol "Setelan" di aplikasi
 *              (tersimpan di browser masing-masing pengguna).
 */
const CONFIG = {
  SCRIPT_URL: "",
  KOTA_DEFAULT: "Jakarta",
  JABATAN_DEFAULT: "Pemeriksa",
  SIMPAN_PDF_KE_DRIVE: true,
  TAMPILKAN_SUMBER: true,
  SUMBER:
    "Hasil ini adalah screening awal dugaan hambatan pada anak untuk dilakukan asesmen lanjutan.",
};
