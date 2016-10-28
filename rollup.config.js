import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: './public/js/gulliver.es6.js',
  plugins: [
    babel(),
    uglify()
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
