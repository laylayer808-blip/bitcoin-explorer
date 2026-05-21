const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSec = 30) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000
  });
}

module.exports = { get, set };
