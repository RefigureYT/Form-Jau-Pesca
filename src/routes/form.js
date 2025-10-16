import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/',(req, res) => {
    console.log('Requisição recebida');
    const file = path.join(__dirname, '..', 'static', 'form', 'form.html');
    res.sendFile(file);
});

router.get('/formulario-enviado', (req, res) => {
    console.log('Requisição recebida');
    const file = path.join(__dirname, '..', 'static', 'form', 'form-ok.html');
    res.sendFile(file);
});

export default router;