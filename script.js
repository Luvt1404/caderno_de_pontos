/* =====================================================
   PONTOFÁCIL
   Sistema de Controle de Frequência
   ===================================================== */

/* ================= BANCO LOCAL ================= */

let professores = JSON.parse(localStorage.getItem("professores")) || [];
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
let adminUsers = JSON.parse(localStorage.getItem("adminUsers")) || [
    { role: "diretor", nome: "Diretor", senha: "diretor123" },
    { role: "vice", nome: "Vice-diretora", senha: "vice123" }
];

const USER_STORAGE_KEY = "pontoFacilCurrentUser";
let currentUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;

/* ================= INICIALIZAÇÃO ================= */

document.addEventListener("DOMContentLoaded", () => {
    const isLoginPage = window.location.pathname.endsWith("login.html");

    if (isLoginPage) {
        const loginForm = document.getElementById("login-form");
        const loginRole = document.getElementById("login-role");
        const openRegisterProfessor = document.getElementById("open-register-professor");
        const openRegisterAdmin = document.getElementById("open-register-admin");
        const professorForm = document.getElementById("professor-form");
        const adminForm = document.getElementById("admin-form");

        if (currentUser) {
            window.location.href = "index.html";
            return;
        }

        if (loginForm) loginForm.addEventListener("submit", fazerLogin);
        if (loginRole) loginRole.addEventListener("change", alternarTipoLogin);
        if (openRegisterProfessor) openRegisterProfessor.addEventListener("click", () => {
            document.getElementById("modal-professor").classList.add("active");
        });
        if (openRegisterAdmin) openRegisterAdmin.addEventListener("click", () => {
            document.getElementById("modal-admin").classList.add("active");
        });
        if (professorForm) professorForm.addEventListener("submit", cadastrarProfessor);
        if (adminForm) adminForm.addEventListener("submit", cadastrarAdmin);

        document.querySelectorAll(".modal-overlay").forEach(modal => {
            modal.addEventListener("click", event => {
                if (event.target === modal) {
                    fecharModais();
                }
            });
        });

        alternarTipoLogin();
        return;
    }

    const app = document.querySelector(".app");
    if (!app) return;

    configurarData();
    configurarNavegacao();

    const professorForm = document.getElementById("professor-form");
    const registroForm = document.getElementById("registro-form");
    const solicitacaoForm = document.getElementById("solicitacao-form");
    const logoutBtn = document.getElementById("logout-btn");

    if (professorForm) professorForm.addEventListener("submit", cadastrarProfessor);
    if (registroForm) registroForm.addEventListener("submit", cadastrarRegistro);
    if (solicitacaoForm) solicitacaoForm.addEventListener("submit", cadastrarSolicitacao);
    if (logoutBtn) logoutBtn.addEventListener("click", fazerLogout);

    const reportMonth = document.getElementById("report-month");
    if (reportMonth) reportMonth.value = obterMesAtual();

    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    alternarTipoLogin();
    atualizarTudo();
    configurarAcesso();
});

/* ================= DATA ================= */

function configurarData() {
    const hoje = new Date();

    const data = hoje.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    document.getElementById("current-date").textContent = data;
    document.getElementById("dashboard-date").textContent =
        hoje.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
}

function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function obterMesAtual() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

/* ================= ACESSO ================= */

function alternarTipoLogin() {
    const tipo = document.getElementById("login-role").value;
    const grupo = document.getElementById("login-professor-group");
    const select = document.getElementById("login-professor");

    if (grupo) grupo.classList.add("hidden");
    if (select) select.value = "";

    if (tipo === "vice") {
        return;
    }
}

function preencherSelectLoginProfessor() {
    const select = document.getElementById("login-professor");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o professor</option>';

    professores
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .forEach(professor => {
            const option = document.createElement("option");
            option.value = String(professor.id);
            option.textContent = professor.nome;
            select.appendChild(option);
        });
}

