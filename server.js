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
    res.redirect('/form');
});

// 404 para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Middleware central de erros (sempre com 4 args)
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 62143;

app.listen(PORT, () => {
    console.log(`Rodando em http://localhost:${PORT}`);
})