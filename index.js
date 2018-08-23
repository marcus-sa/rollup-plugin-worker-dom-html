import { minify } from 'html-minifier';
import cheerio from 'cheerio';
import fse from 'fs-extra';
import path from 'path';

async function getEntryFile(options) {
	try {
		return await fse.readFile(options.entry, 'utf8');
	} catch (e) {
		options.id = 'app';

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>${options.title}</title>
			</head>
			<body>
				<div id="app"></div>
			</body>
			</html>
		`;
	}
}

function minifyHtml(html) {
	return minify(html, {
		collapseWhitespace: true,
		minifyJS: true,
		collapseBooleanAttributes: true,
		collapseInlineTagWhitespace: true,
		removeAttributeQuotes: true,
		removeRedundantAttributes: true,
		removeComments: true,
		minifyURLs: true,
		minifyCSS: true,
	});
}

function getRelativeDist(options) {
	return options.dist.split('\\').pop();
}

function generateHeadScript(options, dist) {
	return !options.module
		? `<script src="./dist/index.js" defer></script>`
		: `
			<script src="./${dist}/worker-dom/index.mjs" type="module"></script>
			<script src="./${dist}/worker-dom/index.js" nomodule defer></script>
		`;
}

function generateUpgradeScript(filename, options, dist) {
	const id = options.id.includes('[name]')
		? filename.split('.')[0]
		: options.id;

	return !options.module
		? `
			<script async=false defer>
		    document.addEventListener('DOMContentLoaded', function() {
		      MainThread.upgradeElement(document.getElementById('${id}'), './${dist}/worker-dom/worker.js');
		    }, false);
		  </script>
		`
		: `
			<script type="module">
		    import { upgradeElement } from './${dist}/worker-dom/index.mjs';
		    upgradeElement(document.getElementById('${id}'), './${dist}/worker-dom/worker.mjs');
		  </script>
			<script nomodule async=false defer>
		    document.addEventListener('DOMContentLoaded', function() {
		      MainThread.upgradeElement(document.getElementById('${id}'), './${dist}/worker-dom/worker.js');
		    }, false);
		  </script>
		`;
}

export default function workerDom(options = {}) {
	const rootDir = path.resolve(options.root || process.cwd());
	const workerDomDist = path.join(rootDir, 'node_modules', '@ampproject', 'worker-dom', 'dist');

	return {
		name: 'worker-dom-html',
		buildEnd() {
			return fse.copy(workerDomDist, path.join(options.dist, 'worker-dom'));
		},
		async generateBundle() {
			const code = await getEntryFile(options);
			const entry = path.basename(options.source);
			const $ = cheerio.load(code);

			const dist = getRelativeDist(options);
			$('head').append(generateHeadScript(options, dist));
			$('body').append(generateUpgradeScript(entry, options, dist));
			$(`#${options.id}`).attr('src', `./${dist}/${entry}`);

			const html = minifyHtml($.html());
			await fse.writeFile(options.output, html, 'utf8');
		},
	};
}

