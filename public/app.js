const $ = sel => document.querySelector(sel);

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $('#' + id).classList.remove('hidden');
}

function formatBTC(sat) {
  return (sat / 1e8).toFixed(8) + ' BTC';
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString('ru-RU');
}

function shortHash(h, n = 8) {
  if (!h) return '—';
  return h.slice(0, n) + '…' + h.slice(-n);
}

function formatSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function api(path) {
  const res = await fetch('/api' + path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed with status ' + res.status);
  }
  return res.json();
}

async function loadHome() {
  showView('home');
  try {
    const [status, blocks] = await Promise.all([
      api('/status'),
      api('/blocks')
    ]);
    renderStats(status);
    renderBlocks(blocks);
  } catch (e) {
    renderError(e.message);
  }
}

function renderStats(status) {
  const fees = status.fees || {};
  $('#stats').innerHTML = `
    <div class="card">
      <div class="muted">Высота сети</div>
      <div class="big">${status.tipHeight.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="muted">Быстрая комиссия</div>
      <div class="big">${fees.fastestFee || '—'} sat/vB</div>
    </div>
    <div class="card">
      <div class="muted">Эконом</div>
      <div class="big">${fees.economyFee || '—'} sat/vB</div>
    </div>`;
}

function renderBlocks(blocks) {
  $('#blocks').innerHTML = blocks.map(b => `
    <div class="card block-card" data-hash="${b.hash}">
      <div class="height">#${b.height.toLocaleString()}</div>
      <div class="muted">${formatTime(b.timestamp)}</div>
      <div>Транзакций: ${b.txCount}</div>
      <div>Размер: ${(b.size / 1024).toFixed(1)} КБ</div>
      <div class="hash">${shortHash(b.hash)}</div>
    </div>`).join('');

  document.querySelectorAll('.block-card').forEach(card => {
    card.addEventListener('click', () => loadBlock(card.dataset.hash));
  });
}

async function loadBlock(hashOrHeight) {
  showView('block-view');
  $('#block-view').innerHTML = '<div class="card">Загрузка...</div>';
  try {
    const block = await api('/block/' + hashOrHeight);
    renderBlockDetail(block);
  } catch (e) {
    renderError(e.message);
  }
}

function renderBlockDetail(b) {
  const txList = (b.txids || []).map(txid => `
    <div class="tx-list-item" onclick="loadTransaction('${txid}')">
      <span class="txid">${shortHash(txid, 12)}</span>
    </div>`).join('');

  $('#block-view').innerHTML = `
    <span class="back-btn" onclick="loadHome()">&larr; Назад</span>
    <div class="detail-card">
      <h2>Блок #${b.height.toLocaleString()}</h2>
      <div class="detail-row">
        <span class="label">Хеш</span>
        <span class="value">${b.hash}</span>
      </div>
      <div class="detail-row">
        <span class="label">Время</span>
        <span class="value">${formatTime(b.timestamp)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Транзакций</span>
        <span class="value">${b.txCount}</span>
      </div>
      <div class="detail-row">
        <span class="label">Размер</span>
        <span class="value">${formatSize(b.size)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Вес</span>
        <span class="value">${b.weight.toLocaleString()} WU</span>
      </div>
      <div class="detail-row">
        <span class="label">Версия</span>
        <span class="value">${b.version}</span>
      </div>
      <div class="detail-row">
        <span class="label">Корень Меркла</span>
        <span class="value">${shortHash(b.merkleRoot, 12)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Nonce</span>
        <span class="value">${b.nonce}</span>
      </div>
      <div class="detail-row">
        <span class="label">Сложность</span>
        <span class="value">${Number(b.difficulty).toExponential(2)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Предыдущий блок</span>
        <span class="value">
          <span class="addr" onclick="loadBlock('${b.previousBlockHash}')">${shortHash(b.previousBlockHash, 10)}</span>
        </span>
      </div>
    </div>
    <div class="detail-card">
      <h2>Транзакции (первые ${(b.txids || []).length})</h2>
      ${txList || '<p class="muted">Транзакции не загружены</p>'}
    </div>`;
}

async function loadTransaction(txid) {
  showView('tx-view');
  $('#tx-view').innerHTML = '<div class="card">Загрузка...</div>';
  try {
    const tx = await api('/tx/' + txid);
    renderTxDetail(tx);
  } catch (e) {
    renderError(e.message);
  }
}

