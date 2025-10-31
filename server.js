import 'dotenv/config';
import express from 'express';
import formRouter from './src/routes/form.js'
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import crypto from 'crypto';

export const app = express();

app.use(express.json());
app.set('trust proxy', true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rota de health-check
app.get('/health', (req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
})

// ============== Rotas ==============
app.use(
    '/static',
    express.static(path.join(__dirname, 'src', 'static'), {
        fallthrough: false // se não achar o arquivo, responde 404 aqui (não cai no fallback que redireciona)
    })
);
app.use(
    '/img',
    express.static(path.join(__dirname, 'src', 'img'), { maxAge: '1y', immutable: true, fallthrough: false })
);
app.use('/favicon.ico',
    express.static(path.join(__dirname, 'src', 'img', 'favicon.ico'), { fallthrough: false })
);
app.use('/form', formRouter);
// ===================================


// Redirecionamento para o formulário
app.get('/', (req, res) => {
    res.redirect('https://www.jaupesca.com.br/');
});

// Redirecionamento para o formulário
app.get('/1', (req, res) => {
    res.redirect('/form/formulario-cadastro-parceria-jau-pesca');
});

// === Meta Conversions API (v24) =============================================
// (DEFINIR A CAPI ANTES DO 404!)
const sha256 = (str) => crypto.createHash('sha256').update(String(str).trim().toLowerCase()).digest('hex');
const normPhone = (s) => String(s || '').replace(/\D+/g, '');

app.post('/api/meta/lead', async (req, res) => {
    const { eventID, email, phone, fbp, fbc, event_source_url } = req.body || {};

    const user_data = {
        client_ip_address: String((req.headers['x-forwarded-for'] || req.ip || '')).split(',')[0].trim(),
        client_user_agent: req.headers['user-agent'] || '',
        ...(email ? { em: sha256(email) } : {}),
        ...(phone ? { ph: sha256(normPhone(phone)) } : {}),
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {})
    };

    const data = [{
        event_name: 'Lead_FormularioJauPesca',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: eventID,
        event_source_url,
        user_data
    }];

    try {
        const qs = new URLSearchParams({ access_token: process.env.META_ACCESS_TOKEN });
        if (process.env.META_TEST_EVENT_CODE) qs.set('test_event_code', process.env.META_TEST_EVENT_CODE);

        const url = `https://graph.facebook.com/v24.0/${process.env.PIXEL_ID}/events?` + qs.toString();
        const { data: meta } = await axios.post(url, { data }, { timeout: 10000 });
        return res.json({ ok: true, meta });
    } catch (err) {
        const detail = err.response?.data || err.message;
        console.error('[CAPI] erro:', detail);
        return res.status(500).json({ ok: false, error: detail });
    }
});

// 404 fallback — nunca redirecionar chamadas de API
app.use((req, res) => {
    // Nunca redirecionar recursos de API/estáticos
    if (req.path.startsWith('/api') || req.path.startsWith('/static') || req.path.startsWith('/img') || req.path === '/favicon.ico') {
        return res.status(404).json({ error: 'Not Found' });
    }
    // Só redireciona se o cliente pediu explicitamente HTML (evita * / * virar redirecionamento)
    const acceptsHTML = /\btext\/html\b/.test(req.headers.accept || '');
    if (acceptsHTML) {
        return res.redirect(302, 'https://www.jaupesca.com.br/');
    }
    return res.status(404).json({ error: 'Not Found' });
});

// Middleware de erro (sempre 4 args)
app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    if (req.path.startsWith('/api')) {
        return res.status(err.statusCode || 500).json({ error: 'Internal Server Error' });
    }
    return res.redirect(303, 'https://www.jaupesca.com.br/');
});

const PORT = process.env.PORT || 62143;

app.listen(PORT, () => {
    console.log(`Rodando em http://localhost:${PORT}`);
});