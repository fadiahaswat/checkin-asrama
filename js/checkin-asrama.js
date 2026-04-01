// js/checkin-asrama.js
// ============================================================
// APLIKASI CHECK-IN KEMBALI KE ASRAMA
// Logika utama: loading data, login, check-in, render UI
// ============================================================

import { GAS_SANTRI_API_URL, CACHE } from '../config.js';
import { escapeHtml } from './utils.js';
import { CHECKIN_EVENT, ASRAMA_CONFIG } from '../checkin-asrama-config.js';

// ─── State ───────────────────────────────────────────────────
const state = {
    santriList: [],       // Semua santri untuk asrama aktif (flat array)
    checkinData: {},      // { [nis]: { nama, rombel, status, waktu, catatan } }
    currentAsrama: null,  // Objek ASRAMA_CONFIG yang sedang aktif
    activeTab: 'checkin', // 'seruan' | 'checkin' | 'rekap'
    searchQuery: '',
    filterStatus: 'all',  // 'all' | 'hadir' | 'belum'
};

// ─── LocalStorage helpers ─────────────────────────────────────
function getCheckinKey(asramaId) {
    return `checkin_${CHECKIN_EVENT.id}_${asramaId}`;
}

function loadCheckinData(asramaId) {
    try {
        const raw = localStorage.getItem(getCheckinKey(asramaId));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveCheckinData() {
    try {
        localStorage.setItem(
            getCheckinKey(state.currentAsrama.id),
            JSON.stringify(state.checkinData)
        );
    } catch {
        showNotif('Penyimpanan penuh, data check-in mungkin tidak tersimpan.', 'warning');
    }
}

// ─── Simple in-page notification ─────────────────────────────
function showNotif(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle',
    };
    const el = document.createElement('div');
    el.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl transition-all duration-300 ${colors[type] || colors.info}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(msg)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, 10px)';
        setTimeout(() => el.remove(), 300);
    }, 2800);
}

// ─── Data Loading ─────────────────────────────────────────────

/**
 * Normalizes the santri data returned by the API:
 * - Unwraps common response envelope shapes ({ data: [...] }, { records: [...] }, etc.)
 * - Lowercases all field keys so the rest of the app can rely on s.nis, s.nama,
 *   s.asrama, s.rombel, s.kelas regardless of how the spreadsheet column headers
 *   are capitalised.
 */
function normalizeSantriData(raw) {
    let records = raw;

    // Unwrap common envelope patterns returned by Google Apps Script
    if (!Array.isArray(records) && records !== null && typeof records === 'object') {
        records = records.data || records.records || records.santri ||
                  records.students || records.list || [];
    }

    if (!Array.isArray(records)) return [];

    return records.reduce((acc, item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) return acc;
        const normalized = {};
        Object.keys(item).forEach(key => {
            normalized[key.toLowerCase().trim()] = item[key];
        });
        // Normalize asrama: treat "-" placeholder (used by code.gs when column is empty) as unassigned
        if (normalized.asrama === '-') normalized.asrama = '';
        // Alias kelas → rombel so display helpers always have a consistent field
        if (!normalized.rombel && normalized.kelas) normalized.rombel = normalized.kelas;
        acc.push(normalized);
        return acc;
    }, []);
}

async function loadSantriDataWithCache() {
    const cachedData = localStorage.getItem(CACHE.KEY);
    const cachedTime = localStorage.getItem(CACHE.TIME_KEY);
    const now = Date.now();

    if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < CACHE.EXPIRY_HOURS * 3600 * 1000)) {
        try {
            return JSON.parse(cachedData);
        } catch {
            // Cache corrupt, fall through
        }
    }

    const response = await fetch(GAS_SANTRI_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    try {
        localStorage.setItem(CACHE.KEY, JSON.stringify(data));
        localStorage.setItem(CACHE.TIME_KEY, String(now));
    } catch {
        // Storage full — continue without caching
    }
    return data;
}

function buildSantriListForAsrama(allSantri, asrama) {
    if (!asrama.filterKey) return allSantri;
    const key = asrama.filterKey.toLowerCase();
    return allSantri.filter(s => {
        const studentAsrama = (s.asrama || '').toLowerCase().trim();
        // Include student if asrama is unassigned (empty) or matches filterKey
        return !studentAsrama || studentAsrama.includes(key);
    });
}