function fazerLogin(event) {
    event.preventDefault();

    const tipo = document.getElementById("login-role").value;
    const senha = document.getElementById("login-password").value.trim();

    if (!senha) {
        alert("Digite a senha.");
        return;
    }

    if (tipo === "diretor" || tipo === "vice") {
        const admin = adminUsers.find(item => item.role === tipo && item.senha === senha);

        if (!admin) {
            alert("Senha incorreta para esse acesso administrativo.");
            return;
        }

        currentUser = { role: tipo, nome: admin.nome };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        document.getElementById("login-form").reset();

        if (window.location.pathname.endsWith("login.html")) {
            window.location.href = "index.html";
            return;
        }

        configurarAcesso();
        return;
    }

    const professor = professores.find(item => item.senha === senha);

    if (!professor) {
        alert("Senha incorreta ou professor não cadastrado.");
        return;
    }

    currentUser = {
        role: "professor",
        id: professor.id,
        nome: professor.nome
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    document.getElementById("login-form").reset();

    if (window.location.pathname.endsWith("login.html")) {
        window.location.href = "index.html";
        return;
    }

    configurarAcesso();
}

function fazerLogout() {
    currentUser = null;
    localStorage.removeItem(USER_STORAGE_KEY);

    if (document.getElementById("login-password")) {
        document.getElementById("login-password").value = "";
    }

    if (window.location.pathname.endsWith("index.html")) {
        window.location.href = "login.html";
        return;
    }

    configurarAcesso();
}

function configurarAcesso() {
    const authScreen = document.getElementById("auth-screen");
    const app = document.querySelector(".app");
    const btnRegistrar = document.getElementById("btn-registrar");
    const logoutBtn = document.getElementById("logout-btn");

    if (!currentUser) {
        if (window.location.pathname.endsWith("index.html")) {
            window.location.href = "login.html";
            return;
        }

        if (authScreen) authScreen.classList.add("active");
        if (app) app.style.display = "none";
        if (btnRegistrar) btnRegistrar.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        return;
    }

    if (authScreen) authScreen.classList.remove("active");
    if (app) app.style.display = "flex";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    const isAdmin = ["diretor", "vice"].includes(currentUser.role);
    if (btnRegistrar) btnRegistrar.style.display = isAdmin ? "inline-flex" : "none";

    document.querySelectorAll(".nav-btn").forEach(button => {
        const pagina = button.dataset.page;
        const deveMostrar = isAdmin ? pagina !== "minhas-faltas" : pagina === "minhas-faltas";
        button.style.display = deveMostrar ? "flex" : "none";
    });

    const paginaInicial = isAdmin ? "dashboard" : "minhas-faltas";
    mostrarPagina(paginaInicial);
}

/* ================= NAVEGAÇÃO ================= */

function configurarNavegacao() {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.addEventListener("click", () => {
            const pagina = button.dataset.page;

            if (currentUser && currentUser.role === "professor" && pagina !== "minhas-faltas") {
                mostrarPagina("minhas-faltas");
                return;
            }

            mostrarPagina(pagina);
        });
    });
}

function mostrarPagina(pagina) {
    if (currentUser && currentUser.role === "professor" && pagina !== "minhas-faltas") {
        pagina = "minhas-faltas";
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const pageAtual = document.getElementById(pagina);
    if (pageAtual) {
        pageAtual.classList.add("active");
    }

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
        if (button.dataset.page === pagina) {
            button.classList.add("active");
        }
    });

    const titulos = {
        dashboard: "Dashboard",
        professores: "Professores",
        frequencia: "Frequência",
        relatorios: "Relatórios",
        "minhas-faltas": "Minhas faltas"
    };

    const tituloElemento = document.getElementById("page-title");
    if (tituloElemento) {
        tituloElemento.textContent = titulos[pagina] || "Dashboard";
    }

    if (pagina === "frequencia") renderFrequencia();
    if (pagina === "relatorios") renderRelatorio();
    if (pagina === "professores") {
        renderProfessores();
        renderSolicitacoesVice();
    }
    if (pagina === "minhas-faltas") renderMinhasFaltas();
}

