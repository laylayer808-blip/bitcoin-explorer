const express = require('express');
const router = express.Router();
const btc = require('../services/bitcoinApi');

router.get('/blocks', async (req, res, next) => {
  try {
    res.json(await btc.getLatestBlocks());
  } catch (e) { next(e); }
});

router.get('/block/:id', async (req, res, next) => {
  try {
    res.json(await btc.getBlock(req.params.id));
  } catch (e) { next(e); }
});

router.get('/tx/:txid', async (req, res, next) => {
  try {
    res.json(await btc.getTransaction(req.params.txid));
  } catch (e) { next(e); }
});

router.get('/address/:address', async (req, res, next) => {
  try {
    res.json(await btc.getAddress(req.params.address));
  } catch (e) { next(e); }
});

router.get('/search/:query', async (req, res, next) => {
  const q = req.params.query.trim();
  try {
    if (/^\d+$/.test(q) && q.length < 10) {
      const block = await btc.getBlock(q);
      res.json({ type: 'block', data: block });
    } else if (/^[0-9a-f]{64}$/i.test(q)) {
      try {
        const block = await btc.getBlock(q);
        res.json({ type: 'block', data: block });
      } catch {
        const tx = await btc.getTransaction(q);
        res.json({ type: 'tx', data: tx });
      }
    } else if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(q)) {
      const addr = await btc.getAddress(q);
      res.json({ type: 'address', data: addr });
    } else {
      res.status(400).json({ error: 'Unrecognized query format' });
    }
  } catch (e) { next(e); }
});

router.get('/status', async (req, res, next) => {
  try {
    const height = await btc.getTipHeight();
    res.json({ tipHeight: height });
  } catch (e) { next(e); }
});

module.exports = router;
