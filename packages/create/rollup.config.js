import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from 'rollup-plugin-string';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    banner: '#!/usr/bin/env node\n',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    string({
      include: 'templates/**/*.tpl',
    }),
  ],
  external: [
    'node:readline/promises',
    'node:process',
    'node:fs/promises',
    'node:path',
    'node:http',
    'node:fs',
  ],
};