function renderTxDetail(tx) {
  const inputs = tx.inputs.map(inp => `
    <div class="io-item">
      <span class="addr" onclick="loadAddress('${inp.address}')">${inp.address ? shortHash(inp.address, 10) : 'Coinbase'}</span>
      <span class="amount">${formatBTC(inp.value)}</span>
    </div>`).join('');

  const outputs = tx.outputs.map(out => `
    <div class="io-item">
      <span class="addr" onclick="loadAddress('${out.address}')">${out.address ? shortHash(out.address, 10) : 'OP_RETURN'}</span>
      <span class="amount">${formatBTC(out.value)}</span>
    </div>`).join('');

  const statusHtml = tx.confirmed
    ? `<span class="confirmed">Подтверждена (блок #${tx.blockHeight})</span>`
    : `<span class="unconfirmed">Не подтверждена (в mempool)</span>`;

  $('#tx-view').innerHTML = `
    <span class="back-btn" onclick="loadHome()">&larr; Назад</span>
    <div class="detail-card">
      <h2>Транзакция</h2>
      <div class="detail-row">
        <span class="label">TXID</span>
        <span class="value">${tx.txid}</span>
      </div>
      <div class="detail-row">
        <span class="label">Статус</span>
        <span class="value">${statusHtml}</span>
      </div>
      <div class="detail-row">
        <span class="label">Размер</span>
        <span class="value">${tx.size} байт</span>
      </div>
      <div class="detail-row">
        <span class="label">Вес</span>
        <span class="value">${tx.weight} WU</span>
      </div>
      <div class="detail-row">
        <span class="label">Комиссия</span>
        <span class="value">${tx.fee.toLocaleString()} sat (${tx.feeBTC} BTC)</span>
      </div>
      <div class="detail-row">
        <span class="label">Ставка комиссии</span>
        <span class="value">${tx.feeRate} sat/vB</span>
      </div>
      <div class="detail-row">
        <span class="label">Сумма входов</span>
        <span class="value">${tx.totalInBTC} BTC</span>
      </div>
      <div class="detail-row">
        <span class="label">Сумма выходов</span>
        <span class="value">${tx.totalOutBTC} BTC</span>
      </div>
    </div>
    <div class="detail-card io-section">
      <h3>Входы (${tx.inputs.length})</h3>
      ${inputs}
    </div>
    <div class="detail-card io-section">
      <h3>Выходы (${tx.outputs.length})</h3>
      ${outputs}
    </div>`;
}

async function loadAddress(address) {
  if (!address || address === 'null') return;
  showView('address-view');
  $('#address-view').innerHTML = '<div class="card">Загрузка...</div>';
  try {
    const addr = await api('/address/' + address);
    renderAddressDetail(addr);
  } catch (e) {
    renderError(e.message);
  }
}

function renderAddressDetail(addr) {
  const txList = addr.transactions.map(tx => `
    <div class="tx-list-item" onclick="loadTransaction('${tx.txid}')">
      <span class="txid">${shortHash(tx.txid, 12)}</span>
      <span class="${tx.confirmed ? 'confirmed' : 'unconfirmed'}">
        ${tx.confirmed ? 'Блок #' + tx.blockHeight : 'Не подтверждена'}
      </span>
    </div>`).join('');

  $('#address-view').innerHTML = `
    <span class="back-btn" onclick="loadHome()">&larr; Назад</span>
    <div class="detail-card">
      <h2>Адрес</h2>
      <div class="detail-row">
        <span class="label">Адрес</span>
        <span class="value">${addr.address}</span>
      </div>
      <div class="detail-row">
        <span class="label">Баланс</span>
        <span class="value">${addr.balanceBTC} BTC</span>
      </div>
      <div class="detail-row">
        <span class="label">Всего получено</span>
        <span class="value">${addr.totalReceivedBTC} BTC</span>
      </div>
      <div class="detail-row">
        <span class="label">Всего отправлено</span>
        <span class="value">${addr.totalSentBTC} BTC</span>
      </div>
      <div class="detail-row">
        <span class="label">Транзакций</span>
        <span class="value">${addr.txCount}</span>
      </div>
    </div>
    <div class="detail-card">
      <h2>Последние транзакции (${addr.transactions.length})</h2>
      ${txList || '<p class="muted">Транзакции не найдены</p>'}
    </div>`;
}

function renderError(msg) {
  showView('error-view');
  $('#error-view').innerHTML = `
    <div class="error-box">
      <h2>Ошибка</h2>
      <p>${msg}</p>
      <br>
      <span class="back-btn" onclick="loadHome()">&larr; Вернуться на главную</span>
    </div>`;
}

$('#search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = $('#search').value.trim();
  if (!q) return;

  try {
    const result = await api('/search/' + encodeURIComponent(q));
    if (result.type === 'block') {
      showView('block-view');
      renderBlockDetail(result.data);
    } else if (result.type === 'tx') {
      showView('tx-view');
      renderTxDetail(result.data);
    } else if (result.type === 'address') {
      showView('address-view');
      renderAddressDetail(result.data);
    }
  } catch (e) {
    renderError(e.message);
  }
});

setInterval(() => {
  if (!$('#home').classList.contains('hidden')) loadHome();
}, 30000);

loadHome();
