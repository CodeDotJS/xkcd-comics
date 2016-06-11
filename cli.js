#!/usr/bin/env node

'use strict';

const fs = require('fs');
const http = require('http');
const dns = require('dns');
const got = require('got');
const colors = require('colors/safe');
const mkdirp = require('mkdirp');
const ora = require('ora');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

console.log();
const spinner = ora();

dns.lookup('xkcd.com', err => {
	if (err && err.code === 'ENOTFOUND') {
		console.log(colors.red.bold(' ❱ Internet Connection   :   ✖\n'));
		process.exit(1);
	}
	spinner.start();
	spinner.text = colors.cyan.bold('XKCD Loves You!');
});

const xkcdComics = './XKCD/';

mkdirp(xkcdComics, err => {
	if (err) {
		console.log(colors.red.bold('\n ❱ Directory Created      :    ✖\n'));
		process.exit(1);
	} else {
		/* no need */
	}
});

function comicsName(img) {
	return img.split('/').pop();
}

got('http://xkcd.com/info.0.json').then(res => {
	spinner.start();
	spinner.text = colors.green.bold('Have patience. All things are difficult before they become easy.');
	const getCount = JSON.parse(res.body);
	const startCount = getCount.num;
	let randCount = Math.floor((Math.random() * startCount) + 1);
	if (randCount === 404) {
		randCount = Math.floor((Math.random() * startCount) + 1);
	}
	const staticURL = `http://xkcd.com/${randCount}/info.0.json`;
	got(staticURL).then(res => {
		spinner.stop();
		const semLink = JSON.parse(res.body);
		const imageLink = semLink.img;
		const alt = semLink.alt;
		const comicName = comicsName(imageLink);
		console.log(colors.cyan.bold(' ', alt));
		console.log();
		spinner.stop();
		// for backup
		mkdirp(xkcdComics, err => {
			if (err) {
				process.exit(1);
			} else {
				// no message
			}
		});
		const comicOn = fs.createWriteStream(xkcdComics + comicName);
		http.get(imageLink, (res, cb) => {
			const dirMessage = colors.cyan.bold(xkcdComics.replace('./', '').replace('/', ''));
			const comicColor = colors.cyan.bold(comicName);
			spinner.start();
			spinner.text = colors.green.bold(`Saving comics in ${dirMessage} ❱ ${comicColor}`);
			res.pipe(comicOn);
			comicOn.on('finish', () => {
				spinner.stop();
				comicOn.close(cb);
			});
		});
	});
}).catch(error => {
	process.exit(1);
	console.log(error);
});
