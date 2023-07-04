/**
 * Copyright 2023, C. Christmann This program is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General 
 * Public License for more details.
 * See https://www.gnu.org/licenses/gpl-3.0.en.html for the terms of this license.
 */

import { Worker } from 'node:worker_threads'
import fs from 'node:fs'

const workerFile = fs.realpathSync("workers/crypto_scripts.js")

class WorkerPool {
	constructor(size) {
		this.size = size;
		this.pool = [];
		this.isInitialized = false;
		this.initialize();
	}

	initialize() {
		for (let i = 0; i < this.size; i++) {
			const worker = new Worker(workerFile);
			worker.isIdle = true
			this.pool.push(worker);
		}
		this.isInitialized = true;
	}

	runTask(taskData) {
		return new Promise((resolve, reject) => {
			if (!this.isInitialized) {
				reject(new Error('Worker pool is not initialized.'));
				return;
			}

			const availableWorker = this.pool.find(worker => worker.isIdle);
			if (availableWorker) {
				availableWorker.isIdle = false;
				availableWorker.postMessage(taskData);
				availableWorker.once('message', result => {
					availableWorker.isIdle = true;
					resolve(result);
				});
			} else {
				reject(new Error('No available workers.'));
			}
		});
	}

	destroy() {
		for (const worker of this.pool) {
			worker.terminate();
		}
	}
}

// Usage
const workerPool = new WorkerPool(6);

async function PerformTask(taskData) {
	try {
		const result = await workerPool.runTask(taskData);
		console.log('Task result:', result);
		return result
	} catch (error) {
		console.error('Error performing task:', error);
		throw(error)
	}
}


export function ReceiveSigned(publicKey) {
	return async (req, res, next) => {
		let signed, pubkey = req.publicKey || publicKey
		switch (req.method) {
			case 'GET':
				signed = req.query.signed || false
				break
			case 'POST':
				signed = req.body.signed || false
				break
		}
		if( !signed ) return next()
		try {
			// console.time("verify")
			const data = await PerformTask({ 'script': 'verify', signed:signed, pubKey:pubkey })
			// console.timeEnd("verify")
			switch (req.method) {
				case 'GET':
					req.query = (typeof data === 'object') ? JSON.parse(data) : data
					break
				case 'POST':
					req.body = (typeof data === 'object') ? JSON.parse(data) : data
					break
			}
			next()
		}
		catch (error) {
			res.json({ error: "Invalid signature" })
		}
	}
}

export function SendSigned(pvtKey, passphrase) {
	return async (req, res, next) => {
		res.Signed = async (data) => {
			if (typeof data === 'object')
				data = JSON.stringify(data)
			try {
				// console.time("sign")
				const signed = await PerformTask({ 'script': 'sign', data, pvtKey, passphrase })
				// console.timeEnd("sign")
				res.send({ data: signed })
			}
			catch (error) {
				res.json({ error: error.message })
			}
		}
		next()
	}
}