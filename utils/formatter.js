function satoshiToBTC(satoshi) {
  return (satoshi / 1e8).toFixed(8);
}

function formatTimestamp(unix) {
  return new Date(unix * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

function formatSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

module.exports = { satoshiToBTC, formatTimestamp, formatSize };
