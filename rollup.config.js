import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonsjs from 'rollup-plugin-commonjs';

export default {
  entry: './public/js/gulliver.es6.js',
  plugins: [
    babel(),
    uglify(),
    nodeResolve(),
    commonsjs()
  ],
  // Quiet warning: https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
  context: 'window',
  targets: [
    {
      dest: './public/js/gulliver.js',
      format: 'iife',
      sourceMap: true
    }
  ]
};
