// js/utils.js
// ============================================================
// UTILITAS UMUM APLIKASI CHECK-IN ASRAMA
// ============================================================

/**
 * Escape karakter HTML untuk mencegah XSS.
 * @param {string} text - Teks yang akan di-escape
 * @returns {string} Teks yang aman untuk ditampilkan di HTML
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, c => map[c]);
}
