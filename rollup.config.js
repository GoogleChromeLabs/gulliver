import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: './public/js/gulliver.es6.js',
  plugins: [
    babel(),
    uglify()
  ],
  targets: [
    {
      dest: './public/js/gulliver.js',
      format: 'iife',
      sourceMap: true
    }
  ]
};
