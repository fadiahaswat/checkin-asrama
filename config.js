// config.js

// --- KONFIGURASI API & SERVER ---
export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
export const GAS_SANTRI_API_URL = "https://script.google.com/macros/s/AKfycbw-URYAsLTWCdnGurQhM1ZXa9N8vm-GBlHwtetDlin73-Ma8G0aAbFoboGGUI8GgVDl/exec";
export const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
export const NEWS_PER_PAGE = 6;

// --- KONFIGURASI RECAPTCHA ---
export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";

// --- KONFIGURASI FIREBASE ---
export const firebaseConfig = {
    apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
    authDomain: "lazismu-auth.firebaseapp.com",
    projectId: "lazismu-auth",
    storageBucket: "lazismu-auth.firebasestorage.app",
    messagingSenderId: "398570239500",
    appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
};

// --- KONFIGURASI LANGKAH WIZARD DONASI ---
export const STEP_TITLES = [
    {
        title: "Pilih Jenis Kebaikan",
        subtitle: "Niat Suci Dimulai"
    },
    {
        title: "Tentukan Nominal",
        subtitle: "Semoga Rezeki Berkah"
    },
    {
        title: "Isi Data Muzakki/Munfiq",
        subtitle: "Menyambung Silaturahmi"
    },
    {
        title: "Metode Pembayaran",
        subtitle: "Mudah dan Aman"
    },
    {
        title: "Konfirmasi Akhir",
        subtitle: "Menjemput Ridho-Nya"
    }
];

// --- KONFIGURASI CACHE DATA SANTRI ---
export const CACHE = {
    KEY: 'santri_data_cache',       // LocalStorage key for cached santri data
    TIME_KEY: 'santri_data_time',   // LocalStorage key for cache timestamp
    EXPIRY_HOURS: 24                // Cache validity period in hours
};

// --- DATABASE REKENING BANK TRANSFER ---
export const BANK_ACCOUNTS = {
    bni: {
        name: 'Bank BNI',
        accountNumber: '3440000348',
        displayNumber: '3440 000 348',
        logo: 'assets/images/bank-bni.png',
        hoverColor: 'hover:bg-orange-500 hover:text-white hover:border-orange-500'
    },
    bsi: {
        name: 'BSI (Syariah)',
        accountNumber: '7930030303',
        displayNumber: '7930 030 303',
        logo: 'assets/images/bank-bsi.png',
        hoverColor: 'hover:bg-teal-500 hover:text-white hover:border-teal-500'
    },
    bpd: {
        name: 'BPD DIY Syariah',
        accountNumber: '801241004624',
        displayNumber: '801 241 004 624',
        logo: 'assets/images/bank-bpd.png',
        hoverColor: 'hover:bg-blue-500 hover:text-white hover:border-blue-500'
    }
};

// --- DATABASE LINK GAMBAR QRIS ---
export const qrisDatabase = {
    'bni': {
        title: 'QRIS BNI',
        img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000', // Link Gambar Tampilan
        url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' // Link Download
    },
    'bsi': {
        title: 'QRIS BSI',
        img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V&sz=w1000',
        url: 'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V'
    },
    'bpd': {
        title: 'QRIS BPD DIY',
        img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm&sz=w1000',
        url: 'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm'
    }
};

// --- KONFIGURASI PLACEHOLDER GAMBAR ---
export const PLACEHOLDER_IMAGE = {
    NEWS_CARD: 'https://via.placeholder.com/600x400?text=Lazismu+Update',
    NEWS_MODAL: 'https://via.placeholder.com/1200x600?text=Lazismu+Update',
    ADMIN_AVATAR: 'https://ui-avatars.com/api/?name=Admin+Lazismu&background=random',
    ADMIN_AVATAR_FALLBACK: 'https://ui-avatars.com/api/?name=Admin'
};

// --- KONFIGURASI AVATAR SANTRI ---
export const UI_AVATARS_BASE_URL = 'https://ui-avatars.com/api/';
export const SANTRI_AVATAR_OPTIONS = 'background=10b981&color=fff';

// --- TEKS LOADING PRELOADER (main & sub harus satu indeks, berganti bersama) ---
export const LOADING_TEXTS = [
    "Menghubungkan ke Server...",
    "Memeriksa Keamanan...",
    "Mengambil Data Santri...",
    "Menyiapkan Data Kelas...",
    "Menyinkronkan Data...",
    "Hampir Selesai..."
];

export const LOADING_SUBS = [
    "Membangun koneksi yang aman",
    "🔒 Memverifikasi enkripsi koneksi",
    "📥 Mengunduh data dari database",
    "🧮 Menghitung rekap donasi & ZIS",
    "🔄 Data terbaru sedang disiapkan",
    "⏳ Mohon bersabar sebentar lagi"
];

// --- KONTAK RESMI LAZISMU MUALLIMIN ---
export const CONTACT = {
    WA_NUMBER: '6281196961918',       // Nomor WhatsApp (format internasional, tanpa +)
    WA_DISPLAY: '0811-9696-1918',     // Format tampilan nomor WhatsApp
    EMAIL: 'lazismumuallimin@gmail.com',
    ADDRESS: 'Jl. Letjend S. Parman No.68, Patangpuluhan, Wirobrajan, Yogyakarta',
    WA_CONSULT_TEXT: "Assalamu'alaikum, saya ingin berkonsultasi tentang program kebaikan ZIS."
};

// --- LINK MEDIA SOSIAL ---
export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/lazismu_muallimin',
    youtube: 'https://youtube.com/@lazismumuallimin',
    tiktok: 'https://tiktok.com/@lazismu_muallimin',
    twitter: 'https://x.com/lazismuallimin',
    facebook: 'https://facebook.com/lazismumuallimin',
    facebookPage: 'https://facebook.com/kl.lazismumuallimin'
};

// --- NOMINAL PAKET DONASI (Homepage Beautification Section) ---
export const DONATION_PACKAGES = [100000, 500000, 1000000]; // Paket: Bronze, Silver, Gold

// --- NOMINAL CEPAT (Tombol Pilihan di Wizard Donasi Step 2) ---
export const QUICK_NOMINALS = [50000, 100000, 250000, 500000, 1000000, 2000000];