// ─── Check-in Operations ──────────────────────────────────────
function markHadir(nis) {
    const santri = state.santriList.find(s => s.nis === nis);
    if (!santri) return;
    state.checkinData[nis] = {
        nama: santri.nama,
        rombel: santri.rombel || santri.kelas || '',
        status: 'hadir',
        waktu: new Date().toISOString(),
        catatan: '',
    };
    saveCheckinData();
    renderCheckinTab();
    renderRekapTab();
    updateStatsBar();
    showNotif(`✅ ${santri.nama} tercatat hadir`, 'success');
}

function batalHadir(nis) {
    const record = state.checkinData[nis];
    const nama = record ? record.nama : nis;
    delete state.checkinData[nis];
    saveCheckinData();
    renderCheckinTab();
    renderRekapTab();
    updateStatsBar();
    showNotif(`↩️ Check-in ${nama} dibatalkan`, 'warning');
}

// ─── UI: Stats bar ────────────────────────────────────────────
function updateStatsBar() {
    const total = state.santriList.length;
    const hadir = Object.values(state.checkinData).filter(r => r.status === 'hadir').length;
    const belum = total - hadir;
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('stats-total', total);
    setEl('stats-hadir', hadir);
    setEl('stats-belum', belum);
    setEl('stats-pct', `${pct}%`);

    const bar = document.getElementById('stats-progress-bar');
    if (bar) bar.style.width = `${pct}%`;
}

