#!/usr/bin/env node

'use strict';

const os = require('os');
const dns = require('dns');
const fs = require('fs');
const https = require('https');
const fse = require('fs-extra');
const got = require('got');
const chalk = require('chalk');
const logUpdate = require('log-update');
const ora = require('ora');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const arg = process.argv[2];

if (arg === '-h' || arg === '--help') {
	console.log(`
  ${chalk}
  	`);
}

const pre = chalk.red.bold('›');
const pos = chalk.cyan.bold('›');
const spinner = ora();
const directory = `${os.homedir()}/xkcd-strips/`;

fse.ensureDir(directory, err => {
	if (err) {
		process.exit(1);
	}
});

logUpdate();
spinner.text = `xkcd loves you!`;
spinner.start();

dns.lookup('xkcd.com', err => {
	if (err) {
		logUpdate(`\n${pre} ${chalk.dim('Please check your internet connection!')}\n`);
		process.exit(1);
	} else {
		got('http://xkcd.com/info.0.json', {json: true}).then(res => {
			const body = res.body.num;
			let randCount = Math.floor((Math.random() * body) + 1);
			if (randCount === 404) {
				randCount = Math.floor((Math.random() * body) + 1);
			}
			got(`https://xkcd.com/${randCount}/info.0.json`, {json: true}).then(res => {
				const header = res.body;
				const img = header.img;
				const caption = header.alt;
				const dir = header.safe_title;
				logUpdate(`\n${pos} Title   : ${chalk.dim(dir)} \n\n${pos} Caption : ${chalk.dim(caption)}\n\n${pos} Strip   : ${chalk.dim(img.split('/').pop())}\n`);
				const file = fs.createWriteStream(`${directory}${img.split('/').pop()}`);
				https.get(img, (res, cb) => {
					spinner.text = 'Saving Strip!';
					res.pipe(file);
					file.on('finish', () => {
						spinner.stop();
						file.close(cb);
						file.on('error', () => {
							process.exit(1);
						});
					});
				});
			});
		});
	}
});