/* ================= MODAIS ================= */

function abrirModalProfessor() {
    if (currentUser && currentUser.role === "professor") {
        alert("Professores só podem solicitar faltas.");
        return;
    }

    document.getElementById("modal-professor").classList.add("active");
}

function abrirModalRegistro() {
    if (currentUser && currentUser.role === "professor") {
        alert("Professores só podem solicitar faltas.");
        return;
    }

    atualizarSelectProfessores();
    document.getElementById("registro-data").value = obterDataHoje();
    document.getElementById("modal-registro").classList.add("active");
}

function fecharModais() {
    document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.classList.remove("active");
    });
}

document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            fecharModais();
        }
    });
});

/* ================= PROFESSORES ================= */

function cadastrarProfessor(event) {
    event.preventDefault();

    const nome = document.getElementById("professor-nome").value.trim();
    const salario = Number(document.getElementById("professor-salario").value);
    const carga = Number(document.getElementById("professor-carga").value);
    const senha = document.getElementById("professor-senha").value.trim();

    if (!nome || salario <= 0 || carga <= 0 || !senha) {
        alert("Preencha corretamente todos os campos, incluindo a senha do professor.");
        return;
    }

    const senhaDuplicada = professores.some(item => item.senha === senha) || adminUsers.some(item => item.senha === senha);
    if (senhaDuplicada) {
        alert("Essa senha já existe para outro usuário. Cadastre senhas diferentes para cada professor e acesso administrativo.");
        return;
    }

    const professor = {
        id: Date.now(),
        nome,
        salario,
        cargaHoraria: carga,
        senha
    };

    professores.push(professor);
    salvarDados();
    atualizarTudo();

    document.getElementById("professor-form").reset();
    fecharModais();
    alert("Professor cadastrado com sucesso.");
}

function cadastrarAdmin(event) {
    event.preventDefault();

    const role = document.getElementById("admin-role").value;
    const nome = document.getElementById("admin-nome").value.trim();
    const senha = document.getElementById("admin-senha").value.trim();

    if (!role || !senha) {
        alert("Preencha o cargo e a senha do acesso administrativo.");
        return;
    }

    const senhaDuplicada = professores.some(item => item.senha === senha) || adminUsers.some(item => item.role !== role && item.senha === senha);
    if (senhaDuplicada) {
        alert("Essa senha já está em uso. Escolha uma senha diferente.");
        return;
    }

    const index = adminUsers.findIndex(item => item.role === role);
    const novoAdmin = {
        role,
        nome: nome || (role === "diretor" ? "Diretor" : "Vice-diretora"),
        senha
    };

    if (index >= 0) {
        adminUsers[index] = novoAdmin;
    } else {
        adminUsers.push(novoAdmin);
    }

    localStorage.setItem("adminUsers", JSON.stringify(adminUsers));
    document.getElementById("admin-form").reset();
    fecharModais();
    alert("Acesso administrativo salvo com sucesso.");
}

function excluirProfessor(id) {
    if (currentUser && currentUser.role === "professor") {
        alert("Você não tem permissão para excluir professores.");
        return;
    }

    const professor = professores.find(p => p.id === id);
    if (!professor) return;

    const confirmar = confirm(
        `Deseja realmente excluir ${professor.nome}?\n\nOs registros desse professor também serão removidos.`
    );

    if (!confirmar) return;

    professores = professores.filter(p => p.id !== id);
    registros = registros.filter(r => r.professorId !== id);
    solicitacoes = solicitacoes.filter(s => s.professorId !== id);

    salvarDados();
    atualizarTudo();
}

/* ================= SOLICITAÇÃO DE FALTA ================= */

