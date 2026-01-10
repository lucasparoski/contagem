let data = JSON.parse(localStorage.getItem("counts")) || [];
let currentCountId = null;

function save() {
  localStorage.setItem("counts", JSON.stringify(data));
}

function getAllProductNames() {
  const set = new Set();
  data.forEach(c =>
    c.sessions.forEach(s =>
      s.products.forEach(p => set.add(p.name))
    )
  );
  return [...set];
}

/* ================= HOME ================= */

function renderHome() {
  const list = document.getElementById("countList");
  list.innerHTML = "";

  data.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.onclick = () => openCount(c.id);
    list.appendChild(li);
  });
}

function createCount() {
  const input = document.getElementById("newCountName");
  const name = input.value.trim();
  if (!name) return;

  data.push({
    id: Date.now(),
    name,
    sessions: []
  });

  input.value = "";
  save();
  renderHome();
}

function openCount(id) {
  currentCountId = id;

  document.getElementById("home").classList.add("hidden");
  document.getElementById("countView").classList.remove("hidden");

  const count = data.find(c => c.id === id);
  document.getElementById("countTitle").textContent = count.name;

  renderSessions();
  renderSummary();
}

function goHome() {
  currentCountId = null;

  document.getElementById("countView").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");

  renderHome();
}

/* ================= SESSÕES ================= */

function addSession() {
  const input = document.getElementById("newSessionName");
  const name = input.value.trim();
  if (!name) return;

  const count = data.find(c => c.id === currentCountId);
  count.sessions.push({
    id: Date.now(),
    name,
    products: []
  });

  input.value = "";
  save();
  renderSessions();
}

function renderSessions() {
  const container = document.getElementById("sessions");
  container.innerHTML = "";

  const count = data.find(c => c.id === currentCountId);

  count.sessions.forEach(session => {
    const div = document.createElement("div");
    div.className = "session";

    div.innerHTML = `
      <h3>${session.name}</h3>

      <input
        id="pname-${session.id}"
        placeholder="Produto"
        oninput="showSuggestions(${session.id})"
        autocomplete="off"
      >
      <div id="auto-${session.id}" class="autocomplete"></div>

      <input
        type="number"
        id="pqty-${session.id}"
        placeholder="Qtd"
      >

      <button onclick="addProduct(${session.id})">Adicionar</button>

      <ul>
        ${session.products.map((p, i) => `
          <li class="product-line">
            ${p.name} — ${p.qty}
            <button class="small" onclick="removeProduct(${session.id}, ${i})">✕</button>
          </li>
        `).join("")}
      </ul>

      <button class="danger" onclick="deleteSession(${session.id})">
        Excluir sessão
      </button>
    `;

    container.appendChild(div);
  });
}

/* ================= PRODUTOS ================= */

function addProduct(sessionId) {
  const nameInput = document.getElementById(`pname-${sessionId}`);
  const qtyInput = document.getElementById(`pqty-${sessionId}`);

  const name = nameInput.value.trim();
  const qty = Number(qtyInput.value);

  if (!name || qty <= 0) return;

  const count = data.find(c => c.id === currentCountId);
  const session = count.sessions.find(s => s.id === sessionId);

  const existing = session.products.find(
    p => p.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    existing.qty += qty;
  } else {
    session.products.push({ name, qty });
  }

  nameInput.value = "";
  qtyInput.value = "";
  document.getElementById(`auto-${sessionId}`).innerHTML = "";

  save();
  renderSessions();
  renderSummary();
}

function removeProduct(sessionId, index) {
  if (!confirm("Excluir este produto?")) return;

  const count = data.find(c => c.id === currentCountId);
  const session = count.sessions.find(s => s.id === sessionId);

  session.products.splice(index, 1);

  save();
  renderSessions();
  renderSummary();
}

/* ================= AUTOCOMPLETE ================= */

function showSuggestions(sessionId) {
  const input = document.getElementById(`pname-${sessionId}`);
  const box = document.getElementById(`auto-${sessionId}`);
  const text = input.value.toLowerCase();

  box.innerHTML = "";
  if (!text) return;

  getAllProductNames()
    .filter(p => p.toLowerCase().includes(text))
    .forEach(p => {
      const div = document.createElement("div");
      div.textContent = p;
      div.onclick = () => {
        input.value = p;
        box.innerHTML = "";
      };
      box.appendChild(div);
    });
}

/* ================= RESUMO ================= */

function renderSummary() {
  const summary = {};
  const count = data.find(c => c.id === currentCountId);

  count.sessions.forEach(session =>
    session.products.forEach(p => {
      summary[p.name] = (summary[p.name] || 0) + p.qty;
    })
  );

  const ul = document.getElementById("summary");
  ul.innerHTML = "";

  Object.entries(summary).forEach(([name, qty]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ${qty}`;
    ul.appendChild(li);
  });
}

/* ================= EXCLUSÕES ================= */

function deleteSession(sessionId) {
  if (!confirm("Excluir esta sessão inteira?")) return;

  const count = data.find(c => c.id === currentCountId);
  count.sessions = count.sessions.filter(s => s.id !== sessionId);

  save();
  renderSessions();
  renderSummary();
}

function deleteCurrentCount() {
  if (!confirm("Excluir esta contagem inteira? Essa ação não pode ser desfeita.")) return;

  data = data.filter(c => c.id !== currentCountId);
  save();
  goHome();
}

/* ================= INIT ================= */

renderHome();
