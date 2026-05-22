const fetch = require('node-fetch');
const cache = require('../utils/cache');

const BLOCKSTREAM = 'https://blockstream.info/api';
const MEMPOOL = 'https://mempool.space/api';

async function safeFetch(url, ttl = 30) {
  const cached = cache.get(url);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`API returned status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : await res.text();
    cache.set(url, data, ttl);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function getLatestBlocks() {
  const blocks = await safeFetch(`${BLOCKSTREAM}/blocks`);
  return blocks.map(b => ({
    hash: b.id,
    height: b.height,
    timestamp: b.timestamp,
    txCount: b.tx_count,
    size: b.size,
    weight: b.weight
  }));
}

async function getBlock(hashOrHeight) {
  let hash = hashOrHeight;
  if (/^\d+$/.test(hashOrHeight)) {
    hash = await safeFetch(`${BLOCKSTREAM}/block-height/${hashOrHeight}`);
  }
  const block = await safeFetch(`${BLOCKSTREAM}/block/${hash}`, 300);
  const txids = await safeFetch(`${BLOCKSTREAM}/block/${hash}/txids`, 300);
  return {
    hash: block.id,
    height: block.height,
    timestamp: block.timestamp,
    txCount: block.tx_count,
    size: block.size,
    weight: block.weight,
    version: block.version,
    merkleRoot: block.merkle_root,
    previousBlockHash: block.previousblockhash,
    nonce: block.nonce,
    bits: block.bits,
    difficulty: block.difficulty,
    txids: txids.slice(0, 25)
  };
}

async function getTransaction(txid) {
  const tx = await safeFetch(`${BLOCKSTREAM}/tx/${txid}`, 60);

  const totalIn = tx.vin.reduce((sum, inp) => {
    return sum + (inp.prevout ? inp.prevout.value : 0);
  }, 0);
  const totalOut = tx.vout.reduce((sum, out) => sum + out.value, 0);

  return {
    txid: tx.txid,
    size: tx.size,
    weight: tx.weight,
    fee: tx.fee,
    feeBTC: (tx.fee / 1e8).toFixed(8),
    feeRate: (tx.fee / (tx.weight / 4)).toFixed(2),
    totalIn,
    totalInBTC: (totalIn / 1e8).toFixed(8),
    totalOut,
    totalOutBTC: (totalOut / 1e8).toFixed(8),
    confirmed: tx.status.confirmed,
    blockHeight: tx.status.block_height || null,
    blockHash: tx.status.block_hash || null,
    inputs: tx.vin.map(v => ({
      txid: v.txid,
      vout: v.vout,
      address: v.prevout ? v.prevout.scriptpubkey_address : null,
      value: v.prevout ? v.prevout.value : 0
    })),
    outputs: tx.vout.map((v, i) => ({
      index: i,
      address: v.scriptpubkey_address || null,
      value: v.value
    }))
  };
}

async function getAddress(address) {
  const [info, txs] = await Promise.all([
    safeFetch(`${BLOCKSTREAM}/address/${address}`, 30),
    safeFetch(`${BLOCKSTREAM}/address/${address}/txs`, 30)
  ]);

  const funded = info.chain_stats.funded_txo_sum + (info.mempool_stats.funded_txo_sum || 0);
  const spent = info.chain_stats.spent_txo_sum + (info.mempool_stats.spent_txo_sum || 0);
  const balance = funded - spent;

  return {
    address: info.address,
    balance,
    balanceBTC: (balance / 1e8).toFixed(8),
    totalReceived: funded,
    totalReceivedBTC: (funded / 1e8).toFixed(8),
    totalSent: spent,
    totalSentBTC: (spent / 1e8).toFixed(8),
    txCount: info.chain_stats.tx_count + (info.mempool_stats.tx_count || 0),
    transactions: txs.slice(0, 25).map(tx => ({
      txid: tx.txid,
      confirmed: tx.status.confirmed,
      blockHeight: tx.status.block_height || null,
      fee: tx.fee,
      value: tx.vout.reduce((s, o) => s + o.value, 0)
    }))
  };
}

async function getTipHeight() {
  const h = await safeFetch(`${BLOCKSTREAM}/blocks/tip/height`);
  return parseInt(h);
}

async function getFeeRecommendations() {
  return await safeFetch(`${MEMPOOL}/v1/fees/recommended`, 60);
}

module.exports = {
  getLatestBlocks,
  getBlock,
  getTransaction,
  getAddress,
  getTipHeight,
  getFeeRecommendations
};
