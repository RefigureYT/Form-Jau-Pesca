(() => {
    'use strict';

    /* ===================== Utils ===================== */
    const digits = (s) => (s || '').replace(/\D/g, '');
    const allSame = (s) => /^(\d)\1+$/.test(s);

    /* CNPJ mask + validation -------------------------------------------------- */
    function maskCNPJ(value) {
        const d = digits(value).slice(0, 14);
        let out = '';
        if (d.length > 0) out = d.slice(0, 2);
        if (d.length >= 3) out += '.' + d.slice(2, 5);
        if (d.length >= 6) out += '.' + d.slice(5, 8);
        if (d.length >= 9) out += '/' + d.slice(8, 12);
        if (d.length >= 13) out += '-' + d.slice(12, 14);
        return out;
    }
    function isValidCNPJ(value) {
        const c = digits(value);
        if (c.length !== 14) return false;
        if (allSame(c)) return false;
        const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let s = 0; for (let i = 0; i < 12; i++) s += +c[i] * w1[i];
        let r = s % 11, dv1 = r < 2 ? 0 : 11 - r;
        if (dv1 !== +c[12]) return false;
        const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        s = 0; for (let i = 0; i < 13; i++) s += +c[i] * w2[i];
        r = s % 11; const dv2 = r < 2 ? 0 : 11 - r;
        return dv2 === +c[13];
    }

    /* Telefone BR mask + validation ------------------------------------------- */
    function maskPhone(value) {
        const d = digits(value).slice(0, 11); // 10 (fixo) ou 11 (cel)
        const len = d.length;
        if (len === 0) return '';
        if (len <= 2) return `(${d}`;
        if (len <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (len <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; // 11 dígitos
    }
    function isValidPhone(value) {
        const d = digits(value);
        if (!(d.length === 10 || d.length === 11)) return false;
        if (allSame(d)) return false;
        const ddd = d.slice(0, 2);
        if (!/^[1-9]\d$/.test(ddd) || ddd === '00') return false;
        const n1 = d[2];
        if (d.length === 11) return n1 === '9';   // celular
        return /[2-8]/.test(n1);                  // fixo
    }

    /* Helpers de UI ----------------------------------------------------------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const show = (el) => { if (el) el.hidden = false; };
    const hide = (el) => { if (el) el.hidden = true; };
    const setInvalid = (input, errEl, on = true) => {
        if (!input) return;
        input.classList.toggle('is-invalid', !!on);
        input.setAttribute('aria-invalid', on ? 'true' : 'false');
        if (errEl) errEl.hidden = !on;
    };
    function clearInputs(container) {
        if (!container) return;
        $$('input, textarea, select', container).forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
            else el.value = '';
        });
    }
    const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const checkedVal = (name, ctx = document) => {
        const el = ctx.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : null;
    };
    const checkedVals = (name, ctx = document) => {
        return Array.from(ctx.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
    };

    /* ===== Tema (cookies) ===== */
    function ensureThemeMeta() {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        return meta;
    }
    function setupThemeSwitch() {
        const root = document.documentElement;
        const getCookie = (name) => {
            const row = document.cookie.split('; ').find(r => r.startsWith(name + '='));
            return row ? decodeURIComponent(row.split('=')[1]) : null;
        };
        const setCookie = (name, value, days = 365) => {
            const d = new Date(); d.setTime(d.getTime() + days * 864e5);
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
        };
        const applyTheme = (theme) => {
            root.dataset.theme = theme;
            const meta = ensureThemeMeta();
            const bg = getComputedStyle(document.body).backgroundColor || (theme === 'dark' ? '#071319' : '#f4fbfd');
            meta.setAttribute('content', bg);
        };

        const current = root.dataset.theme || getCookie('theme') || 'light';
        applyTheme(current);
        const input = document.getElementById('themeToggle');
        if (input) input.checked = (current === 'dark');
        input?.addEventListener('change', () => {
            const next = input.checked ? 'dark' : 'light';
            applyTheme(next);
            setCookie('theme', next);
        });
    }

    /* ===== Construção dinâmica do HTML ===== */
    function buildAppHTML() {
        // usa <main class="wizard"> como raiz. Se não existir, cria.
        let app = document.querySelector('main.wizard');
        if (!app) {
            app = document.createElement('main');
            app.className = 'wizard';
            document.body.prepend(app);
        }
        // limpa conteúdo para evitar duplicidade
        app.innerHTML = '';

        const headerHTML = `
      <header class="wizard__header header">
        <div class="header__top">
          <h1 class="header__title">🧾 Formulário de Cadastro — Parcerias Jaú Pesca</h1>
          <div class="theme-switch">
            <input type="checkbox" id="themeToggle" aria-label="Alternar tema claro/escuro" />
            <label for="themeToggle">
              <span class="icon sun" aria-hidden="true">🌙</span>
              <span class="icon moon" aria-hidden="true">🌞</span>
              <span class="knob" aria-hidden="true"></span>
            </label>
          </div>
        </div>
        <p class="header__lead">
          Quer ser <strong>revendedor</strong> ou <strong>representante comissionado</strong>?
          Preencha os dados da sua empresa/atividade. Assim entendemos seu perfil e
          oferecemos as melhores condições para uma parceria sólida. 🚀
        </p>
        <figure class="hero" role="img" aria-label="Produtos e equipamentos de pesca da Jaú Pesca">
          <img src="/img/jaupesca.png" alt="Linha de produtos para pesca" loading="lazy" decoding="async" />
        </figure>
        <p class="sub">Responda passo a passo. O conteúdo se adapta às suas respostas.</p>
        <div class="progress"><div id="progressBar" class="progress__bar"></div></div>
      </header>
    `;

        const formHTML = `
      <form id="wizardForm" novalidate>
        <!-- STEP 1 — Tipo de parceria -->
        <section class="step is-visible" data-step="1">
          <h2>1/6 — Você deseja se cadastrar como?</h2>
          <div class="field-group">
            <label class="choice"><input type="radio" name="tipo_parceria" value="Lojista"> Lojista (revenda com compras)</label>
            <label class="choice"><input type="radio" name="tipo_parceria" value="Representante"> Representante comissionado (afiliado)</label>
            <label class="choice"><input type="radio" name="tipo_parceria" value="Consumidor Final"> Consumidor final (uso próprio)</label>
          </div>
          <div class="actions"><button type="button" class="btn" id="next1" disabled>Próximo</button></div>
        </section>

        <!-- STEP 1b — Consumidor final (aparece só quando selecionado) -->
        <section class="step" id="cfStep" data-step="cf" hidden>
          <h2>Consumidor final — seus dados</h2>

          <div class="field">
            <label class="label required">Nome completo</label>
            <input id="cf_nome" type="text" autocomplete="name" placeholder="Seu nome">
            <small id="cfNomeError" class="error" hidden>Informe seu nome.</small>
          </div>

          <div class="field">
            <label class="label required">E-mail</label>
            <input id="cf_email" type="email" autocomplete="email" placeholder="voce@exemplo.com">
            <small id="cfEmailError" class="error" hidden>E-mail inválido. Por favor, insira um e-mail válido.</small>
          </div>

          <div class="field">
            <label class="label required">Telefone (WhatsApp)</label>
            <input id="cf_telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(  ) _____-____">
            <small id="cfTelError" class="error" hidden>Número inválido. Use DDD + número (10 a 11 dígitos).</small>
          </div>

          <div class="field">
            <label class="label">
              <input id="cf_optin" type="checkbox" checked>
              <span>Se você <strong>NÃO</strong> quiser receber cupons de desconto e promoções, desative esta opção.</span>
            </label>
          </div>

          <div class="actions">
            <button type="submit" class="btn" id="cfEnviar" disabled>Enviar</button>
          </div>
        </section>

        <!-- STEP 2 — Empresa e CNPJ -->
        <section class="step" data-step="2" hidden>
          <h2>2/6 — Dados da empresa</h2>

          <div class="field">
            <label class="label">Nome da empresa (ou nome completo, se autônomo)</label>
            <input id="empresa" name="empresa" type="text" autocomplete="organization" placeholder="Ex.: Silvio de Alencar Turatti - ME">
          </div>

          <div class="field">
            <label class="label">Razão social (se aplicável)</label>
            <input id="razao" name="razao_social" type="text" placeholder="Ex.: Jaú Pesca Comércio de Artigos Esportivos LTDA">
          </div>

          <div class="field">
            <label class="label">Cidade e estado</label>
            <input id="cidade" name="cidade_uf" type="text" placeholder="Ex.: Jaú/SP">
          </div>

          <div class="info">Digite somente números. O formato será preenchido automaticamente.</div>
          <div class="field">
            <label class="label required">CNPJ</label>
            <input id="cnpj" name="cnpj" type="text" inputmode="numeric" autocomplete="off" placeholder="__.___.___/____-__">
            <small id="cnpjError" class="error" hidden>CNPJ inválido. Verifique e tente novamente.</small>
          </div>

          <div class="actions"><button type="button" class="btn" id="next2" disabled>Próximo</button></div>
        </section>

        <!-- STEP 3 — Responsável comercial -->
        <section class="step" data-step="3" hidden>
          <h2>3/6 — Responsável comercial</h2>

          <div class="field">
            <label class="label">Nome do responsável</label>
            <input id="resp_nome" name="responsavel_nome" type="text" placeholder="Ex.: Leandro Turatti" autocomplete="name">
          </div>

          <div class="field">
            <label class="label">Cargo/Função</label>
            <input id="resp_cargo" name="responsavel_cargo" type="text" placeholder="Ex.: Marketing/Vendas">
          </div>

          <div class="field">
            <label class="label">E-mail comercial</label>
            <input id="email" name="email_comercial" type="email" placeholder="exemplo@empresa.com.br" autocomplete="email">
            <small id="emailError" class="error" hidden>E-mail inválido. Por favor, insira um e-mail válido.</small>
          </div>

          <div class="field">
            <label class="label required">Telefone (WhatsApp)</label>
            <input id="telefone" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(  ) _____-____">
            <small id="telError" class="error" hidden>Número inválido. Use DDD + número (10 a 11 dígitos) e evite sequências repetidas.</small>
          </div>

          <div class="actions"><button type="button" class="btn" id="next3" disabled>Próximo</button></div>
        </section>

        <!-- STEP 4 — Tipo de negócio -->
        <section class="step" data-step="4" hidden>
          <h2>4/6 — Tipo de negócio</h2>

          <div class="field-group">
            <span class="label required">Já trabalha com produtos/serviços de pesca/camping/náutica?</span>
            <label class="choice"><input type="radio" name="segmento_atual" value="Sim"> Sim</label>
            <label class="choice"><input type="radio" name="segmento_atual" value="Não"> Não</label>
          </div>

          <div id="marcasGroup" class="field" hidden>
            <label class="label">Com quais produtos ou marcas você já trabalha?</label>
            <input id="marcas" name="marcas" type="text" placeholder="Kala, Nautika, Bestway, Maruri, Popfishing...">
          </div>

          <div class="field-group">
            <span class="label">Sua empresa atua como (pode marcar mais de uma)</span>
            <label class="choice"><input type="checkbox" name="atuacao[]" value="Loja física"> Loja física</label>
            <label class="choice"><input type="checkbox" name="atuacao[]" value="Loja online / e-commerce"> Loja online / e-commerce</label>
            <label class="choice"><input type="checkbox" name="atuacao[]" value="Representante comercial"> Representante comercial</label>
            <label class="choice"><input type="checkbox" name="atuacao[]" value="Distribuidora"> Distribuidora</label>
            <label class="choice"><input type="checkbox" name="atuacao[]" value="Outro"> Outro</label>
          </div>

          <div class="field-group">
            <span class="label">Há quanto tempo sua empresa atua no mercado?</span>
            <label class="choice"><input type="radio" name="tempo_mercado" value="Menos de 1 ano"> Menos de 1 ano</label>
            <label class="choice"><input type="radio" name="tempo_mercado" value="1 a 3 anos"> 1 a 3 anos</label>
            <label class="choice"><input type="radio" name="tempo_mercado" value="3 a 5 anos"> 3 a 5 anos</label>
            <label class="choice"><input type="radio" name="tempo_mercado" value="Mais de 5 anos"> Mais de 5 anos</label>
          </div>

          <div class="field-group">
            <span class="label">Quantas pessoas fazem parte da equipe comercial?</span>
            <label class="choice"><input type="radio" name="equipe_comercial" value="1 a 3"> 1 a 3</label>
            <label class="choice"><input type="radio" name="equipe_comercial" value="4 a 10"> 4 a 10</label>
            <label class="choice"><input type="radio" name="equipe_comercial" value="11 a 30"> 11 a 30</label>
            <label class="choice"><input type="radio" name="equipe_comercial" value="Mais de 30"> Mais de 30</label>
          </div>

          <div class="field-group">
            <span class="label">Onde sua empresa realiza vendas? (pode marcar mais de uma)</span>
            <label class="choice"><input type="checkbox" name="onde_vende[]" value="Loja física"> Loja física</label>
            <label class="choice"><input type="checkbox" name="onde_vende[]" value="Loja online própria"> Loja online própria</label>
            <label class="choice"><input type="checkbox" name="onde_vende[]" value="Marketplaces"> Marketplaces (Shopee, Mercado Livre, Amazon, etc.)</label>
            <label class="choice"><input type="checkbox" name="onde_vende[]" value="Redes sociais"> Redes sociais (Instagram, WhatsApp, etc.)</label>
            <label class="choice"><input type="checkbox" name="onde_vende[]" value="Vendas diretas / representantes"> Vendas diretas / representantes</label>
          </div>

          <div class="field">
            <label class="label">Público principal</label>
            <input id="publico" name="publico_principal" type="text" placeholder="Pescadores profissionais, público geral, lojistas...">
          </div>

          <div class="field-group">
            <span class="label">Média de pedidos mensais</span>
            <label class="choice"><input type="radio" name="media_pedidos" value="Até 50"> Até 50 pedidos</label>
            <label class="choice"><input type="radio" name="media_pedidos" value="51 a 200"> 51 a 200 pedidos</label>
            <label class="choice"><input type="radio" name="media_pedidos" value="201 a 500"> 201 a 500 pedidos</label>
            <label class="choice"><input type="radio" name="media_pedidos" value="500 a 1000"> 500 a 1000 pedidos</label>
            <label class="choice"><input type="radio" name="media_pedidos" value="Mais de 1000"> Mais de 1000 pedidos</label>
          </div>

          <div class="actions"><button type="button" class="btn" id="next4" disabled>Próximo</button></div>
        </section>

        <!-- STEP 5 — Parceria com a Jaú Pesca -->
        <section class="step" data-step="5" hidden>
          <h2>5/6 — Parceria com a Jaú Pesca</h2>

          <div class="field-group">
            <span class="label">Como conheceu a Jaú Pesca?</span>
            <label class="choice"><input type="radio" name="como_conheceu" value="Indicação"> Indicação</label>
            <label class="choice"><input type="radio" name="como_conheceu" value="Redes sociais"> Redes sociais</label>
            <label class="choice"><input type="radio" name="como_conheceu" value="Evento/Feira"> Evento / feira</label>
            <label class="choice"><input type="radio" name="como_conheceu" value="Google"> Pesquisa no Google</label>
            <label class="choice"><input type="radio" name="como_conheceu" value="Outro"> Outro</label>
          </div>

          <div class="field">
            <label class="label required">Linhas de produtos de interesse</label>
            <input id="linhas" name="linhas_interesse" type="text" placeholder="Varas, molinetes, iscas..." />
          </div>

          <div id="volumeGroup" class="field-group" hidden>
            <span class="label required">Volume de compra inicial estimado (somente para Lojista)</span>
            <label class="choice"><input type="radio" name="volume_inicial" value="Até R$2.000,00"> Até R$2.000,00</label>
            <label class="choice"><input type="radio" name="volume_inicial" value="R$2.000,00 a R$5.000,00"> R$2.000,00 a R$5.000,00</label>
            <label class="choice"><input type="radio" name="volume_inicial" value="R$5.000,00 a R$10.000,00"> R$5.000,00 a R$10.000,00</label>
            <label class="choice"><input type="radio" name="volume_inicial" value="Acima de R$10.000,00"> Acima de R$10.000,00</label>
          </div>

          <div class="actions"><button type="button" class="btn" id="next5" disabled>Próximo</button></div>
        </section>

        <!-- STEP 6 — Autorização e Observações -->
        <section class="step" data-step="6" hidden>
          <h2>6/6 — Autorização e observações</h2>

          <div class="field subtle-optin">
            <label class="label">
              <input id="autorizo" name="autorizo_contato" type="checkbox" checked>
              <span>Sim, autorizo o contato por WhatsApp/e-mail. <em>(Desmarque se não quiser.)</em></span>
            </label>
          </div>

          <div class="field">
            <label class="label">Observações</label>
            <textarea id="obs" name="observacoes" rows="4" placeholder="(opcional)"></textarea>
          </div>

          <div class="actions">
            <button type="submit" class="btn" id="enviar" disabled>Enviar</button>
            <p id="msg" class="msg" hidden>Enviado! Veja o console do navegador.</p>
          </div>
        </section>
      </form>
    `;
        app.insertAdjacentHTML('beforeend', headerHTML + formHTML);
    }

    /* ===== Wizard / Steps + lógica ===== */
    document.addEventListener('DOMContentLoaded', () => {
        buildAppHTML();
        setupThemeSwitch();

        const form = $('#wizardForm');
        if (!form) return;

        const steps = $$('.step', form);
        const progressBar = $('#progressBar');

        const btnNext1 = $('#next1');
        const btnNext2 = $('#next2');
        const btnNext3 = $('#next3');
        const btnNext4 = $('#next4');
        const btnNext5 = $('#next5');
        const btnEnviar = $('#enviar');

        const cnpjInput = $('#cnpj');
        const cnpjError = $('#cnpjError');
        const telInput = $('#telefone');
        const telError = $('#telError');

        const marcasGroup = $('#marcasGroup');
        const marcasInput = $('#marcas');
        const volumeGroup = $('#volumeGroup');

        const tipoRadios = $$('input[name="tipo_parceria"]');
        const segmentoRadios = $$('input[name="segmento_atual"]');

        const cfStep = document.getElementById('cfStep');
        const cfNome = document.getElementById('cf_nome');
        const cfEmail = document.getElementById('cf_email');
        const cfTel = document.getElementById('cf_telefone');
        const cfOptin = document.getElementById('cf_optin');
        const cfEnviar = document.getElementById('cfEnviar');

        const cfNomeError = document.getElementById('cfNomeError');
        const cfEmailError = document.getElementById('cfEmailError');
        const cfTelError = document.getElementById('cfTelError');

        telInput?.setAttribute('aria-describedby', 'telError');

        /* Progress */
        const updateProgress = () => {
            const tipo = checkedVal('tipo_parceria');
            const vis = steps.filter(s => s.classList.contains('is-visible')).length;
            const total = (tipo === 'Consumidor Final') ? 2 : 6; // CF: step1 + cf; B2B: 6 steps
            const pct = Math.max(5, Math.round((vis / total) * 100));
            if (progressBar) progressBar.style.width = `${pct}%`;
        };
        function nextStepFrom(fromEl) {
            const tipo = checkedVal('tipo_parceria');
            let i = steps.indexOf(fromEl);
            while (++i < steps.length) {
                const cand = steps[i];
                if (tipo === 'Consumidor Final') {
                    if (cand === cfStep) return cand;   // no CF, o próximo é o cfStep
                    continue;                            // pula steps B2B
                } else {
                    if (cand === cfStep) continue;       // no B2B, pula cfStep
                    return cand;                         // pega o próximo B2B
                }
            }
            return null;
        }
        const firstFocusable = (el) => el && el.querySelector(
            'input:not([type="hidden"]):not([disabled]), ' +
            'textarea:not([disabled]), select:not([disabled]), ' +
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const focusWhenVisible = (stepEl, delay = 220) => {
            setTimeout(() => { const f = firstFocusable(stepEl); if (f) f.focus(); }, delay);
        };
        function scrollToStep(stepEl, delay = 50) {
            if (!stepEl) return;
            const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
            const doScroll = () => stepEl.scrollIntoView({ behavior, block: 'start' });
            return delay ? setTimeout(doScroll, delay) : doScroll();
        }
        function revealStep(el) {
            if (!el) return;
            el.hidden = false;                                // essencial para aparecer!
            if (!el.classList.contains('is-visible')) {
                el.classList.add('is-visible', 'anim-in');
                setTimeout(() => el.classList.remove('anim-in'), 200);
            }
            updateProgress();
            scrollToStep(el, 80);
            focusWhenVisible(el, 220);
        }
        function hideStep(el) {
            if (!el) return;
            el.classList.remove('is-visible');
            el.hidden = true;
            updateProgress();
        }
        function goNext(fromEl) {
            const nx = nextStepFrom(fromEl);
            if (nx) revealStep(nx);
        }

        /* === VALIDADORES === */
        function isValidEmail(v) {
            const s = (v || '').trim();
            if (s === '') return true; // e-mail opcional no B2B
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
        }
        function isValidEmailRequired(v) {
            const s = (v || '').trim();
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
        }
        function validateStep4() {
            const segOK = !!$$('input[name="segmento_atual"]:checked', form).length;
            const marcasOK = (marcasGroup && !marcasGroup.hidden) ? (marcasInput.value.trim().length >= 2) : true;
            if (btnNext4) btnNext4.disabled = !(segOK && marcasOK);
        }
        function validateStep5() {
            const linhasOK = $('#linhas')?.value.trim().length >= 2;
            const volOK = (volumeGroup && !volumeGroup.hidden) ? !!$$('input[name="volume_inicial"]:checked', form).length : true;
            if (btnNext5) btnNext5.disabled = !(linhasOK && volOK);
        }
        function validateStep3() {
            if (!telInput) return;
            const emailEl = $('#email');
            const emailErr = $('#emailError');
            const telOK = isValidPhone(telInput.value);
            const emailOK = isValidEmail(emailEl?.value);

            const telDigits = digits(telInput.value).length;
            setInvalid(telInput, telError, (telDigits >= 10 && !telOK));
            if (emailEl) setInvalid(emailEl, emailErr, (emailEl.value.trim() !== '' && !emailOK));

            if (btnNext3) btnNext3.disabled = !(telOK && emailOK);
        }
        function updateSubmitEnabled() {
            const emailOK = isValidEmail($('#email')?.value || '');
            const ok =
                checkedVal('tipo_parceria') &&
                isValidCNPJ(cnpjInput?.value || '') &&
                isValidPhone(telInput?.value || '') &&
                emailOK &&
                ($('#linhas')?.value.trim().length >= 2) &&
                ((volumeGroup && volumeGroup.hidden) || !!$$('input[name="volume_inicial"]:checked', form).length) &&
                !!$$('input[name="segmento_atual"]:checked', form).length &&
                ((marcasGroup && marcasGroup.hidden) || $('#marcas')?.value.trim().length >= 2);

            if (btnEnviar) btnEnviar.disabled = !ok;
        }
        function validateCF() {
            if (cfTel) cfTel.value = maskPhone(cfTel.value);
            const nomeOK = (cfNome?.value.trim().length >= 2);
            const emailOK = isValidEmailRequired(cfEmail?.value);
            const telOK = isValidPhone(cfTel?.value);

            setInvalid(cfNome, cfNomeError, !nomeOK);
            setInvalid(cfEmail, cfEmailError, !emailOK);
            const telDigits = digits(cfTel?.value).length;
            setInvalid(cfTel, cfTelError, (telDigits >= 10 && !telOK));

            if (cfEnviar) cfEnviar.disabled = !(nomeOK && emailOK && telOK);
        }

        /* === SYNCs (mostra/esconde/zera) === */
        function syncTipoParceriaUI() {
            const tipo = checkedVal('tipo_parceria');

            if (btnNext1) {
                btnNext1.textContent = tipo === 'Consumidor Final' ? 'Continuar' : 'Próximo';
                btnNext1.disabled = !tipo;
            }

            // Volume só para Lojista
            if (tipo === 'Lojista') show(volumeGroup); else { clearInputs(volumeGroup); hide(volumeGroup); }

            if (tipo === 'Consumidor Final') {
                revealStep(cfStep);
                // esconde steps B2B por data-step (2..6)
                ['2', '3', '4', '5', '6'].forEach(n => hideStep(form.querySelector(`.step[data-step="${n}"]`)));
                validateCF();
            } else {
                hideStep(cfStep);
                // garante que os passos B2B possam ser usados
                ['2', '3', '4', '5', '6'].forEach(n => { const s = form.querySelector(`.step[data-step="${n}"]`); if (s) s.hidden = s.classList.contains('is-visible') ? false : true; });
            }

            validateStep5();
            updateSubmitEnabled();
            updateProgress();
        }
        function syncSegmentoUI() {
            const v = checkedVal('segmento_atual');
            const sim = v === 'Sim';
            if (sim) {
                show(marcasGroup);
                if (marcasInput) marcasInput.required = true;
            } else {
                if (marcasInput) marcasInput.required = false;
                clearInputs(marcasGroup);
                hide(marcasGroup);
            }
            validateStep4();
            updateSubmitEnabled();
        }

        /* === LISTENERS === */
        tipoRadios.forEach(r => r.addEventListener('change', syncTipoParceriaUI));
        segmentoRadios.forEach(r => r.addEventListener('change', syncSegmentoUI));

        form.addEventListener('change', (e) => {
            if (e.target.name === 'tipo_parceria') syncTipoParceriaUI();
            if (e.target.name === 'segmento_atual') syncSegmentoUI();
            if (e.target.name === 'volume_inicial') validateStep5();
        });

        // Enter navega + foco no próximo (exceto textarea)
        form.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;

            const tipo = checkedVal('tipo_parceria');

            if (tipo === 'Consumidor Final') {
                e.preventDefault();
                if (!cfStep.classList.contains('is-visible')) { btnNext1?.click(); return; }
                if (!cfEnviar?.disabled) form.requestSubmit();
                return;
            }

            // Fluxo B2B
            e.preventDefault();
            const visibleSteps = steps.filter(s => s.classList.contains('is-visible'));
            const curStep = visibleSteps[visibleSteps.length - 1];

            const btnByStep = {
                '1': btnNext1, '2': btnNext2, '3': btnNext3,
                '4': btnNext4, '5': btnNext5, '6': btnEnviar
            };
            const btn = btnByStep[curStep?.dataset.step] || btnEnviar;

            if (!btn || btn.disabled) return;
            if (btn === btnEnviar) form.requestSubmit();
            else goNext(curStep);
        });

        /* === NEXT BUTTONS === */
        btnNext1?.addEventListener('click', () => {
            const tipo = checkedVal('tipo_parceria');
            if (!tipo) return;
            if (tipo === 'Consumidor Final') { revealStep(cfStep); return; }
            const s1 = form.querySelector('.step[data-step="1"]');
            if (s1) goNext(s1);
        });

        cnpjInput?.addEventListener('input', () => {
            cnpjInput.value = maskCNPJ(cnpjInput.value);
            setInvalid(cnpjInput, cnpjError, false);
            const ok = isValidCNPJ(cnpjInput.value);
            if (digits(cnpjInput.value).length === 14) setInvalid(cnpjInput, cnpjError, !ok);
            if (btnNext2) btnNext2.disabled = !ok;
            updateSubmitEnabled();
        });
        btnNext2?.addEventListener('click', () => {
            if (!isValidCNPJ(cnpjInput?.value || '')) { setInvalid(cnpjInput, cnpjError, true); return; }
            const s2 = form.querySelector('.step[data-step="2"]');
            if (s2) goNext(s2);
        });

        telInput?.addEventListener('input', () => {
            telInput.value = maskPhone(telInput.value);
            validateStep3();
        });
        btnNext3?.addEventListener('click', () => {
            validateStep3();
            if (btnNext3.disabled) return;
            const s3 = form.querySelector('.step[data-step="3"]');
            if (s3) goNext(s3);
        });

        const emailInput = $('#email');
        emailInput?.setAttribute('aria-describedby', 'emailError');
        emailInput?.addEventListener('input', validateStep3);
        emailInput?.addEventListener('blur', validateStep3);

        cfNome?.addEventListener('input', validateCF);
        cfEmail?.addEventListener('input', validateCF);
        cfEmail?.addEventListener('blur', validateCF);
        cfTel?.addEventListener('input', validateCF);

        form.addEventListener('input', (e) => {
            if (e.target.id === 'marcas' || e.target.name === 'segmento_atual') validateStep4();
            if (e.target.id === 'linhas' || e.target.name === 'volume_inicial') validateStep5();
            updateSubmitEnabled();
        });

        btnNext4?.addEventListener('click', () => {
            validateStep4();
            if (!btnNext4.disabled) {
                const s4 = form.querySelector('.step[data-step="4"]');
                if (s4) goNext(s4);
            }
        });
        btnNext5?.addEventListener('click', () => {
            validateStep5();
            if (!btnNext5.disabled) {
                const s5 = form.querySelector('.step[data-step="5"]');
                if (s5) goNext(s5);
                updateSubmitEnabled();
            }
        });

        /* === SUBMIT === */
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const endpoint = 'https://webhook.jaupesca.com.br/webhook/captura-de-lead-b2b-form-webhook';
            const tipo = checkedVal('tipo_parceria');

            // === BRANCH: Consumidor final (B2C) ===
            if (tipo === 'Consumidor Final') {
                validateCF();
                if (cfEnviar?.disabled) return;

                const emailRaw = cfEmail.value.trim();
                const payload = {
                    lead_tipo: 'b2c',
                    consumidor_final: true,
                    form_version: 'cf-v1',
                    nome: cfNome.value.trim(),
                    email: emailRaw.toLowerCase(),
                    telefone: digits(cfTel.value),
                    optin_promocoes: !!(document.getElementById('cf_optin')?.checked),
                    tipo_parceria: 'Consumidor Final',
                };

                await sendToWebhook(endpoint, payload, cfEnviar);
                return;
            }

            // === BRANCH: Parcerias (B2B) ===
            validateStep3();
            const emailOK = isValidEmail($('#email')?.value || '');
            if (!isValidCNPJ($('#cnpj')?.value || '') || !isValidPhone($('#telefone')?.value || '') || !emailOK) return;

            const emailRaw = val('email');
            const data = {
                lead_tipo: 'b2b',
                consumidor_final: false,
                form_version: 'b2b-v1',

                /* Step 1 */
                tipo_parceria: checkedVal('tipo_parceria'),

                /* Step 2 */
                empresa: val('empresa') || null,
                razao_social: val('razao') || null,
                cidade_uf: val('cidade') || null,
                cnpj: digits(val('cnpj')),

                /* Step 3 */
                responsavel_nome: val('resp_nome') || null,
                responsavel_cargo: val('resp_cargo') || null,
                email_comercial: emailRaw ? emailRaw.toLowerCase() : null,
                telefone: digits(val('telefone')),

                /* Step 4 */
                segmento_atual: checkedVal('segmento_atual'),
                marcas: val('marcas') || null,
                atuacao: checkedVals('atuacao[]', form),
                tempo_mercado: checkedVal('tempo_mercado', form),
                equipe_comercial: checkedVal('equipe_comercial', form),
                onde_vende: checkedVals('onde_vende[]', form),
                publico_principal: val('publico') || null,
                media_pedidos: checkedVal('media_pedidos', form),

                /* Step 5 */
                como_conheceu: checkedVal('como_conheceu', form),
                linhas_interesse: val('linhas'),
                volume_inicial: (volumeGroup && !volumeGroup.hidden)
                    ? (checkedVal('volume_inicial', form) || null)
                    : null,

                /* Step 6 */
                autorizo_contato: $('#autorizo') ? $('#autorizo').checked : true,
                observacoes: val('obs') || null,
            };

            await sendToWebhook(endpoint, data, btnEnviar);
        });

        async function sendToWebhook(endpoint, payload, submitBtnEl) {
            const msg = $('#msg');
            const submitBtn = submitBtnEl || btnEnviar;

            console.clear();
            console.log('Dados enviados:', payload);

            if (msg) msg.hidden = true;
            let prevLabel = '';
            if (submitBtn) {
                submitBtn.disabled = true;
                prevLabel = submitBtn.textContent;
                submitBtn.textContent = 'Enviando...';
            }

            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 12000);

            try {
                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    signal: ctrl.signal
                });
                clearTimeout(t);

                if (!resp.ok) {
                    const text = await resp.text().catch(() => '');
                    throw new Error(`HTTP ${resp.status} ${resp.statusText} ${text ? '- ' + text : ''}`);
                }

                await resp.json().catch(() => ({}));
                window.location.replace('/form/formulario-enviado');
            } catch (err) {
                console.error('Falha no envio:', err);
                if (msg) {
                    msg.textContent = 'Falha ao enviar. Verifique sua conexão ou permissões de CORS e tente novamente.';
                    msg.hidden = false;
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = prevLabel || 'Enviar';
                }
            }
        }

        /* === ESTADO INICIAL === */
        hide(marcasGroup); if (marcasInput) marcasInput.required = false;
        hide(volumeGroup); clearInputs(volumeGroup);

        // sincroniza e foca o primeiro campo do primeiro step
        syncTipoParceriaUI();
        syncSegmentoUI();
        const first = (steps[0] && (steps[0].querySelector('input,select,textarea,button')));
        first?.focus();

        updateSubmitEnabled();
        updateProgress();
        hide(cfStep); // só aparece quando usuário marca "Consumidor Final"
    });
})();