// ─── UI: Tab switching ────────────────────────────────────────
function switchTab(tab) {
    state.activeTab = tab;
    ['seruan', 'checkin', 'rekap'].forEach(t => {
        const panel = document.getElementById(`tab-panel-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        if (btn) {
            btn.classList.toggle('tab-active', t === tab);
            btn.classList.toggle('tab-inactive', t !== tab);
        }
    });
    // Show search/filter controls only on check-in tab
    const controls = document.getElementById('checkin-controls');
    if (controls) controls.style.display = tab === 'checkin' ? '' : 'none';
}

// ─── UI: Announcement / Seruan ────────────────────────────────
function renderSeruanTab() {
    const container = document.getElementById('tab-panel-seruan');
    if (!container) return;
    const ev = CHECKIN_EVENT;
    const asrama = state.currentAsrama;

    const reqRows = ev.requirements.map(r => `
        <div class="flex gap-3 items-start py-2">
            <span class="text-xl mt-0.5">${r.icon}</span>
            <div>
                <span class="font-bold text-slate-800">${escapeHtml(r.label)}:</span>
                <span class="text-slate-600"> ${escapeHtml(r.desc)}</span>
            </div>
        </div>`).join('');

    const checklistRows = ev.checklist.map(c => `
        <div class="flex gap-3 items-start py-2">
            <div class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">${c.no}</div>
            <div>
                <p class="font-bold text-slate-800">${escapeHtml(c.label)}</p>
                <p class="text-sm text-slate-500 mt-0.5">${escapeHtml(c.desc)}</p>
            </div>
        </div>`).join('');

    container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-5 pb-8">

        <!-- Header -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 text-center shadow-xl">
            <div class="text-3xl mb-2">🌙</div>
            <h2 class="text-lg font-black tracking-tight">${escapeHtml(ev.title.toUpperCase())}: ${escapeHtml(ev.tagline)}</h2>
            <p class="text-sm font-bold text-amber-400 mt-1">${escapeHtml(asrama.nama)}</p>
            <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(ev.institution)}</p>
        </div>

        <!-- Greeting -->
        <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p class="text-sm font-semibold text-emerald-700 mb-3 italic">${escapeHtml(ev.greeting)}</p>
            <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(ev.intro)}</p>
        </div>

        <!-- Arrival Info -->
        <div class="rounded-2xl bg-blue-50 border border-blue-200 p-5 shadow-sm">
            <h3 class="font-black text-blue-800 flex items-center gap-2 mb-3">🗓️ INFO KEDATANGAN</h3>
            <div class="space-y-1.5 text-sm text-blue-900">
                <p>• <span class="font-semibold">Hari/Tanggal:</span> <strong>${escapeHtml(ev.arrival.day)}, ${escapeHtml(ev.arrival.date)}</strong></p>
                <p>• <span class="font-semibold">Waktu:</span> <strong>${escapeHtml(ev.arrival.time)}</strong></p>
                <p>• <span class="font-semibold">Lokasi:</span> <strong>${escapeHtml(asrama.lokasi)}</strong></p>
            </div>
            <div class="mt-3 pt-3 border-t border-blue-200">
                <p class="text-xs text-blue-700 font-medium">🚩 <strong>KEDATANGAN DINI:</strong> ${escapeHtml(ev.arrival.earlyPolicy)}</p>
            </div>
        </div>

        <!-- Requirements -->
        <div class="rounded-2xl bg-red-50 border border-red-200 p-5 shadow-sm">
            <h3 class="font-black text-red-800 flex items-center gap-2 mb-1">⚠️ SYARAT MASUK ASRAMA</h3>
            <p class="text-xs text-red-600 mb-3">Santri <strong>BELUM DIPERBOLEHKAN</strong> masuk asrama jika:</p>
            <div class="divide-y divide-red-100">${reqRows}</div>
            <p class="text-xs text-slate-500 italic mt-3">${escapeHtml(ev.requirementNote)}</p>
        </div>

        <!-- Arrival Flow -->
        <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm">
            <h3 class="font-black text-emerald-800 flex items-center gap-2 mb-3">🔄 ALUR KEDATANGAN (DRIVE THRU)</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1">🚪 Pintu Masuk</p>
                    <p class="font-semibold text-slate-800">${escapeHtml(ev.flow.masuk)}</p>
                </div>
                <div class="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1">🚪 Pintu Keluar</p>
                    <p class="font-semibold text-slate-800">${escapeHtml(ev.flow.keluar)}</p>
                </div>
                <div class="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1">🅿️ Area Parkir</p>
                    <p class="font-semibold text-slate-800">${escapeHtml(ev.flow.parkir)}</p>
                </div>
                <div class="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1">🏢 Check-in</p>
                    <p class="font-semibold text-slate-800">${escapeHtml(ev.flow.checkin)}</p>
                </div>
            </div>
        </div>

        <!-- Checklist -->
        <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <h3 class="font-black text-slate-800 flex items-center gap-2 mb-3">📝 CHECKLIST WAJIB KELENGKAPAN</h3>
            <div class="divide-y divide-slate-100">${checklistRows}</div>
        </div>

        <!-- Late Policy -->
        <div class="rounded-2xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
            <h3 class="font-black text-amber-800 flex items-center gap-2 mb-2">🕒 KEDISIPLINAN WAKTU</h3>
            <p class="text-sm text-amber-900">${escapeHtml(ev.latePolicy)}</p>
            <div class="mt-3 flex flex-col gap-2">
                <p class="text-sm text-amber-800">👤 Koordinator: <strong>${escapeHtml(asrama.koordinator)}</strong></p>
                <a href="${escapeHtml(asrama.suratUrl)}" target="_blank" rel="noopener noreferrer"
                   class="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                    📄 Template Surat Keterlambatan
                    <i class="fas fa-external-link-alt text-xs"></i>
                </a>
            </div>
        </div>

        <!-- Closing -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 text-center shadow-xl">
            <p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(ev.closing)}</p>
            <p class="text-xs text-slate-400 italic mt-3">Jazakumullah khairan katsiran.</p>
            <p class="text-xs text-slate-400 italic">Wassalamu'alaikum warahmatullahi wabarakatuh</p>
            <div class="mt-4 pt-4 border-t border-slate-700">
                <p class="text-xs text-slate-400">${escapeHtml(ev.signatureDate)}</p>
                <p class="font-bold text-white">${escapeHtml(ev.signature)} — ${escapeHtml(asrama.nama)}</p>
            </div>
        </div>
    </div>`;
}

// ─── UI: Check-in list ────────────────────────────────────────
function renderCheckinTab() {
    const container = document.getElementById('tab-panel-checkin');
    if (!container) return;

    const query = state.searchQuery.toLowerCase();
    const filter = state.filterStatus;

    const filtered = state.santriList.filter(s => {
        const record = state.checkinData[s.nis];
        const isHadir = record && record.status === 'hadir';
        if (filter === 'hadir' && !isHadir) return false;
        if (filter === 'belum' && isHadir) return false;
        if (query) {
            const nama = (s.nama || '').toLowerCase();
            const nis = (s.nis || '').toLowerCase();
            const rombel = (s.rombel || s.kelas || '').toLowerCase();
            if (!nama.includes(query) && !nis.includes(query) && !rombel.includes(query)) return false;
        }
        return true;
    });

    // Sort: belum hadir first, then hadir (sorted by waktu desc)
    filtered.sort((a, b) => {
        const ra = state.checkinData[a.nis];
        const rb = state.checkinData[b.nis];
        const aHadir = ra && ra.status === 'hadir';
        const bHadir = rb && rb.status === 'hadir';
        if (aHadir === bHadir) {
            if (aHadir) {
                return new Date(rb.waktu) - new Date(ra.waktu); // latest first
            }
            return (a.nama || '').localeCompare(b.nama || '', 'id');
        }
        return aHadir ? 1 : -1;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-slate-400">
            <i class="fas fa-search text-4xl mb-3 opacity-30"></i>
            <p class="font-semibold">Tidak ada santri ditemukan</p>
            <p class="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
        </div>`;
        return;
    }

    const total = state.santriList.length;

    container.innerHTML = `
    <div class="pb-6">
        <p class="text-xs text-slate-400 mb-3 px-1">Menampilkan ${filtered.length} dari ${total} santri</p>
        <div class="space-y-2">
            ${filtered.map(s => renderSantriCard(s)).join('')}
        </div>
    </div>`;
}

function renderSantriCard(santri) {
    const nis = escapeHtml(santri.nis || '');
    const nama = escapeHtml(santri.nama || '-');
    const rombel = escapeHtml(santri.rombel || santri.kelas || '-');
    const record = state.checkinData[santri.nis];
    const isHadir = record && record.status === 'hadir';

    const initials = (santri.nama || '??').split(' ').filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const avatarColors = isHadir
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-500';

    let actionHtml;
    if (isHadir) {
        const waktu = new Date(record.waktu);
        const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        actionHtml = `
            <div class="flex flex-col items-end gap-1">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    <i class="fas fa-check-circle"></i> Hadir ${escapeHtml(jam)}
                </span>
                <button onclick="window.batalHadir('${nis}')"
                    class="text-[10px] text-slate-400 hover:text-red-500 transition-colors underline">
                    Batal
                </button>
            </div>`;
    } else {
        actionHtml = `
            <button onclick="window.markHadir('${nis}')"
                class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all">
                <i class="fas fa-check"></i> Hadir
            </button>`;
    }

    return `
    <div class="flex items-center gap-3 p-3 rounded-xl bg-white border ${isHadir ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'} shadow-sm transition-all">
        <div class="flex-shrink-0 w-11 h-11 rounded-full ${avatarColors} font-black text-sm flex items-center justify-center shadow-sm">
            ${escapeHtml(initials)}
        </div>
        <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-800 text-sm truncate">${nama}</p>
            <p class="text-xs text-slate-400 truncate">Kelas ${rombel} · NIS ${nis}</p>
        </div>
        ${actionHtml}
    </div>`;
}

// ─── UI: Rekap tab ────────────────────────────────────────────
function renderRekapTab() {
    const container = document.getElementById('tab-panel-rekap');
    if (!container) return;

    const total = state.santriList.length;
    const hadirList = Object.entries(state.checkinData)
        .filter(([, r]) => r.status === 'hadir')
        .sort(([, a], [, b]) => new Date(b.waktu) - new Date(a.waktu));
    const hadir = hadirList.length;
    const belum = total - hadir;
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;

    const belumList = state.santriList
        .filter(s => !state.checkinData[s.nis] || state.checkinData[s.nis].status !== 'hadir')
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id'));

    const hadirRows = hadirList.map(([nis, r]) => {
        const waktu = new Date(r.waktu);
        const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `<tr class="border-b border-slate-100 last:border-0">
            <td class="py-2 pr-3 text-sm font-semibold text-slate-800">${escapeHtml(r.nama || nis)}</td>
            <td class="py-2 pr-3 text-xs text-slate-500">${escapeHtml(r.rombel || '-')}</td>
            <td class="py-2 text-xs font-bold text-emerald-600">${escapeHtml(jam)}</td>
        </tr>`;
    }).join('');

    const belumRows = belumList.map(s => `
        <tr class="border-b border-slate-100 last:border-0">
            <td class="py-2 pr-3 text-sm text-slate-600">${escapeHtml(s.nama || '-')}</td>
            <td class="py-2 text-xs text-slate-400">${escapeHtml(s.rombel || s.kelas || '-')}</td>
        </tr>`).join('');

    container.innerHTML = `
    <div class="space-y-5 pb-8">
        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                <p class="text-2xl font-black text-slate-800">${total}</p>
                <p class="text-xs text-slate-400 font-semibold mt-0.5">Total</p>
            </div>
            <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center shadow-sm">
                <p class="text-2xl font-black text-emerald-600">${hadir}</p>
                <p class="text-xs text-emerald-500 font-semibold mt-0.5">Sudah Hadir</p>
            </div>
            <div class="rounded-2xl bg-red-50 border border-red-200 p-4 text-center shadow-sm">
                <p class="text-2xl font-black text-red-500">${belum}</p>
                <p class="text-xs text-red-400 font-semibold mt-0.5">Belum Hadir</p>
            </div>
        </div>

        <!-- Progress -->
        <div class="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold text-slate-700">Progress Kedatangan</span>
                <span class="text-sm font-black text-emerald-600">${pct}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style="width:${pct}%"></div>
            </div>
        </div>

        <!-- Export buttons -->
        <div class="flex gap-2">
            <button onclick="window.exportToWhatsApp()"
                class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95">
                <i class="fab fa-whatsapp"></i> Salin untuk WA
            </button>
            <button onclick="window.printCheckinList()"
                class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all active:scale-95">
                <i class="fas fa-print"></i> Cetak
            </button>
        </div>

        <!-- Hadir table -->
        ${hadir > 0 ? `
        <div class="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 class="font-black text-emerald-800 text-sm">✅ Sudah Hadir (${hadir})</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full px-4">
                    <thead><tr class="text-[10px] uppercase text-slate-400 font-bold">
                        <th class="text-left py-2 px-4">Nama</th>
                        <th class="text-left py-2">Kelas</th>
                        <th class="text-left py-2">Pukul</th>
                    </tr></thead>
                    <tbody class="px-4">${hadirRows}</tbody>
                </table>
            </div>
        </div>` : ''}

        <!-- Belum hadir table -->
        ${belum > 0 ? `
        <div class="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-red-50 border-b border-red-100">
                <h3 class="font-black text-red-700 text-sm">⏳ Belum Hadir (${belum})</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead><tr class="text-[10px] uppercase text-slate-400 font-bold">
                        <th class="text-left py-2 px-4">Nama</th>
                        <th class="text-left py-2">Kelas</th>
                    </tr></thead>
                    <tbody>${belumRows}</tbody>
                </table>
            </div>
        </div>` : ''}
    </div>`;
}

// ─── Export: WhatsApp text ─────────────────────────────────────
function exportToWhatsApp() {
    const asrama = state.currentAsrama;
    const ev = CHECKIN_EVENT;
    const total = state.santriList.length;
    const hadirList = Object.entries(state.checkinData)
        .filter(([, r]) => r.status === 'hadir')
        .sort(([, a], [, b]) => new Date(a.waktu) - new Date(b.waktu));
    const hadir = hadirList.length;
    const belum = total - hadir;

    const now = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    let text = `✨ REKAP CHECK-IN KEMBALI ASRAMA ✨\n`;
    text += `*${asrama.nama}*\n`;
    text += `${ev.institution}\n`;
    text += `Dicetak: ${now}\n\n`;
    text += `📊 *STATISTIK*\n`;
    text += `• Total Santri : ${total}\n`;
    text += `• Sudah Hadir  : ${hadir}\n`;
    text += `• Belum Hadir  : ${belum}\n\n`;

    if (hadir > 0) {
        text += `✅ *SUDAH HADIR (${hadir})*\n`;
        hadirList.forEach(([, r], idx) => {
            const jam = new Date(r.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            text += `${idx + 1}. ${r.nama} (${r.rombel}) — ${jam}\n`;
        });
        text += '\n';
    }

    const belumList = state.santriList
        .filter(s => !state.checkinData[s.nis] || state.checkinData[s.nis].status !== 'hadir')
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id'));
    if (belumList.length > 0) {
        text += `⏳ *BELUM HADIR (${belumList.length})*\n`;
        belumList.forEach((s, idx) => {
            text += `${idx + 1}. ${s.nama} (${s.rombel || s.kelas || '-'})\n`;
        });
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotif('Teks rekap berhasil disalin! Tempelkan ke WhatsApp.', 'success');
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showNotif('Teks rekap berhasil disalin!', 'success');
    } catch {
        showNotif('Gagal menyalin. Silakan salin manual.', 'error');
    }
    document.body.removeChild(ta);
}

// ─── Export: Print ────────────────────────────────────────────
function printCheckinList() {
    const asrama = state.currentAsrama;
    const ev = CHECKIN_EVENT;
    const total = state.santriList.length;

    const hadirList = Object.entries(state.checkinData)
        .filter(([, r]) => r.status === 'hadir')
        .sort(([, a], [, b]) => new Date(a.waktu) - new Date(b.waktu));
    const belumList = state.santriList
        .filter(s => !state.checkinData[s.nis] || state.checkinData[s.nis].status !== 'hadir')
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id'));

    const hadirRows = hadirList.map(([nis, r], i) => {
        const jam = new Date(r.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `<tr><td>${i + 1}</td><td>${escapeHtml(r.nama || nis)}</td><td>${escapeHtml(r.rombel || '-')}</td><td>${escapeHtml(jam)}</td><td>✅</td></tr>`;
    }).join('');

    const belumRows = belumList.map((s, i) => `<tr>
        <td>${hadirList.length + i + 1}</td>
        <td>${escapeHtml(s.nama || '-')}</td>
        <td>${escapeHtml(s.rombel || s.kelas || '-')}</td>
        <td>—</td>
        <td></td>
    </tr>`).join('');

    const now = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Rekap Check-in ${escapeHtml(asrama.nama)}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        h2 { font-size: 13px; color: #555; margin-bottom: 2px; }
        .meta { color: #777; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0f0f0; padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 2px solid #ccc; }
        td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; }
        tr:nth-child(even) td { background: #fafafa; }
        .stats { display: flex; gap: 20px; margin-bottom: 16px; }
        .stat-box { background: #f8f8f8; border-radius: 8px; padding: 10px 16px; text-align: center; }
        .stat-num { font-size: 22px; font-weight: 900; }
        @media print { button { display: none; } }
    </style></head>
    <body>
    <h1>Rekap Check-in Kembali Asrama</h1>
    <h2>${escapeHtml(asrama.nama)}</h2>
    <p class="meta">${escapeHtml(ev.institution)} · ${escapeHtml(ev.arrival.day)}, ${escapeHtml(ev.arrival.date)} · Dicetak: ${escapeHtml(now)}</p>
    <div class="stats">
        <div class="stat-box"><div class="stat-num">${total}</div><div>Total</div></div>
        <div class="stat-box" style="color:green"><div class="stat-num">${hadirList.length}</div><div>Hadir</div></div>
        <div class="stat-box" style="color:red"><div class="stat-num">${belumList.length}</div><div>Belum</div></div>
    </div>
    <table>
        <thead><tr><th>#</th><th>Nama Santri</th><th>Kelas</th><th>Pukul Hadir</th><th>Status</th></tr></thead>
        <tbody>${hadirRows}${belumRows}</tbody>
    </table>
    <p style="font-size:11px;color:#999">Dikelola oleh ${escapeHtml(asrama.koordinator)} — ${escapeHtml(asrama.nama)}</p>
    <br><button onclick="window.print()">🖨️ Cetak Sekarang</button>
    </body></html>`);
    win.document.close();
    win.focus();
}

// ─── Login Logic ──────────────────────────────────────────────
function doLogin() {
    const asramaId = document.getElementById('select-asrama')?.value;
    const pin = document.getElementById('input-pin')?.value;
    const errEl = document.getElementById('login-error');

    if (!asramaId) {
        if (errEl) errEl.textContent = 'Pilih asrama terlebih dahulu.';
        return;
    }
    if (!pin) {
        if (errEl) errEl.textContent = 'Masukkan PIN musyrif.';
        return;
    }

    const asrama = ASRAMA_CONFIG.find(a => a.id === asramaId);
    if (!asrama) {
        if (errEl) errEl.textContent = 'Asrama tidak ditemukan.';
        return;
    }
    if (pin !== asrama.pin) {
        if (errEl) errEl.textContent = 'PIN salah. Coba lagi.';
        const input = document.getElementById('input-pin');
        if (input) { input.value = ''; input.focus(); }
        return;
    }

    // Login success
    state.currentAsrama = asrama;
    state.checkinData = loadCheckinData(asrama.id);

    // Build santri list for this asrama
    state.santriList = buildSantriListForAsrama(window._checkinAllSantri || [], asrama);

    // Populate checkin records for any santri not yet tracked
    state.santriList.forEach(s => {
        if (!state.checkinData[s.nis]) {
            // Not yet tracked — leave as-is (no record = belum hadir)
        }
    });

    showDashboard();
}

function doLogout() {
    if (!confirm('Yakin ingin keluar? Data check-in sudah tersimpan.')) return;
    state.currentAsrama = null;
    state.santriList = [];
    state.activeTab = 'checkin';
    showLoginView();
}

// ─── View switching ───────────────────────────────────────────
function showLoginView() {
    document.getElementById('view-login')?.classList.remove('hidden');
    document.getElementById('view-dashboard')?.classList.add('hidden');
    const pinInput = document.getElementById('input-pin');
    if (pinInput) pinInput.value = '';
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
}

function showDashboard() {
    document.getElementById('view-login')?.classList.add('hidden');
    document.getElementById('view-dashboard')?.classList.remove('hidden');

    // Update header
    const nameEl = document.getElementById('dashboard-asrama-name');
    if (nameEl) nameEl.textContent = state.currentAsrama.nama;

    updateStatsBar();
    renderSeruanTab();
    renderCheckinTab();
    renderRekapTab();
    switchTab('checkin');
}

// ─── Search & filter handlers ─────────────────────────────────
function handleSearch(q) {
    state.searchQuery = q;
    renderCheckinTab();
}

function handleFilterStatus(f) {
    state.filterStatus = f;
    // Update active filter button styles
    ['all', 'hadir', 'belum'].forEach(val => {
        const btn = document.getElementById(`filter-${val}`);
        if (!btn) return;
        if (val === f) {
            btn.classList.add('bg-slate-800', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-500');
        } else {
            btn.classList.remove('bg-slate-800', 'text-white');
            btn.classList.add('bg-white', 'text-slate-500');
        }
    });
    renderCheckinTab();
}

// ─── Initialization ───────────────────────────────────────────
async function init() {
    const preloader = document.getElementById('preloader');
    const statusEl = document.getElementById('preloader-status');

    // Populate asrama dropdown
    const selectEl = document.getElementById('select-asrama');
    if (selectEl) {
        ASRAMA_CONFIG.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.nama;
            selectEl.appendChild(opt);
        });
    }

    try {
        if (statusEl) statusEl.textContent = 'Mengunduh data santri...';
        const data = await loadSantriDataWithCache();
        window._checkinAllSantri = normalizeSantriData(data);
        if (statusEl) statusEl.textContent = 'Data siap!';
    } catch (err) {
        console.error('Gagal memuat data santri:', err);
        if (statusEl) statusEl.textContent = 'Gagal memuat data. Refresh halaman.';
        if (preloader) {
            preloader.innerHTML += `<p style="color:red;font-size:12px;margin-top:8px">Error: ${err.message}<br><button onclick="location.reload()" style="margin-top:8px;padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer">Refresh</button></p>`;
        }
        return;
    }

    // Hide preloader
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.4s';
        setTimeout(() => preloader.style.display = 'none', 400);
    }

    showLoginView();
}

// ─── Expose to window (HTML inline handlers) ──────────────────
window.markHadir = markHadir;
window.batalHadir = batalHadir;
window.exportToWhatsApp = exportToWhatsApp;
window.printCheckinList = printCheckinList;
window.doLogin = doLogin;
window.doLogout = doLogout;
window.switchTab = switchTab;
window.handleSearch = handleSearch;
window.handleFilterStatus = handleFilterStatus;

// ─── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
