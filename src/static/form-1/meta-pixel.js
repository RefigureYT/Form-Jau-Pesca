// src/static/form-1/meta-pixel.js
(() => {
    'use strict';

    // === CONFIG ================================================================
    const PIXEL_ID = '870629720028593'; // <- ajuste se necessário

    // === Loader do fbq (Meta Pixel) ===========================================
    if (!window.fbq) {
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            }; if (!f._fbq) n._fbq = n;
            n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
        }
            (window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    try {
        fbq('init', PIXEL_ID);
        fbq('track', 'PageView');
    } catch (e) {
        console.warn('fbq não inicializado:', e);
    }

    // === Helpers ===============================================================
    function getCookie(name) {
        return document.cookie.split('; ')
            .find(row => row.startsWith(name + '='))?.split('=')[1] || null;
    }
    function getFbc() {
        try {
            const url = new URL(location.href);
            const fbclid = url.searchParams.get('fbclid');
            if (fbclid) return `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}`;
        } catch (_) { }
        return getCookie('_fbc');
    }
    function genEventId() {
        if (window.crypto?.randomUUID) return crypto.randomUUID();
        return 'evt_' + Math.random().toString(36).slice(2) + Date.now();
    }

    // === API pública: chama no sucesso do formulário ===========================
    async function metaLeadTrack({ email = null, phone = null } = {}) {
        const eventID = genEventId();

        // Pixel (frontend)
        try { if (typeof fbq === 'function') fbq('trackCustom', 'Lead_FormularioJauPesca', {}, { eventID }); } catch (_) { }

        // CAPI (backend)
        const payload = {
            eventID,
            email,
            phone,
            fbp: getCookie('_fbp'),
            fbc: getFbc(),
            event_source_url: location.href
        };
        try {
            await fetch('/api/meta/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
                credentials: 'same-origin'
            });
        } catch (e) {
            console.error('Falha ao enviar CAPI:', e);
        }
        return eventID;
    }

    // expõe no escopo global
    window.metaLeadTrack = metaLeadTrack;
})();