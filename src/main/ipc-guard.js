const { isTrustedIpcSender } = require('./window');

function guardHandle(handler) {
  return (event, ...args) => {
    if (!isTrustedIpcSender(event)) throw new Error('Untrusted IPC sender');
    return handler(event, ...args);
  };
}

function guardEvent(handler) {
  return (event, ...args) => {
    if (!isTrustedIpcSender(event)) return;
    handler(event, ...args);
  };
}

module.exports = { guardHandle, guardEvent };
