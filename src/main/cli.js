const FLAGS = new Set(['--toggle', '--show', '--hide', '--quit']);

function parseArgs(argv = process.argv) {
  const flags = new Set(argv.slice(1).filter((arg) => FLAGS.has(arg)));

  return {
    toggle: flags.has('--toggle'),
    show: flags.has('--show'),
    hide: flags.has('--hide'),
    quit: flags.has('--quit'),
  };
}

module.exports = { parseArgs };
