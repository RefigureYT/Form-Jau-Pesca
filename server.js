import 'dotenv/config';
import express from 'express';
import formRouter from './src/routes/form.js'
import path from 'path';
import { fileURLToPath } from 'url';

export const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rota de health-check
app.get('/health', (req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
})

// ============== Rotas ==============
app.use('/static', express.static(path.join(__dirname, 'src', 'static')));
app.use('/img', express.static(path.join(__dirname, 'src', 'img')));
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

// 404 fallback
app.use((req, res) => {
    // Primeiro a gente verifica se o site o cliente está tentando acessar via WEB ou via API
    if (req.accepts('html')) { // && !req.path.startsWith('/api') <== Só caso seja adicionar um /api 
        return res.redirect(302, 'https://www.jaupesca.com.br/');
    }
    res.status(404).json({ error: 'Not Found' });
});

// Middleware de erro (sempre 4 args)
app.use((err, req, res, next) => {
    console.err(err);
    if (res.headersSent) return next(err);

    // Para páginas, manda para o site... API joga um JSON de erro
    if (req.accepts('html') && !req.path.startsWith('/api')) {
        // 303 evita re-post no destino se o erro veio de um POST
        return res.redirect(303, 'https://www.jaupesca.com.br/');
    }

    res.status(err.statusCode || 500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 62143;

app.listen(PORT, () => {
    console.log(`Rodando em http://localhost:${PORT}`);
})