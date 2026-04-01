// checkin-asrama-config.js
// ============================================================
// KONFIGURASI APLIKASI CHECK-IN KEMBALI KE ASRAMA
// Edit file ini untuk menyesuaikan event setiap periode
// ============================================================

/**
 * Konfigurasi event check-in.
 * Ganti nilai-nilai di bawah ini sesuai jadwal dan info terkini.
 */
export const CHECKIN_EVENT = {
    /** ID unik event ini — dipakai sebagai kunci localStorage.
     *  Ganti setiap event baru agar data lama tidak terpakai. */
    id: "balik-asrama-syawal-1447",

    title: "Kembali Ke Asrama",
    institution: "Madrasah Mu'allimin Muhammadiyah Yogyakarta",
    tagline: "Fitrah Kembali, Siapkan Diri! 🌙",
    greeting: "Assalamu'alaikum warahmatullahi wabarakatuh",
    intro: "Ayah Bunda yang dirahmati Allah, setelah merayakan Idul Fitri bersama keluarga, kini saatnya Ananda kembali ke asrama untuk melanjutkan perjuangan menuntut ilmu. Mari kita persiapkan kepulangan Ananda dengan semangat fitrah dan kedisiplinan tinggi. 🌟",

    /** Informasi hari kedatangan */
    arrival: {
        day: "Ahad",
        date: "5 April 2026",
        time: "08.00 – 17.00 WIB",
        earlyPolicy: "Bagi santri yang datang lebih awal (sebelum hari H atau sebelum pukul 08.00 WIB), WAJIB konfirmasi dan koordinasi terlebih dahulu dengan Musyrif masing-masing.",
    },

    /** Syarat fisik sebelum masuk asrama */
    requirements: [
        {
            icon: "✂️",
            label: "RAMBUT",
            desc: "Belum rapi/pendek/tidak proporsional (Wajib kriteria 3-2-1). Dilarang mullet, mohawk, skin, dll.",
            negation: true, // true = syarat ini "BELUM BOLEH masuk jika..."
        },
        {
            icon: "💅",
            label: "KUKU",
            desc: "Masih panjang atau kotor.",
            negation: true,
        },
    ],

    requirementNote: "Jika belum rapi, santri wajib merapikannya terlebih dahulu sebelum proses pelaporan/check-in.",

    /** Alur kedatangan (drive thru) */
    flow: {
        masuk: "Gerbang Timur (Pos PKM)",
        keluar: "Gerbang Barat (Depan Masjid)",
        parkir: "Mobil di Lapangan, Motor di Depan Madrasah",
        checkin: "Lobby Madrasah",
    },

    /** Checklist kelengkapan wajib */
    checklist: [
        {
            no: 1,
            label: "AMANAH RAMADHAN",
            desc: "Pastikan Map ZIS Ramadan 1447 H. sudah terbawa di dalam tas dan TIDAK TERTINGGAL di rumah.",
        },
        {
            no: 2,
            label: "BARANG TERLARANG",
            desc: "Dilarang membawa HP, alat elektronik, atau pakaian di luar ketentuan (pakaian tidak syar'i atau celana berbahan jeans). Jika ditemukan, barang akan DISITA dan diserahkan ke BK.",
        },
        {
            no: 3,
            label: "PAKAIAN",
            desc: "Pastikan jumlahnya tidak melebihi kapasitas lemari (tidak boleh menumpuk di luar lemari). Khususnya sepatu/sandal & box/kontainer/koper yang berlebihan atau memakan tempat.",
        },
    ],

    /** Kebijakan keterlambatan */
    latePolicy: "Santri yang terlambat tanpa keterangan akan mendapatkan pembinaan. Jika ada kendala syar'i/mendesak, mohon segera kirim Surat Keterlambatan.",

    /** Penutup */
    closing: "Mari kita awali langkah pasca Syawwal ini dengan hati yang bersih dan disiplin yang kuat. Terima kasih atas kerja sama Ayah Bunda semuanya. 🚀",
    signature: "Tim Pengasuhan Asrama",
    signatureDate: "Yogyakarta, 31 Maret 2026",
};

/**
 * Daftar asrama beserta konfigurasinya.
 *
 * Setiap objek berisi:
 * - id         : Identifier unik (huruf kecil, tanpa spasi), dipakai untuk localStorage
 * - filterKey  : Nilai (substring) yang dicocokkan dengan field `asrama` di data santri
 *                (case-insensitive partial match). Kosongkan ("") untuk menampilkan semua santri.
 * - nama       : Nama lengkap asrama (ditampilkan di UI)
 * - pin        : PIN 4–6 digit untuk login musyrif asrama ini
 * - koordinator: Nama koordinator/musyrif utama asrama ini
 * - suratUrl   : Link template surat keterlambatan untuk asrama ini
 * - lokasi     : Lokasi check-in asrama ini
 * - warna      : Warna tema UI untuk asrama ini
 *                Pilihan: "blue" | "green" | "purple" | "orange" | "teal" | "rose"
 */
export const ASRAMA_CONFIG = [
    {
        id: "asrama-1",
        filterKey: "Asrama 1",
        nama: "Asrama 1 Abu Bakar Ash-Shiddiq",
        pin: "1234",
        koordinator: "Ustadz Andi A.",
        suratUrl: "https://fadiahaswat.github.io/izinasramasatu/",
        lokasi: "Asrama 1 Abu Bakar Ash-Shiddiq",
        warna: "blue",
    },
    // Tambahkan asrama lain di bawah ini:
    // {
    //     id: "asrama-2",
    //     filterKey: "Asrama 2",
    //     nama: "Asrama 2 Umar bin Khattab",
    //     pin: "5678",
    //     koordinator: "Ustadz ...",
    //     suratUrl: "https://...",
    //     lokasi: "Asrama 2 ...",
    //     warna: "green",
    // },
];
