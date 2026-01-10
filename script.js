// ================= CONFIG =================
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzU4OK59zi3K9JShAHwOBOjJ-2DYITu8MZgO1SGmTwd65Ez9JP_OEVncSRlVNGOADL_/exec';

// ================= ESTADO =================
let contagens = JSON.parse(localStorage.getItem('contagens')) || [];
let contagemAtualId = localStorage.getItem('contagemAtualId') || null;

// ================= UTIL =================
function salvarLocal() {
  localStorage.setItem('contagens', JSON.stringify(contagens));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ================= SHEETS =================
async function salvarNoSheets({ contagem, sessao, produto, quantidade }) {
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        contagem_id: contagem.id,
        contagem_nome: contagem.nome,
        sessao_nome: sessao,
        produto_nome: produto,
        quantidade
      })
    });
  } catch (e) {
    console.warn('Erro ao salvar no Sheets', e);
  }
}

async function excluirNoSheets({ contagemId, sessao, produto }) {
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete',
        contagem_id: contagemId,
        sessao_nome: sessao || null,
        produto_nome: produto || null
      })
    });
  } catch (e) {
    console.warn('Erro ao excluir no Sheets', e);
  }
}

// ================= CONTAGENS =================
function criarContagem(nome) {
  const contagem = {
    id: uid(),
    nome,
    sessoes: []
  };
  contagens.push(contagem);
  contagemAtualId = contagem.id;
  localStorage.setItem('contagemAtualId', contagemAtualId);
  salvarLocal();
  render();
}

function excluirContagem(id) {
  if (!confirm('Excluir esta contagem inteira?')) return;

  contagens = contagens.filter(c => c.id !== id);
  excluirNoSheets({ contagemId: id });

  if (contagemAtualId === id) {
    contagemAtualId = null;
    localStorage.removeItem('contagemAtualId');
  }
  salvarLocal();
  render();
}

// ================= SESSÕES =================
function criarSessao(nome) {
  const contagem = getContagemAtual();
  if (!contagem) return;

  contagem.sessoes.push({
    nome,
    produtos: []
  });
  salvarLocal();
  render();
}

function excluirSessao(nome) {
  if (!confirm('Excluir esta sessão?')) return;

  const contagem = getContagemAtual();
  contagem.sessoes = contagem.sessoes.filter(s => s.nome !== nome);

  excluirNoSheets({
    contagemId: contagem.id,
    sessao: nome
  });

  salvarLocal();
  render();
}

// ================= PRODUTOS =================
function adicionarProduto(sessaoNome, produtoNome, quantidade) {
  const contagem = getContagemAtual();
  const sessao = contagem.sessoes.find(s => s.nome === sessaoNome);

  const nomePadrao = produtoNome.trim().toLowerCase();

  let produto = sessao.produtos.find(p => p.nome === nomePadrao);
  if (produto) {
    produto.quantidade += quantidade;
  } else {
    sessao.produtos.push({
      nome: nomePadrao,
      quantidade
    });
  }

  salvarNoSheets({
    contagem,
    sessao: sessaoNome,
    produto: produtoNome,
    quantidade
  });

  salvarLocal();
  render();
}

function excluirProduto(sessaoNome, produtoNome) {
  if (!confirm('Excluir este produto?')) return;

  const contagem = getContagemAtual();
  const sessao = contagem.sessoes.find(s => s.nome === sessaoNome);
  sessao.produtos = sessao.produtos.filter(p => p.nome !== produtoNome);

  excluirNoSheets({
    contagemId: contagem.id,
    sessao: sessaoNome,
    produto: produtoNome
  });

  salvarLocal();
  render();
}

// ================= BUSCA =================
function todosProdutosCadastrados() {
  const set = new Set();
  contagens.forEach(c =>
    c.sessoes.forEach(s =>
      s.produtos.forEach(p => set.add(p.nome))
    )
  );
  return Array.from(set);
}

// ================= GETTERS =================
function getContagemAtual() {
  return contagens.find(c => c.id === contagemAtualId);
}

// ================= RENDER =================
function render() {
  const lista = document.getElementById('listaContagens');
  const area = document.getElementById('areaContagem');

  lista.innerHTML = '';
  contagens.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.nome;
    btn.onclick = () => {
      contagemAtualId = c.id;
      localStorage.setItem('contagemAtualId', c.id);
      render();
    };
    lista.appendChild(btn);
  });

  area.innerHTML = '';
  const contagem = getContagemAtual();
  if (!contagem) return;

  contagem.sessoes.forEach(sessao => {
    const div = document.createElement('div');
    div.innerHTML = `<h3>${sessao.nome}</h3>`;

    sessao.produtos.forEach(p => {
      const item = document.createElement('div');
      item.textContent = `${p.nome} — ${p.quantidade}`;
      item.onclick = () => excluirProduto(sessao.nome, p.nome);
      div.appendChild(item);
    });

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir sessão';
    btnExcluir.onclick = () => excluirSessao(sessao.nome);
    div.appendChild(btnExcluir);

    area.appendChild(div);
  });

  renderResumo();
}

function renderResumo() {
  const resumo = document.getElementById('resumo');
  if (!resumo) return;

  const total = {};
  const contagem = getContagemAtual();
  if (!contagem) return;

  contagem.sessoes.forEach(s =>
    s.produtos.forEach(p => {
      total[p.nome] = (total[p.nome] || 0) + p.quantidade;
    })
  );

  resumo.innerHTML = '<h3>Resumo Geral</h3>';
  Object.entries(total).forEach(([nome, qtd]) => {
    const div = document.createElement('div');
    div.textContent = `${nome} — ${qtd}`;
    resumo.appendChild(div);
  });
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', render);

