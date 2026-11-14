const path = require('node:path');

function isInsideDir(root, target) {
  if (typeof root !== 'string' || typeof target !== 'string') return false;

  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

module.exports = { isInsideDir };