function cadastrarSolicitacao(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "professor") {
        alert("Acesso restrito ao professor.");
        return;
    }

    const data = document.getElementById("solicitacao-data").value;
    const motivo = document.getElementById("solicitacao-motivo").value;
    const observacao = document.getElementById("solicitacao-observacao").value.trim();

    if (!data || !motivo) {
        alert("Informe a data e o motivo da ausência.");
        return;
    }

    const solicitacao = {
        id: Date.now(),
        professorId: currentUser.id,
        data,
        motivo,
        observacao,
        status: "pendente",
        resposta: "",
        diasFaltados: ""
    };

    solicitacoes.push(solicitacao);
    salvarDados();
    atualizarTudo();
    document.getElementById("solicitacao-form").reset();
    alert("Solicitação enviada com sucesso.");
}

function responderSolicitacao(id, decisao) {
    if (currentUser && !["vice", "diretor"].includes(currentUser.role)) {
        alert("A vice-diretora ou o diretor é quem responde as solicitações.");
        return;
    }

    const solicitacao = solicitacoes.find(item => item.id === id);
    if (!solicitacao) return;

    if (decisao === "rejeitada") {
        solicitacao.status = "rejeitada";
        solicitacao.resposta = "Solicitação recusada pela vice-diretora.";
        solicitacao.diasFaltados = "";
        salvarDados();
        atualizarTudo();
        return;
    }

    const professor = professores.find(item => item.id === solicitacao.professorId);
    const datasDigitadas = prompt(
        `Digite os dias em que ${professor ? professor.nome : "o professor"} faltará (separados por vírgula, ex.: 2026-09-25,2026-09-26):`,
        solicitacao.data
    );

    if (datasDigitadas === null) return;

    const datas = datasDigitadas
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

    if (datas.length === 0) {
        alert("Informe pelo menos uma data de falta.");
        return;
    }

    solicitacao.status = "aprovada";
    solicitacao.diasFaltados = datas.join(", ");
    solicitacao.resposta = `Falta aprovada para ${datas.join(", ")}.`;

    datas.forEach(dataFalta => {
        const jaExiste = registros.some(registro =>
            registro.professorId === solicitacao.professorId &&
            registro.data === dataFalta &&
            registro.status === "Falta justificada"
        );

        if (!jaExiste) {
            registros.push({
                id: Date.now() + Math.random(),
                professorId: solicitacao.professorId,
                data: dataFalta,
                status: "Falta justificada",
                horas: 0,
                minutos: 0,
                observacao: `Solicitação aprovada: ${solicitacao.motivo}`
            });
        }
    });

    salvarDados();
    atualizarTudo();
    alert("Falta aprovada e registrada para o professor.");
}

function renderSolicitacoesVice() {
    const container = document.getElementById("administracao-faltas");
    if (!container) return;

    if (currentUser && currentUser.role !== "vice") {
        container.innerHTML = "";
        return;
    }

    const lista = solicitacoes.slice().sort((a, b) => b.id - a.id);

    if (lista.length === 0) {
        container.innerHTML = '<div class="empty">Nenhuma solicitação pendente.</div>';
        return;
    }

    container.innerHTML = lista.map(item => {
        const professor = professores.find(p => p.id === item.professorId);
        const statusBadge = criarBadgeSolicitacao(item.status);

        return `
            <div class="request-card">
                <div>
                    <strong>${escapeHTML(professor ? professor.nome : "Professor removido")}</strong>
                    <p>Data: ${formatarData(item.data)}</p>
                    <p>Motivo: ${escapeHTML(item.motivo)}</p>
                    <small>${escapeHTML(item.observacao || "Sem observação")}</small>
                    ${statusBadge}
                </div>

                <div class="request-actions">
                    <button class="primary-btn" onclick="responderSolicitacao(${item.id}, 'aprovada')">Aprovar</button>
                    <button class="secondary-btn" onclick="responderSolicitacao(${item.id}, 'rejeitada')">Recusar</button>
                </div>
            </div>
        `;
    }).join("");
}

