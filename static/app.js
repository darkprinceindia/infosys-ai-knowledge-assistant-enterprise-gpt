const state = { user: null, page: 'ask', answer: null, documents: [] };
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function api(path, method = 'GET', body) {
  const options = { method, credentials: 'same-origin', headers: {} };
  if (body !== undefined) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function showLogin() {
  $('login').classList.remove('hidden'); $('app').classList.add('hidden');
}

function showApp(user) {
  state.user = user;
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  $('user-name').textContent = user.name;
  $('user-dept').textContent = `${user.department} · ${user.role}`;
  $('avatar').textContent = user.name[0];
  $('top-role').textContent = user.role === 'admin' ? 'ADMINISTRATOR' : `${user.department.toUpperCase()} ACCESS`;
  document.querySelectorAll('.admin-only').forEach(el => {
    if (user.role !== 'admin') el.classList.add('hidden');
    else if (el.id !== 'upload-panel') el.classList.remove('hidden');
  });
  $('upload-panel').classList.add('hidden');
  loadSuggestions();
  showPage('ask');
}

function showPage(page) {
  if (page === 'analytics' && state.user?.role !== 'admin') return;
  state.page = page;
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  if (page === 'knowledge') loadDocuments();
  if (page === 'connectors') loadConnectors();
  if (page === 'analytics') loadAnalytics();
}

function loadSuggestions() {
  const all = [
    'How do we escalate a P1 delivery incident?',
    'What is the annual leave request process?',
    'When should an API deployment be rolled back?',
    'What requires review before a client proposal?',
    'What is on the new project checklist?'
  ];
  const list = $('suggestion-list'); list.innerHTML = '';
  all.forEach(question => {
    const button = document.createElement('button'); button.textContent = question;
    button.addEventListener('click', () => { $('question').value = question; $('question').focus(); });
    list.appendChild(button);
  });
}

function renderAnswer(result) {
  state.answer = result;
  $('answer-card').classList.remove('hidden');
  $('answer-route').textContent = result.route;
  $('answer-text').textContent = result.answer;
  $('answer-confidence').textContent = result.no_answer ? 'Evidence: insufficient' : `Retrieval signal: ${Math.round(result.confidence * 100)}%`;
  $('answer-latency').textContent = `${result.latency_ms} ms`;
  $('feedback-saved').classList.add('hidden');
  const list = $('source-list'); list.innerHTML = '';
  if (result.citations.length) {
    const title = document.createElement('h3'); title.textContent = `Sources used · ${result.citations.length}`; list.appendChild(title);
    result.citations.forEach(source => {
      const card = document.createElement('div'); card.className = 'source-card';
      card.innerHTML = `<button type="button">[${source.number}] ${escapeHtml(source.title)} · ${escapeHtml(source.section)} ↗</button><p>${escapeHtml(source.snippet.slice(0,260))}${source.snippet.length > 260 ? '…' : ''}</p><small>${escapeHtml(source.classification)} · Effective ${escapeHtml(source.effective_date || 'date not specified')}</small>`;
      card.querySelector('button').addEventListener('click', () => openDocument(source.document_id));
      list.appendChild(card);
    });
  }
  $('answer-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function ask(event) {
  event.preventDefault();
  const question = $('question').value.trim();
  if (!question) return;
  $('query-error').classList.add('hidden');
  const button = $('ask-button'); button.disabled = true; button.textContent = 'Finding evidence…';
  try { renderAnswer(await api('/api/query', 'POST', { question, department: $('department-filter').value })); }
  catch (error) { $('query-error').textContent = error.message; $('query-error').classList.remove('hidden'); }
  finally { button.disabled = false; button.innerHTML = 'Ask assistant <span>→</span>'; }
}

async function openDocument(id) {
  try {
    const { document: doc } = await api(`/api/documents/${id}`);
    if (!doc) throw new Error('Source is unavailable to this account.');
    $('dialog-title').textContent = doc.title;
    $('dialog-meta').innerHTML = `<span>${escapeHtml(doc.department)}</span><span>${escapeHtml(doc.classification)}</span><span>Owner: ${escapeHtml(doc.owner)}</span><span>Effective: ${escapeHtml(doc.effective_date || 'not specified')}</span>`;
    $('dialog-content').textContent = doc.content;
    $('source-dialog').showModal();
  } catch (error) { alert(error.message); }
}

async function loadDocuments() {
  const grid = $('document-grid'); grid.innerHTML = '<p class="muted">Loading approved documents…</p>';
  try {
    state.documents = (await api('/api/documents')).documents;
    grid.innerHTML = '';
    state.documents.forEach(doc => {
      const card = document.createElement('article'); card.className = 'doc-card';
      card.innerHTML = `<div class="doc-top"><span class="doc-icon">▤</span><span class="scope">${escapeHtml(doc.classification)}</span></div><h2>${escapeHtml(doc.title)}</h2><p>${escapeHtml(doc.owner)} · ${escapeHtml(doc.document_type)}</p><div class="doc-footer"><span>${escapeHtml(doc.department)} · ${escapeHtml(doc.status)}</span><button type="button">Open source →</button></div>`;
      card.querySelector('button').addEventListener('click', () => openDocument(doc.id)); grid.appendChild(card);
    });
    if (!state.documents.length) grid.innerHTML = '<p class="muted">No documents are available to this account.</p>';
  } catch (error) { grid.textContent = error.message; }
}

async function loadConnectors() {
  const grid = $('connector-grid');
  try {
    const { connectors } = await api('/api/connectors');
    grid.innerHTML = '';
    connectors.forEach(connector => {
      const card = document.createElement('article'); card.className = 'connector-card';
      card.innerHTML = `<span class="connector-symbol">⇄</span><div><h2>${escapeHtml(connector.name)}</h2><p>${escapeHtml(connector.protocol)} · ${escapeHtml(connector.tools.join(', '))}</p><p>${escapeHtml(connector.scope)}</p></div><span class="status">${escapeHtml(connector.status)}</span>`;
      grid.appendChild(card);
    });
  } catch (error) { grid.textContent = error.message; }
}

function metric(label, value) { return `<div class="metric"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`; }
function barRows(items, nameKey) {
  const max = Math.max(1, ...items.map(item => item.count));
  return items.length ? items.map(item => `<div class="bar-row"><span>${escapeHtml(item[nameKey])}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(5,item.count / max * 100)}%"></div></div><strong>${item.count}</strong></div>`).join('') : '<p class="muted">No activity yet.</p>';
}
async function loadAnalytics() {
  try {
    const data = await api('/api/analytics');
    $('metric-grid').innerHTML = metric('Total questions', data.queries) + metric('No-answer rate', `${data.no_answer_rate}%`) + metric('Citation coverage', `${data.citation_coverage}%`) + metric('Average response', `${data.avg_latency_ms} ms`);
    $('department-bars').innerHTML = barRows(data.documents_by_department, 'department');
    $('route-bars').innerHTML = barRows(data.routes, 'route');
    $('recent-queries').innerHTML = data.recent_queries.length ? data.recent_queries.map(row => `<div class="table-row"><strong>${escapeHtml(row.question)}</strong><span>${escapeHtml(row.department)}</span><span>${escapeHtml(row.route)}</span><span>${row.no_answer ? 'No answer' : 'Answered'}</span></div>`).join('') : '<p class="muted">No questions yet. Ask the assistant to populate this view.</p>';
    $('connector-events').innerHTML = data.connector_calls.length ? data.connector_calls.map(row => `<div class="table-row"><strong>${escapeHtml(row.connector)}</strong><span>${escapeHtml(row.status)}</span><span>${row.result_count} sources</span><span>${row.latency_ms} ms</span></div>`).join('') : '<p class="muted">No connector calls yet.</p>';
  } catch (error) { $('metric-grid').textContent = error.message; }
}

async function upload(event) {
  event.preventDefault();
  const form = event.currentTarget; const file = form.elements.file.files[0];
  const message = $('upload-message'); message.textContent = 'Validating and indexing…'; message.className = 'muted';
  if (!file || file.size > 5 * 1024 * 1024) { message.textContent = 'Choose a file under 5 MB.'; message.className = 'error'; return; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const payload = Object.fromEntries(new FormData(form).entries()); delete payload.file;
    payload.filename = file.name; payload.file_base64 = btoa(binary);
    const { document: doc } = await api('/api/documents/upload', 'POST', payload);
    message.textContent = `Indexed ${doc.title} into ${doc.chunks} passages.`; message.className = 'success';
    form.reset(); loadDocuments();
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
}

async function sendFeedback(rating) {
  if (!state.answer) return;
  try { await api('/api/feedback', 'POST', { query_id: state.answer.id, rating }); $('feedback-saved').classList.remove('hidden'); }
  catch (error) { $('feedback-saved').textContent = error.message; $('feedback-saved').classList.remove('hidden'); }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault(); $('login-error').classList.add('hidden');
    try { const { user } = await api('/api/login', 'POST', { email: $('login-email').value, password: $('login-password').value }); showApp(user); }
    catch (error) { $('login-error').textContent = error.message; $('login-error').classList.remove('hidden'); }
  });
  $('user-button').addEventListener('click', async () => { await api('/api/logout', 'POST', {}); state.user = null; showLogin(); });
  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
  $('query-form').addEventListener('submit', ask);
  $('feedback-buttons').addEventListener('click', event => { if (event.target.dataset.rating) sendFeedback(Number(event.target.dataset.rating)); });
  $('show-upload').addEventListener('click', () => $('upload-panel').classList.remove('hidden'));
  $('close-upload').addEventListener('click', () => $('upload-panel').classList.add('hidden'));
  $('upload-form').addEventListener('submit', upload);
  $('refresh-analytics').addEventListener('click', loadAnalytics);
  $('close-dialog').addEventListener('click', () => $('source-dialog').close());
  try { const { user } = await api('/api/me'); user ? showApp(user) : showLogin(); }
  catch { showLogin(); }
});
