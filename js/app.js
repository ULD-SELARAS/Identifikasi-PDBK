/* =========================================================
 * Aplikasi Identifikasi ABK
 * - Ceklis Ya/Tidak per instrumen, skor otomatis
 * - Kesimpulan dugaan (skor >= 100)
 * - Tanda tangan, pratinjau & unduh PDF
 * - Simpan ke Google Spreadsheet lewat Google Apps Script
 * ========================================================= */
(function () {
  "use strict";

  /* ---------------- util ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const parseDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmtTgl = (iso, hari = false) => {
    const d = parseDate(iso);
    if (!d) return "";
    return d.toLocaleDateString("id-ID", { ...(hari ? { weekday: "long" } : {}), day: "2-digit", month: "long", year: "numeric" });
  };
  const newId = () => "IDF-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  function toast(msg, err = false, ms = 3500) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (err ? " err" : "");
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), ms);
  }
  function tanya(pesan, okLabel = "Lanjutkan") {
    return new Promise((resolve) => {
      const m = $("#modalKonfirmasi");
      $("#konfirmasiTeks").textContent = pesan;
      $("#konfirmasiOk").textContent = okLabel;
      m.hidden = false;
      const selesai = (v) => {
        m.hidden = true;
        $("#konfirmasiOk").onclick = $("#konfirmasiBatal").onclick = null;
        resolve(v);
      };
      $("#konfirmasiOk").onclick = () => selesai(true);
      $("#konfirmasiBatal").onclick = () => selesai(false);
      $("#konfirmasiOk").focus();
    });
  }
  const setStatus = (m) => ($("#status").textContent = m || "");

  /* ---------------- state ---------------- */
  const KEY_DRAFT = "abk-draft-v1";
  const KEY_SET = "abk-setelan-v1";
  const KEY_TTD = "abk-ttd-v1";

  const blankState = () => ({
    id: newId(),
    identitas: { tanggal: today() },
    jawaban: {}, // itemId -> 1 | 0
    temuan: {}, // instrumenId -> text
    cetak: {}, // instrumenId -> bool
    narasi: "",
    ttd: { kota: "", tanggal: "", jabatan: "", nama: "", nip: "", img: "" },
    tersimpan: false,
  });

  let state = Object.assign(blankState(), store.get(KEY_DRAFT, {}));
  let setelan = Object.assign(
    { url: CONFIG.SCRIPT_URL || "", pdfDrive: CONFIG.SIMPAN_PDF_KE_DRIVE, sumber: CONFIG.TAMPILKAN_SUMBER },
    store.get(KEY_SET, {})
  );
  if (CONFIG.SCRIPT_URL && !store.get(KEY_SET, {}).url) setelan.url = CONFIG.SCRIPT_URL;
  let aktif = INSTRUMEN[0].id;

  let saveTimer;
  function persist(ubah = true) {
    if (ubah) state.tersimpan = false;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set(KEY_DRAFT, state), 250);
  }

  /* ---------------- perhitungan ---------------- */
  function hitung(ins) {
    const groups = ins.groups.map((g) => {
      const skor = g.items.reduce((s, it) => s + it.bobot * (state.jawaban[it.id] === 1 ? 1 : 0), 0);
      const diduga = skor >= AMBANG;
      return {
        kode: g.kode,
        label: g.label,
        dugaan: g.dugaan,
        skor,
        diduga,
        hasil: diduga ? g.dugaan : "Tidak teridentifikasi",
      };
    });
    const adaYa = ins.groups.some((g) => g.items.some((it) => state.jawaban[it.id] === 1));
    const terisi = ins.groups.reduce((n, g) => n + g.items.filter((it) => state.jawaban[it.id] != null).length, 0);
    const total = ins.groups.reduce((n, g) => n + g.items.length, 0);
    return { groups, adaYa, terisi, total, diduga: groups.some((g) => g.diduga) };
  }
  const semuaHasil = () => INSTRUMEN.map((ins) => ({ ins, h: hitung(ins) }));
  const daftarDugaan = () =>
    semuaHasil().flatMap(({ h }) => h.groups.filter((g) => g.diduga).map((g) => g.dugaan));

  /* ---------------- identitas ---------------- */
  const form = $("#formIdentitas");
  function isiIdentitas() {
    $$("[name]", form).forEach((el) => (el.value = state.identitas[el.name] || ""));
  }
  form.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.name) return;
    state.identitas[el.name] = el.value;
    el.classList.add("touched");
    if (el.name === "asesor" && !$("#ttdNama").value) $("#ttdNama").placeholder = el.value || "Otomatis dari nama asesor";
    if (el.name === "tanggal" && !state.ttd.tanggal) $("#ttdTanggal").value = el.value;
    persist();
  });

  /* ---------------- tabs & ceklis ---------------- */
  function renderTabs() {
    $("#tabs").innerHTML = INSTRUMEN.map((ins) => {
      const h = hitung(ins);
      const sel = ins.id === aktif;
      const badge = h.diduga
        ? `<span class="badge hit">Diduga</span>`
        : `<span class="badge">${h.terisi}/${h.total}</span>`;
      return `<button class="tab" role="tab" type="button" aria-selected="${sel}" data-tab="${ins.id}">${esc(ins.nama)} ${badge}</button>`;
    }).join("");
  }
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    aktif = b.dataset.tab;
    renderTabs();
    renderPanel();
    b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });

  function renderPanel() {
    const ins = INSTRUMEN.find((i) => i.id === aktif);
    const idx = INSTRUMEN.indexOf(ins);
    const h = hitung(ins);
    const groupsHtml = ins.groups
      .map((g, gi) => {
        const hg = h.groups[gi];
        const head = g.kode ? g.label : ins.nama;
        const items = g.items
          .map((it) => {
            const v = state.jawaban[it.id];
            return `<div class="item ${v === 1 ? "on" : ""}" data-item="${it.id}">
              <span class="no">${it.no}</span>
              <span class="q">${esc(it.teks)}<span class="meta">Bobot ${it.bobot} · Teknik ${it.teknik} (${esc(TEKNIK[it.teknik])})</span></span>
              <span class="yn" role="group" aria-label="Jawaban">
                <button type="button" data-v="1" class="${v === 1 ? "sel-ya" : ""}" aria-pressed="${v === 1}">Ya</button>
                <button type="button" data-v="0" class="${v === 0 ? "sel-tidak" : ""}" aria-pressed="${v === 0}">Tidak</button>
              </span>
              <span class="sk">${v === 1 ? it.bobot : 0}</span>
            </div>`;
          })
          .join("");
        const pct = Math.min(100, (hg.skor / AMBANG) * 100);
        return `<div class="group">
          <div class="group-head"><span>${esc(head)}</span>
            <span class="group-tools"><button class="btn ghost sm" type="button" data-sisa="${gi}" title="Butir yang belum dijawab diisi Tidak">Sisanya Tidak</button></span>
          </div>
          ${items}
          <div class="group-foot">
            <span class="skor-total">Skor gejala${g.kode ? " " + g.kode : ""}: ${hg.skor}
              <span class="bar ${hg.diduga ? "hit" : ""}"><i style="width:${pct}%"></i></span></span>
            <span class="pill ${hg.diduga ? "hit" : ""}">${g.kode ? g.kode + ". " : ""}${hg.diduga ? "Diduga " + esc(hg.dugaan) : "Tidak teridentifikasi"}</span>
          </div>
        </div>`;
      })
      .join("");

    $("#panel").innerHTML = `
      <p class="ins-title">${esc(ins.judul)}</p>
      <p class="hint" style="margin:0">Batas dugaan: skor gejala ≥ ${AMBANG}</p>
      ${groupsHtml}
      <label class="f mt">Temuan lain (jika ada) tentang kondisi anak yang berhubungan dengan ${esc(ins.temuanLabel)}
        <textarea rows="3" data-temuan="${ins.id}">${esc(state.temuan[ins.id] || "")}</textarea>
      </label>
      <div class="panel-nav">
        <button class="btn ghost sm" type="button" data-go="${idx - 1}" ${idx === 0 ? "disabled" : ""}>← Sebelumnya</button>
        ${idx < INSTRUMEN.length - 1
          ? `<button class="btn sm" type="button" data-go="${idx + 1}">${esc(INSTRUMEN[idx + 1].nama)} →</button>`
          : `<a class="btn sm" href="#sec-ringkasan" style="text-decoration:none">Lihat kesimpulan →</a>`}
      </div>`;
  }

  $("#panel").addEventListener("click", (e) => {
    const yn = e.target.closest(".yn button");
    if (yn) {
      const id = yn.closest("[data-item]").dataset.item;
      const v = Number(yn.dataset.v);
      state.jawaban[id] = state.jawaban[id] === v ? undefined : v; // klik ulang = batal
      if (state.jawaban[id] === undefined) delete state.jawaban[id];
      afterChange();
      return;
    }
    const sisa = e.target.closest("[data-sisa]");
    if (sisa) {
      const ins = INSTRUMEN.find((i) => i.id === aktif);
      ins.groups[Number(sisa.dataset.sisa)].items.forEach((it) => {
        if (state.jawaban[it.id] == null) state.jawaban[it.id] = 0;
      });
      afterChange();
      return;
    }
    const go = e.target.closest("[data-go]");
    if (go) {
      aktif = INSTRUMEN[Number(go.dataset.go)].id;
      renderTabs();
      renderPanel();
      $("#sec-instrumen").scrollIntoView({ behavior: "smooth" });
    }
  });
  $("#panel").addEventListener("input", (e) => {
    const t = e.target.closest("[data-temuan]");
    if (!t) return;
    state.temuan[t.dataset.temuan] = t.value;
    persist();
  });

  function afterChange() {
    const y = window.scrollY;
    renderTabs();
    renderPanel();
    renderRingkasan();
    window.scrollTo(0, y);
    persist();
  }

  /* ---------------- ringkasan ---------------- */
  function cetakDefault(ins, h) {
    return state.cetak[ins.id] ?? h.terisi > 0;
  }
  function renderRingkasan() {
    const dug = daftarDugaan();
    const box = $("#dugaanBox");
    box.className = "dugaan-box" + (dug.length ? " hit" : "");
    box.innerHTML = `<div class="lbl">Kesimpulan dugaan</div>
      <div class="val">${dug.length ? "Diduga: " + esc(dug.join(", ")) : "Tidak teridentifikasi hambatan"}</div>`;

    const rows = semuaHasil()
      .map(({ ins, h }) =>
        h.groups
          .map(
            (g, gi) => `<tr>
          ${gi === 0 ? `<td rowspan="${h.groups.length}"><input type="checkbox" data-cetak="${ins.id}" ${cetakDefault(ins, h) ? "checked" : ""} aria-label="Cetak ${esc(ins.nama)}"></td>
          <td rowspan="${h.groups.length}"><b>${esc(ins.nama)}</b></td>` : ""}
          <td>${g.kode ? esc(ins.groups[gi].label) : "—"}</td>
          <td class="num">${g.skor}</td>
          <td class="${g.diduga ? "hit" : ""}">${g.diduga ? "Diduga " + esc(g.dugaan) : "Tidak teridentifikasi"}</td>
        </tr>`
          )
          .join("")
      )
      .join("");
    $("#tabelRekap tbody").innerHTML = rows;
  }
  $("#tabelRekap").addEventListener("change", (e) => {
    const c = e.target.closest("[data-cetak]");
    if (!c) return;
    state.cetak[c.dataset.cetak] = c.checked;
    persist();
  });
  $$("[data-pilih]").forEach((b) =>
    b.addEventListener("click", () => {
      const mode = b.dataset.pilih;
      semuaHasil().forEach(({ ins, h }) => {
        state.cetak[ins.id] = mode === "semua" ? true : mode === "terisi" ? h.adaYa : h.diduga;
      });
      renderRingkasan();
      persist();
    })
  );

  const narasiEl = $("#kesimpulanNarasi");
  narasiEl.addEventListener("input", () => {
    state.narasi = narasiEl.value;
    persist();
  });
  $("#btnNarasi").addEventListener("click", async () => {
    const nama = (state.identitas.nama || "Peserta didik").trim();
    const panggilan = nama.split(/\s+/)[0];
    const hasil = semuaHasil();
    const dug = [];
    hasil.forEach(({ ins, h }) =>
      h.groups.forEach((g) => {
        if (g.diduga) dug.push(`${g.dugaan} (skor ${g.skor} pada instrumen ${ins.nama})`);
      })
    );
    let teks;
    if (dug.length) {
      teks = `Berdasarkan hasil identifikasi, ${nama} menunjukkan adanya kecenderungan hambatan dan diduga mengalami ${dug.join("; ")}.`;
    } else {
      teks = `Berdasarkan hasil identifikasi, ${nama} tidak teridentifikasi mengalami hambatan pada instrumen yang digunakan (seluruh skor gejala di bawah ${AMBANG}).`;
    }
    const temuan = hasil
      .map(({ ins }) => (state.temuan[ins.id] || "").trim())
      .filter(Boolean);
    if (temuan.length) teks += `\nTemuan lain: ${temuan.join(" ")}`;
    teks += `\nDisarankan ${panggilan} mendapatkan asesmen lanjutan oleh tenaga ahli (psikolog/dokter/terapis) untuk memastikan hasil identifikasi ini.`;
    if (narasiEl.value.trim() && !(await tanya("Teks kesimpulan yang sudah ada akan diganti dengan teks otomatis.", "Ganti teks"))) return;
    narasiEl.value = state.narasi = teks;
    persist();
  });

  /* ---------------- tanda tangan ---------------- */
  const canvas = $("#sigCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false, last = null, kosong = true;

  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const prev = !kosong ? canvas.toDataURL() : state.ttd.img;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#10213a";
    ctx.lineWidth = 2.4;
    if (prev) gambarKeCanvas(prev);
  }
  function gambarKeCanvas(src) {
    const img = new Image();
    img.onload = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      const s = Math.min((r.width - 20) / img.width, (r.height - 20) / img.height, 1.5);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (r.width - w) / 2, (r.height - h) / 2, w, h);
      kosong = false;
      $("#sigPh").hidden = true;
    };
    img.src = src;
  }
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.arc(last.x, last.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    kosong = false;
    $("#sigPh").hidden = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });
  const selesai = () => {
    if (!drawing) return;
    drawing = false;
    simpanTtd();
  };
  canvas.addEventListener("pointerup", selesai);
  canvas.addEventListener("pointercancel", selesai);

  function trimCanvas() {
    if (kosong) return "";
    const w = canvas.width, h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (data[(y * w + x) * 4 + 3] > 10) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    if (x1 < 0) return "";
    const pad = 8;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const c = document.createElement("canvas");
    // perkecil agar ringan disimpan (maks lebar 600px)
    const s = Math.min(1, 600 / (x1 - x0 + 1));
    c.width = Math.round((x1 - x0 + 1) * s);
    c.height = Math.round((y1 - y0 + 1) * s);
    c.getContext("2d").drawImage(canvas, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }
  function simpanTtd() {
    state.ttd.img = trimCanvas();
    if ($("#sigIngat").checked) store.set(KEY_TTD, state.ttd.img);
    persist();
  }
  $("#sigClear").addEventListener("click", () => {
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    kosong = true;
    state.ttd.img = "";
    $("#sigPh").hidden = false;
    if ($("#sigIngat").checked) store.del(KEY_TTD);
    persist();
  });
  $("#sigUpload").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      // hilangkan latar putih dari foto tanda tangan agar transparan
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const s = Math.min(1, 800 / img.width);
        c.width = img.width * s; c.height = img.height * s;
        const cx = c.getContext("2d");
        cx.drawImage(img, 0, 0, c.width, c.height);
        const d = cx.getImageData(0, 0, c.width, c.height);
        for (let i = 0; i < d.data.length; i += 4) {
          const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
          if (l > 200) d.data[i + 3] = 0;
        }
        cx.putImageData(d, 0, 0);
        const r = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, r.width, r.height);
        gambarKeCanvas(c.toDataURL("image/png"));
        setTimeout(simpanTtd, 80);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
    e.target.value = "";
  });
  $("#sigIngat").addEventListener("change", (e) => {
    if (e.target.checked) store.set(KEY_TTD, state.ttd.img || "");
    else store.del(KEY_TTD);
  });

  ["ttdKota", "ttdTanggal", "ttdJabatan", "ttdNama", "ttdNip"].forEach((id) => {
    const key = id.replace("ttd", "").toLowerCase();
    $("#" + id).addEventListener("input", (e) => {
      state.ttd[key] = e.target.value;
      persist();
    });
  });
  function isiTtd() {
    $("#ttdKota").value = state.ttd.kota || CONFIG.KOTA_DEFAULT || "";
    state.ttd.kota = $("#ttdKota").value;
    $("#ttdTanggal").value = state.ttd.tanggal || state.identitas.tanggal || "";
    $("#ttdJabatan").value = state.ttd.jabatan || CONFIG.JABATAN_DEFAULT || "Pemeriksa";
    state.ttd.jabatan = $("#ttdJabatan").value;
    $("#ttdNama").value = state.ttd.nama || "";
    $("#ttdNama").placeholder = state.identitas.asesor || "Otomatis dari nama asesor";
    $("#ttdNip").value = state.ttd.nip || "";
    const ingat = store.get(KEY_TTD, null);
    $("#sigIngat").checked = ingat !== null;
    if (!state.ttd.img && ingat) state.ttd.img = ingat;
    kosong = true;
    $("#sigPh").hidden = !!state.ttd.img;
    sizeCanvas();
  }
  let rT;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(sizeCanvas, 150); });

  /* ---------------- laporan ---------------- */
  const namaPemeriksa = () => (state.ttd.nama || state.identitas.asesor || "").trim();
  const tanggalTtd = () => state.ttd.tanggal || state.identitas.tanggal;

  function htmlIdentitas() {
    const i = state.identitas;
    const ttl = [i.tempatLahir, fmtTgl(i.tglLahir)].filter(Boolean).join(", ");
    const rows = [
      ["Nama", i.nama],
      ["Tempat,tgl lahir", ttl],
      ["Jenis kelamin", i.jk],
      ["Nama Sekolah", i.sekolah],
      ["Kelas", i.kelas],
      ...(i.paket ? [["Program paket", i.paket]] : []),
      ["Alamat rumah", i.alamatRumah],
      ["Alamat sekolah", i.alamatSekolah],
      ["Tanggal", fmtTgl(i.tanggal, true)],
      ["Nama Asesor", i.asesor],
    ];
    const tr = rows
      .map(([k, v]) => `<tr><td class="k">${k}</td><td class="s">:</td><td>${esc(v || "").replace(/\n/g, "<br>")}</td></tr>`)
      .join("");
    const ttdImg = state.ttd.img ? `<img class="ttd-mini" src="${state.ttd.img}" alt="">` : "";
    return `<div class="bar-title">IDENTITAS ANAK</div>
      <div class="ident">
        <table>${tr}<tr><td class="k">Tanda tangan</td><td class="s">:</td><td>${ttdImg}</td></tr></table>
        <div class="teknik-box">Teknik<br>${Object.entries(TEKNIK).map(([k, v]) => `${k}. ${esc(v)}`).join("<br>")}</div>
      </div>`;
  }

  function htmlInstrumen(ins) {
    const h = hitung(ins);
    let body = "";
    ins.groups.forEach((g) => {
      g.items.forEach((it, ii) => {
        const v = state.jawaban[it.id] === 1 ? 1 : 0;
        body += `<tr>
          ${ii === 0 ? `<td class="kat" rowspan="${g.items.length}">${esc(g.label)}</td>` : ""}
          <td class="c">${it.no}</td>
          <td>${esc(it.teks)}</td>
          <td class="c">${it.bobot}</td>
          <td class="c">${it.teknik}</td>
          <td class="ya-col">${v}</td>
          <td class="c">${it.bobot * v}</td>
        </tr>`;
      });
    });
    h.groups.forEach((g) => {
      body += `<tr class="tot"><td></td><td></td><td>Skor gejala${g.kode ? " " + g.kode : ""}</td><td></td><td></td><td></td><td class="c">${g.skor}</td></tr>`;
    });
    const temuan = (state.temuan[ins.id] || "").trim();
    body += `<tr><td colspan="7">Tuliskan temuan lain (jika ada) tentang kondisi anak yang berhubungan dengan ${esc(ins.temuanLabel)} di bawah ini:</td></tr>
      <tr><td colspan="7" class="temuan">${esc(temuan).replace(/\n/g, "<br>")}</td></tr>`;
    h.groups.forEach((g, gi) => {
      body += `<tr class="kes">
        ${gi === 0 ? `<td colspan="3" class="c" rowspan="${h.groups.length}">KESIMPULAN</td>` : ""}
        <td colspan="2" class="c">${g.kode ? g.kode + ". " : ""}Diduga</td>
        <td colspan="2" class="c"><b>${esc(g.hasil)}</b></td>
      </tr>`;
    });
    return `<table class="ins">
      <tr><th colspan="7" class="judul">${esc(ins.judul)}</th></tr>
      <tr><td colspan="7">PETUNJUK<br>Ketik angka 1 jika ya dan angka 0 jika tidak pada kolom warna kuning pernyataan sesuai dengan gejala yang tampak/ diperoleh</td></tr>
      <tr><th>KATEGORI</th><th>NO</th><th>PERTANYAAN</th><th>BOBOT</th><th>TEKNIK</th><th>YA=1, TIDAK=0</th><th>Skor</th></tr>
      ${body}
    </table>`;
  }

  function htmlPenutup() {
    const dug = daftarDugaan();
    const rows = semuaHasil()
      .map(({ ins, h }) =>
        h.groups
          .map(
            (g) => `<tr><td>${esc(ins.nama)}${g.kode ? " – " + esc(ins.groups.find((x) => x.kode === g.kode).label) : ""}</td>
              <td class="c">${g.skor}</td><td class="${g.diduga ? "hit" : ""}">${g.diduga ? "Diduga " + esc(g.dugaan) : "Tidak teridentifikasi"}</td></tr>`
          )
          .join("")
      )
      .join("");
    const tgl = fmtTgl(tanggalTtd());
    const kota = (state.ttd.kota || "").trim();
    return `<div class="bar-title">REKAPITULASI HASIL IDENTIFIKASI</div>
      <table class="rekap-lap">
        <tr><th>Instrumen</th><th style="width:70px">Skor</th><th style="width:230px">Hasil</th></tr>
        ${rows}
      </table>
      <div class="kes-box">
        <div class="h">Kesimpulan</div>
        <div class="dug"><b>Dugaan:</b> ${dug.length ? esc(dug.join(", ")) : "Tidak teridentifikasi hambatan"}</div>
        <div class="b">${esc(state.narasi || "")}</div>
      </div>
      <div class="sign">
        <div>${esc(kota)}${kota && tgl ? ", " : ""}${esc(tgl)}</div>
        <div>${esc(state.ttd.jabatan || "Pemeriksa")}</div>
        <div class="img">${state.ttd.img ? `<img src="${state.ttd.img}" alt="Tanda tangan">` : ""}</div>
        <div class="nama">${esc(namaPemeriksa())}</div>
        ${state.ttd.nip ? `<div>${esc(state.ttd.nip)}</div>` : ""}
      </div>
      ${setelan.sumber ? `<div class="sumber">${esc(CONFIG.SUMBER)}</div>` : ""}`;
  }

  function buatLaporan() {
    const pilih = semuaHasil().filter(({ ins, h }) => cetakDefault(ins, h)).map(({ ins }) => ins);
    // instrumen pertama ikut di halaman identitas bila tidak terlalu panjang (seperti contoh)
    const nButir = (ins) => ins.groups.reduce((n, g) => n + g.items.length, 0);
    const satuHalaman = pilih[0] && nButir(pilih[0]) <= 20;
    let html = `<div class="lap-section">${htmlIdentitas()}${satuHalaman ? htmlInstrumen(pilih[0]) : ""}</div>`;
    pilih.slice(satuHalaman ? 1 : 0).forEach((ins) => (html += `<div class="lap-section page-break">${htmlInstrumen(ins)}</div>`));
    html += `<div class="lap-section page-break">${htmlPenutup()}</div>`;
    $("#laporan").innerHTML = html;
    // elemen terpisah khusus untuk PDF (tidak terpengaruh posisi scroll / modal)
    const el = document.createElement("div");
    el.className = "laporan";
    el.style.margin = "0";
    el.innerHTML = html;
    return el;
  }

  const namaFile = () => {
    const n = (state.identitas.nama || "anak").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    return `IDENTIFIKASI_${n}_${state.identitas.tanggal || today()}.pdf`;
  };
  const pdfOpt = () => ({
    margin: [10, 10, 12, 10],
    filename: namaFile(),
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: 0 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css"], before: ".page-break", avoid: [".sign", ".kes-box", ".ident"] },
  });

  async function pdfBase64() {
    const el = buatLaporan();
    const worker = html2pdf().set(pdfOpt()).from(el).toPdf();
    const pdf = await worker.get("pdf");
    return pdf.output("datauristring").split(",")[1];
  }

  function validasi() {
    const kurang = [];
    if (!(state.identitas.nama || "").trim()) kurang.push("Nama anak");
    if (!state.identitas.tanggal) kurang.push("Tanggal pemeriksaan");
    if (!(state.identitas.asesor || "").trim()) kurang.push("Nama asesor");
    if (kurang.length) {
      $$("[required]", form).forEach((el) => el.classList.add("touched"));
      toast("Lengkapi dulu: " + kurang.join(", "), true);
      $("#sec-identitas").scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  }

  /* ---------------- modal ---------------- */
  function buka(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
  function tutup(m) { m.hidden = true; document.body.style.overflow = ""; }
  $$(".modal").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-close]")) tutup(m);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal").forEach((m) => !m.hidden && tutup(m));
  });

  $("#btnPreview").addEventListener("click", () => {
    if (!validasi()) return;
    buatLaporan();
    buka("#modalLaporan");
  });
  async function unduhPdf() {
    const el = buatLaporan();
    const opt = pdfOpt();
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if (dl) {
      const blob = await html2pdf().set(opt).from(el).outputPdf("blob");
      try {
        await dl.save({ filename: opt.filename, data: blob });
        return "ok";
      } catch (err) {
        if (err && err.code === "declined") return "batal";
        throw new Error(err && err.message ? err.message : "Unduhan tidak tersedia di tampilan ini");
      }
    }
    await html2pdf().set(opt).from(el).save();
    return "ok";
  }
  $("#btnUnduh").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    b.textContent = "Membuat PDF…";
    try {
      const r = await unduhPdf();
      toast(r === "batal" ? "Unduhan dibatalkan" : "PDF siap: " + namaFile());
    } catch (err) {
      console.error(err);
      toast("Gagal membuat PDF: " + err.message, true);
    } finally {
      b.disabled = false;
      b.textContent = "Unduh PDF";
    }
  });
  $("#btnPrint").addEventListener("click", () => window.print());

  /* ---------------- simpan ke spreadsheet ---------------- */
  function payload() {
    const i = state.identitas;
    const hasil = semuaHasil();
    const rekap = [
      ["ID", state.id],
      ["Nama", i.nama || ""],
      ["Tempat Lahir", i.tempatLahir || ""],
      ["Tanggal Lahir", i.tglLahir || ""],
      ["Jenis Kelamin", i.jk || ""],
      ["Nama Sekolah", i.sekolah || ""],
      ["Kelas", i.kelas || ""],
      ["Program Paket", i.paket || ""],
      ["Alamat Rumah", i.alamatRumah || ""],
      ["Alamat Sekolah", i.alamatSekolah || ""],
      ["Tanggal Pemeriksaan", i.tanggal || ""],
      ["Nama Asesor", i.asesor || ""],
    ];
    hasil.forEach(({ ins, h }) =>
      h.groups.forEach((g) => {
        const nm = ins.nama + (g.kode ? " " + g.kode : "");
        rekap.push([`Skor ${nm}`, g.skor]);
        rekap.push([`Hasil ${nm}`, g.hasil]);
      })
    );
    const dug = daftarDugaan();
    rekap.push(["Kesimpulan Dugaan", dug.length ? dug.join(", ") : "Tidak teridentifikasi"]);
    rekap.push(["Kesimpulan Pemeriksa", state.narasi || ""]);
    rekap.push([
      "Temuan Lain",
      hasil.map(({ ins }) => ((state.temuan[ins.id] || "").trim() ? `[${ins.nama}] ${state.temuan[ins.id].trim()}` : "")).filter(Boolean).join("\n"),
    ]);
    rekap.push(["Kota TTD", state.ttd.kota || ""]);
    rekap.push(["Tanggal TTD", tanggalTtd() || ""]);
    rekap.push(["Pemeriksa", namaPemeriksa()]);
    rekap.push(["NIP/Keterangan", state.ttd.nip || ""]);

    const detail = [];
    hasil.forEach(({ ins }) =>
      ins.groups.forEach((g) =>
        g.items.forEach((it) => {
          const v = state.jawaban[it.id] === 1 ? 1 : 0;
          detail.push([state.id, i.nama || "", i.tanggal || "", ins.nama, g.kode ? g.label : "", it.no, it.teks, it.bobot, it.teknik, v, it.bobot * v]);
        })
      )
    );
    return { aksi: "simpan", id: state.id, rekap, detail, fileName: namaFile(), ttdPng: state.ttd.img ? state.ttd.img.split(",")[1] : "" };
  }

  async function kirim(url, data) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Gagal menyimpan");
      return j;
    } catch (err) {
      if (err instanceof TypeError) {
        // CORS / jaringan: kirim tanpa membaca balasan
        await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
        return { ok: true, buta: true };
      }
      throw err;
    }
  }

  $("#btnSimpan").addEventListener("click", async (e) => {
    if (!validasi()) return;
    if (!setelan.url) {
      toast("Isi dulu URL Google Apps Script di Setelan", true);
      bukaSetelan();
      return;
    }
    const b = e.currentTarget;
    b.disabled = true;
    try {
      const data = payload();
      if (setelan.pdfDrive) {
        setStatus("Menyiapkan PDF…");
        data.pdfBase64 = await pdfBase64();
      }
      setStatus("Mengirim ke spreadsheet…");
      const j = await kirim(setelan.url, data);
      state.tersimpan = true;
      persist(false);
      setStatus(`Tersimpan ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · ID ${state.id}`);
      toast(j.buta ? "Data terkirim ke spreadsheet" : j.diperbarui ? "Data di spreadsheet diperbarui" : "Data tersimpan ke spreadsheet");
    } catch (err) {
      console.error(err);
      setStatus("");
      toast("Gagal menyimpan: " + err.message, true, 6000);
    } finally {
      b.disabled = false;
    }
  });

  /* ---------------- setelan ---------------- */
  function bukaSetelan() {
    $("#setUrl").value = setelan.url || "";
    $("#setPdfDrive").checked = !!setelan.pdfDrive;
    $("#setSumber").checked = !!setelan.sumber;
    $("#tesHasil").textContent = "";
    buka("#modalSetelan");
  }
  $("#btnSetelan").addEventListener("click", bukaSetelan);
  $("#btnSimpanSetelan").addEventListener("click", () => {
    setelan = { url: $("#setUrl").value.trim(), pdfDrive: $("#setPdfDrive").checked, sumber: $("#setSumber").checked };
    store.set(KEY_SET, setelan);
    tutup($("#modalSetelan"));
    toast("Setelan disimpan");
  });
  $("#btnTesKoneksi").addEventListener("click", async () => {
    const url = $("#setUrl").value.trim();
    const out = $("#tesHasil");
    if (!url) return (out.textContent = "URL masih kosong.");
    out.textContent = "Menghubungi…";
    try {
      const r = await fetch(url + (url.includes("?") ? "&" : "?") + "aksi=ping");
      const j = await r.json();
      out.textContent = j.ok ? `✔ Terhubung ke spreadsheet “${j.spreadsheet}”.` : "Balasan tidak dikenali.";
    } catch (err) {
      out.textContent = "✖ Tidak bisa terhubung. Pastikan URL berakhiran /exec dan akses Web App diatur ke “Siapa saja (Anyone)”.";
    }
  });

  /* ---------------- formulir baru ---------------- */
  $("#btnBaru").addEventListener("click", async () => {
    const adaIsi = Object.keys(state.jawaban).length || (state.identitas.nama || "").trim();
    if (adaIsi && !state.tersimpan) {
      const pesan = CONFIG.ARTIFACT
        ? "Isian anak ini akan dikosongkan. Pastikan PDF-nya sudah diunduh."
        : "Data anak ini belum disimpan ke spreadsheet dan akan dikosongkan.";
      if (!(await tanya(pesan, "Kosongkan formulir"))) return;
    }
    const asesor = state.identitas.asesor, sekolah = state.identitas.sekolah, alamatSekolah = state.identitas.alamatSekolah;
    const ttd = { ...state.ttd, tanggal: "" };
    state = blankState();
    Object.assign(state.identitas, { asesor, sekolah, alamatSekolah });
    state.ttd = ttd;
    store.set(KEY_DRAFT, state);
    init();
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Formulir baru siap diisi");
  });

  /* ---------------- data contoh ---------------- */
  $("#btnContoh").addEventListener("click", async () => {
    const adaIsi = Object.keys(state.jawaban).length || (state.identitas.nama || "").trim();
    if (adaIsi && !(await tanya("Isian sekarang akan diganti dengan data contoh.", "Pakai data contoh"))) return;
    state = blankState();
    state.identitas = {
      nama: "Juwita (contoh)", tempatLahir: "Jakarta", tglLahir: "2010-04-09", jk: "Perempuan",
      sekolah: "SKB 39", kelas: "VIII", alamatRumah: "Rusun Pinus Elok Blok B2, RT 19/RW 09",
      alamatSekolah: "Perum Aneka Elok, Jl. Meranti Elok Blok D3 No. 13, Penggilingan, Cakung, Jakarta Timur",
      tanggal: "2026-09-21", asesor: "Nisa Mulyani",
    };
    [1, 2, 3, 4, 5, 6, 7, 12, 14, 15].forEach((n) => (state.jawaban["intelektual.X" + n] = 1));
    for (let n = 1; n <= 16; n++) if (state.jawaban["intelektual.X" + n] == null) state.jawaban["intelektual.X" + n] = 0;
    state.ttd.tanggal = "2026-09-21";
    init();
    aktif = "intelektual";
    renderTabs();
    renderPanel();
    toast("Data contoh dimuat. Ganti dengan data anak yang diperiksa.");
  });

  /* ---------------- init ---------------- */
  if (CONFIG.ARTIFACT) {
    ["#btnSimpan", "#btnSetelan", "#btnPrint"].forEach((q) => $(q) && ($(q).hidden = true));
  }
  function init() {
    isiIdentitas();
    narasiEl.value = state.narasi || "";
    aktif = INSTRUMEN[0].id;
    renderTabs();
    renderPanel();
    renderRingkasan();
    isiTtd();
    if (state.tersimpan) setStatus("Data ini sudah pernah disimpan · ID " + state.id);
  }
  init();
})();
