import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import workerDom from '../index.js';
import path from 'path';

const paths = {
	src: (...paths) => path.join(__dirname, 'src', ...paths),
	public: (...paths) => path.join(__dirname, 'public', ...paths),
};

export default {
	input: paths.src('index.js'),
	plugins: [
		babel({
			exclude: 'node_modules/**',
			babelrc: false,
			presets: [['env', { modules: false }], 'react'],
			plugins: ['external-helpers'],
		}),
		resolve({
			jsnext: true,
		}),
		commonjs({
			include: 'node_modules/**',
		}),
		replace({
			'process.env.NODE_ENV': JSON.stringify('development'),
		}),
		workerDom({
			// entry: paths.src('index.html'),
			title: 'WorkerDOM React',
			output: paths.public('index.html'),
			dist: paths.public('dist'),
			source: paths.public('dist', 'index.js'),
			module: true,
			// id: 'app',
		}),
		serve({
			open: true,
			verbose: true,
			contentBase: paths.public(),
			historyApiFallback: false,
			host: 'localhost',
			port: 3000
		}),
	],
	output: {
		format: 'iife',
		file: paths.public('dist', 'index.js'),
		sourcemap: true,
	},
};
