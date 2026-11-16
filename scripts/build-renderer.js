const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['src/renderer/js/renderer.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: 'src/renderer/build/renderer.js',
});