function renderMinhasFaltas() {
    const container = document.getElementById("professor-request-list");
    if (!container) return;

    if (!currentUser || currentUser.role !== "professor") {
        container.innerHTML = "";
        return;
    }

    const lista = solicitacoes
        .filter(item => item.professorId === currentUser.id)
        .sort((a, b) => b.id - a.id);

    if (lista.length === 0) {
        container.innerHTML = '<div class="empty">Você ainda não enviou solicitações de falta.</div>';
        return;
    }

    container.innerHTML = lista.map(item => `
        <div class="request-card">
            <div>
                <strong>${formatarData(item.data)}</strong>
                <p>Motivo: ${escapeHTML(item.motivo)}</p>
                <small>${escapeHTML(item.observacao || "Sem observação")}</small>
                <div style="margin-top: 8px;">${criarBadgeSolicitacao(item.status)}</div>
                ${item.resposta ? `<small>${escapeHTML(item.resposta)}</small>` : ""}
            </div>
        </div>
    `).join("");
}

/* ================= REGISTRO ================= */

function cadastrarRegistro(event) {
    event.preventDefault();

    if (currentUser && currentUser.role === "professor") {
        alert("Professores só podem solicitar faltas.");
        return;
    }

    const professorId = Number(document.getElementById("registro-professor").value);
    const data = document.getElementById("registro-data").value;
    const status = document.getElementById("registro-status").value;
    const horas = Number(document.getElementById("registro-horas").value) || 0;
    const minutos = Number(document.getElementById("registro-minutos").value) || 0;
    const observacao = document.getElementById("registro-observacao").value.trim();

    if (!professorId || !data || !status) {
        alert("Preencha os campos obrigatórios.");
        return;
    }

    const registro = {
        id: Date.now(),
        professorId,
        data,
        status,
        horas,
        minutos,
        observacao
    };

    registros.push(registro);
    salvarDados();
    atualizarTudo();

    document.getElementById("registro-form").reset();
    fecharModais();
    alert("Registro salvo com sucesso.");
}

/* ================= SELECT PROFESSORES ================= */

function atualizarSelectProfessores() {
    const select = document.getElementById("registro-professor");
    const filtro = document.getElementById("filter-professor");

    if (select) select.innerHTML = '<option value="">Selecione o professor</option>';
    if (filtro) filtro.innerHTML = '<option value="">Todos</option>';

    professores
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .forEach(professor => {
            if (select) {
                select.innerHTML += `
                    <option value="${professor.id}">
                        ${escapeHTML(professor.nome)}
                    </option>
                `;
            }

            if (filtro) {
                filtro.innerHTML += `
                    <option value="${professor.id}">
                        ${escapeHTML(professor.nome)}
                    </option>
                `;
            }
        });
}

/* ================= PROFESSORES ================= */

function renderProfessores() {
    const container = document.getElementById("professors-list");
    if (!container) return;

    const busca = document.getElementById("search-professor").value.toLowerCase();
    const lista = professores.filter(professor => professor.nome.toLowerCase().includes(busca));

    if (lista.length === 0) {
        container.innerHTML = '<div class="empty">Nenhum professor encontrado.</div>';
        return;
    }

    container.innerHTML = lista.map(professor => `
        <div class="professor-card">
            <div class="professor-info">
                <strong>${escapeHTML(professor.nome)}</strong>
                <p>Carga horária: ${professor.cargaHoraria}h semanais</p>
                <div class="professor-money">Salário: ${formatarMoeda(professor.salario)}</div>
            </div>
            <button class="delete-btn" onclick="excluirProfessor(${professor.id})">Excluir</button>
        </div>
    `).join("");
}

/* ================= FREQUÊNCIA ================= */

