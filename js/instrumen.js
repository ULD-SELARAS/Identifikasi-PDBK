/*
 * DATA INSTRUMEN IDENTIFIKASI
 * Disalin dari file INSTRUMEN_IDENTIFIKASI.xlsx.
 *
 * Rumus (sama seperti di spreadsheet):
 *   Skor butir   = BOBOT x jawaban (Ya = 1, Tidak = 0)
 *   Skor gejala  = jumlah skor butir dalam satu kelompok
 *   Kesimpulan   = jika Skor gejala >= AMBANG (100) -> "Diduga <dugaan>"
 *                  jika kurang dari 100             -> "Tidak teridentifikasi"
 *
 * Format butir: [pertanyaan, bobot, teknik]
 * Untuk menambah / mengubah butir cukup edit file ini.
 */

const AMBANG = 100;

const TEKNIK = {
  1: "Observasi",
  2: "Wawancara",
  3: "Dokumen",
  4: "Perintah",
  5: "Gabungan 1,2,3",
};

const INSTRUMEN = [
  {
    id: "penglihatan",
    nama: "Penglihatan",
    judul: "IDENTIFIKASI HAMBATAN PENGLIHATAN",
    temuanLabel: "hambatan penglihatan",
    groups: [
      {
        kode: "A",
        label: "A. Buta",
        dugaan: "Tunanetra total",
        items: [
          ["Tidak dapat melihat tetapi dapat membedakan sumber cahaya", 100, 4],
          ["Tidak dapat melihat tetapi dapat memahami bayangan benda", 100, 4],
          ["Tidak dapat melihat tetapi dapat membedakan benda bergerak", 100, 4],
          ["Hanya dapat membedakan gelap dan terang", 100, 4],
          ["Tidak dapat membedakan gelap dan terang", 100, 4],
        ],
      },
      {
        kode: "B",
        label: "B. Low Vision",
        dugaan: "Low vision",
        items: [
          ["Kurang melihat (kabur), tidak mampu menghitung jari asesor dalam jarak 1 m", 60, 4],
          ["Kesulitan mengambil benda kecil di dekatnya", 15, 4],
          ["Tidak dapat menulis mengikuti garis lurus", 15, 4],
          ["Sering meraba dan tersandung waktu berjalan", 15, 1],
          ["Bagian bola mata yang hitam berwarna keruh/ bersisik/ kering", 15, 1],
          ["Mata bergoyang terus (nistagmus)", 15, 1],
          ["Peradangan hebat pada kedua bola mata", 15, 1],
          ["Penglihatan periperal (melihat tepi), yang ditandai dengan kemampuan melihat bagian samping tetapi tidak mampu melihat bagian tengah (fokus)", 20, 4],
          ["Mampu menulis huruf awas (dengan ukuran besar) dan braille", 20, 4],
          ["Mampu membaca huruf awas (dengan ukuran besar) dan braille", 20, 4],
          ["Mampu melakukan mobilitas di lingkungan yang sudah dikenal tanpa alat bantu", 20, 4],
          ["Dapat membedakan warna solid", 20, 4],
          ["Penglihatan teropong, yang ditandai dengan kemampuan melihat seperti orang menggunakan teropong/ sempit", 20, 4],
        ],
      },
    ],
  },
  {
    id: "pendengaran",
    nama: "Pendengaran",
    judul: "IDENTIFIKASI HAMBATAN PENDENGARAN",
    temuanLabel: "hambatan pendengaran",
    groups: [
      {
        kode: "A",
        label: "A. Berat/ menyeluruh",
        dugaan: "Tunarungu berat/menyeluruh",
        items: [
          ["Tidak memahami perintah (bicara sangat keras/ teriak) dalam jarak 1 m", 100, 4],
          ["Ucapan kata tidak jelas dan sulit dipahami", 100, 4],
        ],
      },
      {
        kode: "B",
        label: "B. Sedang/ sebagian",
        dugaan: "Tunarungu sebagian",
        items: [
          ["Tidak memahami perintah dalam jarak lebih 1 m", 60, 4],
          ["Sering memiringkan kepala dalam usaha mendengar", 10, 4],
          ["Banyak perhatian terhadap getaran", 20, 1],
          ["Tidak ada reaksi terhadap bunyi di dekatnya lebih 1 meter", 60, 4],
          ["Terlambat dalam perkembangan bahasa", 40, 2],
          ["Sering menggunakan isyarat dalam berkomunikasi", 40, 4],
          ["Kurang atau tidak tanggap bila diajak bicara", 20, 4],
        ],
      },
    ],
  },
  {
    id: "intelektual",
    nama: "Intelektual (Tunagrahita)",
    judul: "IDENTIFIKASI HAMBATAN INTELEKTUAL KATEGORI TUNAGRAHITA",
    temuanLabel: "hambatan intelektual",
    groups: [
      {
        kode: "",
        label: "IDENTIFIKASI HAMBATAN INTELEKTUAL KATEGORI TUNAGRAHITA",
        dugaan: "Tunagrahita",
        items: [
          ["Tingkat kecerdasan jauh di bawah normal", 20, 4],
          ["Mengalami kelambatan dalam segala hal kalau dibandingkan dengan anak-anak normal usia sebaya, baik di tinjau dari psikis, sosial, dan kemampuan fisik", 20, 4],
          ["Tidak dapat konsentrasi terlalu lama (lekas bosan)", 20, 4],
          ["Daya abstraksi sangat kurang", 20, 4],
          ["Perbendaharaan kata sangat terbatas", 20, 4],
          ["Perilakunya kurang luwes/fleksibel", 20, 4],
          ["Pikiran, ingatan, kemauan, dan sifat-sifat mental lainnya sedemikian terbelakang kalau dibandingkan dengan anak normal sebaya", 20, 4],
          ["Jari kaki dan tangan pendek tebal", 5, 1],
          ["Alis tumbuh mengikuti garis ke atas keluar (Epicantus)", 5, 1],
          ["Mulut membuka", 15, 1],
          ["Mulut berair liur", 15, 1],
          ["Suara datar", 15, 1],
          ["Bibir tebal", 5, 1],
          ["Mata sipit", 5, 1],
          ["Kepala bagian belakang pipih", 10, 1],
          ["Rambut tegak kaku kasar", 15, 1],
        ],
      },
    ],
  },
  {
    id: "fisik",
    nama: "Fisik Motorik",
    judul: "IDENTIFIKASI HAMBATAN FISIK MOTORIK",
    temuanLabel: "hambatan fisik motorik",
    groups: [
      {
        kode: "",
        label: "IDENTIFIKASI HAMBATAN FISIK MOTORIK",
        dugaan: "Tunadaksa",
        items: [
          ["Anggota gerak tubuh kaku/lemah/lumpuh", 100, 1],
          ["Terdapat bagian anggota gerak yang berbeda dari biasa (lebih kecil/besar/panjang/pendek)", 100, 1],
          ["Terdapat anggota tubuh yang tremor/ bergerak-gerak terus menerus tidak terkendali", 100, 1],
          ["Gangguan koordinasi gerak", 100, 1],
          ["Kehilangan/ketidaksempurnaan sebagian anggota tubuh", 100, 1],
        ],
      },
    ],
  },
  {
    id: "emosional",
    nama: "Emosi (Tunalaras)",
    judul: "IDENTIFIKASI HAMBATAN EMOSI KATEGORI TUNALARAS",
    temuanLabel: "hambatan emosi kategori tunalaras",
    groups: [
      {
        kode: "",
        label: "Tunalaras",
        dugaan: "Tunalaras",
        items: [
          ["Sering berbuat asusila", 50, 4],
          ["Sering berkelahi", 40, 4],
          ["Sering membolos", 20, 4],
          ["Sering bicara cabul", 20, 4],
          ["Sering mencuri", 30, 4],
          ["Kecanduan minuman keras/narkoba/zat adiktif lainnya", 50, 4],
          ["Mudah terpancing emosinya/emosional/mudah marah", 20, 4],
          ["Sering melakukan tindakan agresif, merusak, mengganggu", 30, 4],
          ["Sering bertindak melanggar norma sosial/norma susila/hukum", 50, 4],
        ],
      },
    ],
  },
  {
    id: "autis",
    nama: "Autism",
    judul: "IDENTIFIKASI HAMBATAN KOMUNIKASI, INTERAKSI, DAN PERILAKU (AUTISM)",
    temuanLabel: "hambatan komunikasi, interaksi, dan perilaku (autism)",
    groups: [
      {
        kode: "",
        label: "AUTIS",
        dugaan: "Autis",
        items: [
          ["Tidak mau kontak mata, ekspresi muka kurang hidup, gerak-gerik kurang tertuju", 20, 3],
          ["Tak dapat bermain dengan teman sebaya", 10, 3],
          ["Tak ada empati", 10, 3],
          ["Kurang mampu mengadakan hubungan sosial dan emosional yang timbal balik", 20, 3],
          ["Perkembangan bicara terlambat atau sama sekali tidak berkembang. Anak tidak berusaha untuk berkomunikasi secara nonverbal", 10, 3],
          ["Sering menggunakan bahasa yang aneh dan diulang-ulang", 20, 3],
          ["Cara bermain yang kurang variatif, kurang imajinatif, dan kurang dapat meniru", 10, 3],
          ["Mempertahankan satu minat atau lebih dengan cara yang sangat khas dan berlebihan", 10, 3],
          ["Terpaku pada suatu kegiatan yang ritualistik atau rutinitas yang tak ada gunanya", 20, 3],
          ["Ada gerakan aneh yang khas dan diulang-ulang", 20, 3],
          ["Sering kali sangat terpukau pada bagian-bagian benda", 10, 3],
          ["Tidak suka dipeluk", 20, 4],
          ["Suka berjalan dengan “jinjit”", 10, 4],
        ],
      },
    ],
  },
  {
    id: "adhd",
    nama: "ADHD / GPPH",
    judul: "IDENTIFIKASI GANGGUAN PEMUSATAN PERHATIAN DAN HIPERAKTIVITAS (GPPH)/ADHD",
    temuanLabel: "Gangguan Pemusatan Perhatian dan Hiperaktif (GPPH)/ADHD",
    groups: [
      {
        kode: "",
        label: "ADHD",
        dugaan: "ADHD/Hiperaktif",
        items: [
          ["Tangan dan kaki sering tidak bisa diam", 10, 1],
          ["Sering meninggalkan tempat duduk", 17, 1],
          ["Sering berlari atau memanjat berlebihan dalam situasi yang tidak sesuai", 17, 1],
          ["Sering kesulitan bermain dengan tenang", 17, 1],
          ["Sering dalam keadaan “siap bergerak”", 17, 1],
          ["Sering bicara berlebihan", 17, 5],
          ["Sering melontarkan jawaban sebelum pertanyaan selesai ditanyakan", 17, 5],
          ["Sering sulit menunggu antrian", 17, 5],
          ["Sering menyela atau memaksakan diri terhadap orang lain", 17, 5],
          ["Sering membuat kesalahan pada hal kecil (ceroboh)", 17, 5],
          ["Sering sulit mempertahankan perhatian", 17, 5],
          ["Sering seperti tidak mendengarkan saat diajak bicara langsung", 17, 5],
          ["Sering gagal menyelesaikan pekerjaan", 17, 5],
          ["Sering sulit mengatur tugas dan kegiatan", 17, 5],
          ["Sering enggan terlibat dalam tugas yang memerlukan ketekunan", 17, 5],
          ["Sering menghilangkan benda yang diperlukan untuk melakukan tugas", 17, 5],
          ["Sering mudah teralih perhatian oleh rangsangan dari luar", 17, 5],
          ["Sering lupa dalam kegiatan sehari-hari", 17, 5],
        ],
      },
    ],
  },
  {
    id: "slowlearner",
    nama: "Slow Learner",
    judul: "IDENTIFIKASI HAMBATAN INTELEKTUAL KATEGORI LAMBAN BELAJAR/SLOW LEARNER",
    temuanLabel: "hambatan intelektual kategori lamban belajar/slow learner",
    groups: [
      {
        kode: "",
        label: "IDENTIFIKASI HAMBATAN INTELEKTUAL KATEGORI LAMBAN BELAJAR/SLOW LEARNER",
        dugaan: "Slow Learner/Lamban Belajar",
        items: [
          ["Pernah tidak naik kelas", 20, 5],
          ["Cenderung kesulitan dalam mengikuti petunjuk yang memiliki banyak langkah / kompleks", 30, 5],
          ["Daya tangkap terhadap pelajaran lambat", 30, 4],
          ["Sering lambat dalam menyelesaikan tugas-tugas akademik", 30, 3],
          ["Rata-rata prestasi belajar selalu rendah", 30, 3],
          ["Bisa membaca huruf gagal membaca kata", 30, 4],
          ["Memahami perintah setelah diulang-ulang", 30, 4],
          ["Memiliki self image yang buruk (pemalu, pendiam, kurang percaya diri, menarik diri dari lingkungan sosial) sehingga mengalami kesulitan dalam berteman", 30, 4],
          ["Memiliki daya ingat yang memadai, namun lambat dalam mengingat", 30, 5],
          ["Menguasai suatu keterampilan dengan lambat, dan untuk beberapa kemampuan bahkan tidak dapat dikuasai", 30, 4],
          ["Terbatasnya kemampuan koordinasi (seperti olahraga, menggunakan alat tulis atau mengenakan pakaian)", 30, 4],
        ],
      },
    ],
  },
  {
    id: "kesulitanbelajar",
    nama: "Kesulitan Belajar",
    judul: "IDENTIFIKASI KESULITAN BELAJAR SPESIFIK",
    temuanLabel: "kesulitan belajar spesifik",
    groups: [
      {
        kode: "A",
        label: "DISLEKSIA (A)",
        dugaan: "Disleksia",
        items: [
          ["Perkembangan kemampuan membaca terlambat", 50, 3],
          ["Kemampuan memahami isi bacaan rendah", 50, 1],
          ["Sering salah membaca huruf b dengan p, p dengan q, v dengan u, 2 dengan 5, 6 dengan 9, dan sebagainya", 50, 1],
        ],
      },
      {
        kode: "B",
        label: "DISGRAFIA (B)",
        dugaan: "Disgrafia",
        items: [
          ["Kalau menyalin tulisan sering terlambat selesai", 50, 3],
          ["Sering salah menulis huruf b dengan p, p dengan q, v dengan u, 2 dengan 5, 6 dengan 9, dan sebagainya", 50, 3],
          ["Tulisannya banyak salah/terbalik/huruf hilang", 50, 5],
          ["Sering tampak bingung atau mengalami kesulitan menghubungkan garis yang membentuk sebuah pola", 50, 5],
          ["Sulit menulis dengan lurus pada kertas bergaris", 50, 4],
        ],
      },
      {
        kode: "C",
        label: "DISKALKULIA (C)",
        dugaan: "Diskalkulia",
        items: [
          ["Sulit membedakan tanda-tanda: +, -, x, :, <, >, =", 50, 4],
          ["Sulit mengoperasikan hitungan/bilangan", 50, 4],
          ["Sering salah membilang dengan urut", 50, 3],
          ["Sering salah membedakan angka 9 dengan 6; 17 dengan 71, 2 dengan 5, 3 dengan 8 dan sebagainya", 50, 3],
          ["Sulit membedakan bangun geometri", 50, 4],
        ],
      },
    ],
  },
  {
    id: "cibi",
    nama: "Cerdas Istimewa",
    judul: "IDENTIFIKASI CERDAS ISTIMEWA",
    temuanLabel: "cerdas istimewa",
    groups: [
      {
        kode: "",
        label: "IDENTIFIKASI CERDAS ISTIMEWA",
        dugaan: "Cerdas Istimewa",
        items: [
          ["Membaca pada usia kurang dari 6 tahun", 10, 4],
          ["Membaca lebih cepat dan lebih banyak", 10, 4],
          ["Memiliki perbendaharaan kata yang luas", 10, 4],
          ["Mempunyai rasa ingin tahu yang kuat", 10, 4],
          ["Mempunyai minat yang luas, juga terhadap masalah orang dewasa", 10, 4],
          ["Mempunyai inisiatif dan dapat bekerja sendiri", 10, 4],
          ["Menunjukkan keaslian (orisinalitas) dalam ungkapan verbal", 10, 4],
          ["Memberi jawaban-jawaban yang baik", 10, 4],
          ["Dapat memberikan banyak gagasan", 10, 4],
          ["Luwes dalam berpikir", 10, 4],
          ["Terbuka terhadap rangsangan-rangsangan dari lingkungan", 10, 4],
          ["Mempunyai pengamatan yang tajam", 10, 4],
          ["Dapat berkonsentrasi dalam jangka waktu yang panjang terutama dalam tugas atau bidang yang diminati", 10, 4],
          ["Berpikir kritis juga terhadap diri sendiri", 10, 4],
          ["Senang mencoba hal-hal baru", 10, 4],
          ["Mempunyai daya abstraksi, konseptualisasi dan sintesis yang tinggi", 10, 4],
          ["Senang terhadap kegiatan intelektual dan pemecahan masalah-masalah", 10, 4],
          ["Cepat menangkap hubungan sebab akibat", 10, 4],
          ["Berperilaku terarah terhadap tujuan", 10, 4],
          ["Mempunyai daya imajinasi yang kuat", 10, 4],
          ["Mempunyai banyak kegemaran/hobi", 10, 4],
          ["Mempunyai daya ingat yang kuat", 10, 4],
          ["Tidak cepat puas dengan prestasinya", 10, 4],
          ["Peka (sensitif) serta menggunakan firasat (intuisi)", 10, 4],
          ["Kecakapan di atas rata-rata", 10, 4],
          ["Memiliki kreativitas tinggi", 10, 4],
          ["Komitmen pada tugas", 10, 4],
          ["Menginginkan kebebasan dalam gerakan dan tindakan", 10, 4],
        ],
      },
    ],
  },
];

/* Beri ID unik untuk setiap butir: <instrumen>.<kelompok><nomor>, mis. "penglihatan.B3" */
INSTRUMEN.forEach((ins) =>
  ins.groups.forEach((g) => {
    g.items = g.items.map(([teks, bobot, teknik], i) => ({
      id: `${ins.id}.${g.kode || "X"}${i + 1}`,
      no: i + 1,
      teks,
      bobot,
      teknik,
    }));
  })
);