function renderFrequencia() {
    const container = document.getElementById("frequency-table");
    if (!container) return;

    const filtroProfessor = Number(document.getElementById("filter-professor").value) || null;
    const inicio = document.getElementById("filter-start").value;
    const fim = document.getElementById("filter-end").value;

    let lista = [...registros];

    if (filtroProfessor) lista = lista.filter(registro => registro.professorId === filtroProfessor);
    if (inicio) lista = lista.filter(registro => registro.data >= inicio);
    if (fim) lista = lista.filter(registro => registro.data <= fim);

    lista.sort((a, b) => b.data.localeCompare(a.data));

    if (lista.length === 0) {
        container.innerHTML = '<div class="empty">Nenhum registro encontrado.</div>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Professor</th>
                    <th>Data</th>
                    <th>Situação</th>
                    <th>Horas</th>
                    <th>Observação</th>
                </tr>
            </thead>
            <tbody>
                ${lista.map(registro => {
                    const professor = professores.find(p => p.id === registro.professorId);
                    return `
                        <tr>
                            <td>
                                <div class="teacher-name">${escapeHTML(professor ? professor.nome : "Professor removido")}</div>
                            </td>
                            <td>${formatarData(registro.data)}</td>
                            <td>${criarBadge(registro.status)}</td>
                            <td>${registro.horas}h ${registro.minutos}min</td>
                            <td>${escapeHTML(registro.observacao || "-")}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

/* ================= DASHBOARD ================= */

function atualizarDashboard() {
    const totalProfessores = document.getElementById("total-professores");
    if (totalProfessores) totalProfessores.textContent = professores.length;

    const hoje = obterDataHoje();
    const registrosHoje = registros.filter(registro => registro.data === hoje);

    const presentesHoje = document.getElementById("presentes-hoje");
    if (presentesHoje) presentesHoje.textContent = registrosHoje.filter(r => r.status === "Presente").length;

    const faltasHoje = document.getElementById("faltas-hoje");
    if (faltasHoje) faltasHoje.textContent = registrosHoje.filter(r => r.status === "Falta").length;

    const atrasosHoje = document.getElementById("atrasos-hoje");
    if (atrasosHoje) atrasosHoje.textContent = registrosHoje.filter(r => r.status === "Atraso").length;

    renderRegistrosRecentes();
}

function renderRegistrosRecentes() {
    const container = document.getElementById("recent-records");
    if (!container) return;

    const hoje = obterDataHoje();
    const lista = registros.filter(r => r.data === hoje).slice().reverse().slice(0, 6);

    if (lista.length === 0) {
        container.innerHTML = '<div class="empty">Nenhum registro realizado hoje.</div>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Professor</th>
                    <th>Situação</th>
                    <th>Horas</th>
                </tr>
            </thead>
            <tbody>
                ${lista.map(registro => {
                    const professor = professores.find(p => p.id === registro.professorId);
                    return `
                        <tr>
                            <td><div class="teacher-name">${escapeHTML(professor ? professor.nome : "Professor removido")}</div></td>
                            <td>${criarBadge(registro.status)}</td>
                            <td>${registro.horas}h ${registro.minutos}min</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

/* ================= RELATÓRIO ================= */

function renderRelatorio() {
    const container = document.getElementById("report-content");
    if (!container) return;

    const mes = document.getElementById("report-month").value || obterMesAtual();

    const lista = professores.map(professor => {
        const registrosProfessor = registros.filter(registro =>
            registro.professorId === professor.id && registro.data.startsWith(mes)
        );

        const faltas = registrosProfessor.filter(r => r.status === "Falta").length;
        const atrasos = registrosProfessor.filter(r => r.status === "Atraso").length;
        const justificadas = registrosProfessor.filter(r => r.status === "Falta justificada").length;
        const horas = registrosProfessor.reduce((total, registro) => total + registro.horas + registro.minutos / 60, 0);
        const desconto = calcularDesconto(professor, horas);

        return { professor, faltas, atrasos, justificadas, horas, desconto };
    });

    if (lista.length === 0) {
        container.innerHTML = '<div class="panel"><div class="empty">Nenhum professor cadastrado.</div></div>';
        return;
    }

    const totalFaltas = lista.reduce((soma, item) => soma + item.faltas, 0);
    const totalAtrasos = lista.reduce((soma, item) => soma + item.atrasos, 0);
    const totalHoras = lista.reduce((soma, item) => soma + item.horas, 0);
    const totalDesconto = lista.reduce((soma, item) => soma + item.desconto, 0);

    container.innerHTML = `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <span class="section-label">FECHAMENTO</span>
                    <h3>Relatório de ${formatarMes(mes)}</h3>
                </div>
            </div>

            <div class="report-summary">
                <div><span>Faltas</span><strong>${totalFaltas}</strong></div>
                <div><span>Atrasos</span><strong>${totalAtrasos}</strong></div>
                <div><span>Horas não trabalhadas</span><strong>${totalHoras.toFixed(1)}h</strong></div>
                <div><span>Desconto estimado</span><strong>${formatarMoeda(totalDesconto)}</strong></div>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Professor</th>
                            <th>Faltas</th>
                            <th>Atrasos</th>
                            <th>Justificadas</th>
                            <th>Horas</th>
                            <th>Desconto estimado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map(item => `
                            <tr>
                                <td><div class="teacher-name">${escapeHTML(item.professor.nome)}</div></td>
                                <td>${item.faltas}</td>
                                <td>${item.atrasos}</td>
                                <td>${item.justificadas}</td>
                                <td>${item.horas.toFixed(1)}h</td>
                                <td>${formatarMoeda(item.desconto)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ================= CÁLCULO ================= */

function calcularDesconto(professor, horasNaoTrabalhadas) {
    const horasMensais = professor.cargaHoraria * 4.33;
    if (horasMensais <= 0) return 0;
    const valorHora = professor.salario / horasMensais;
    return valorHora * horasNaoTrabalhadas;
}

/* ================= BADGES ================= */

function criarBadge(status) {
    let classe = "badge-neutral";

    if (status === "Presente") classe = "badge-success";
    if (status === "Falta") classe = "badge-danger";
    if (status === "Atraso" || status === "Saída antecipada") classe = "badge-warning";
    if (status === "Falta justificada") classe = "badge-warning";

    return `<span class="badge ${classe}">${escapeHTML(status)}</span>`;
}

function criarBadgeSolicitacao(status) {
    let classe = "badge-neutral";
    let texto = "Pendente";

    if (status === "aprovada") {
        classe = "badge-success";
        texto = "Aprovada";
    }

    if (status === "rejeitada") {
        classe = "badge-danger";
        texto = "Recusada";
    }

    if (status === "pendente") {
        classe = "badge-warning";
        texto = "Pendente";
    }

    return `<span class="badge ${classe}" style="margin-top: 8px; display: inline-flex;">${escapeHTML(texto)}</span>`;
}

/* ================= FORMATAÇÃO ================= */

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function formatarData(data) {
    if (!data) return "-";
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMes(mes) {
    const [ano, numero] = mes.split("-");
    const data = new Date(Number(ano), Number(numero) - 1, 1);
    return data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
}

/* ================= SEGURANÇA ================= */

function escapeHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ================= SALVAMENTO ================= */

function salvarDados() {
    localStorage.setItem("professores", JSON.stringify(professores));
    localStorage.setItem("registros", JSON.stringify(registros));
    localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));
    localStorage.setItem("adminUsers", JSON.stringify(adminUsers));
}

/* ================= ATUALIZAÇÃO ================= */

function atualizarTudo() {
    atualizarSelectProfessores();
    preencherSelectLoginProfessor();
    atualizarDashboard();
    renderProfessores();
    renderFrequencia();
    renderRelatorio();
    renderMinhasFaltas();
    renderSolicitacoesVice();
}

