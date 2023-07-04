/**
 * Copyright 2023, C. Christmann This program is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General 
 * Public License for more details.
 * See https://www.gnu.org/licenses/gpl-3.0.en.html for the terms of this license.
 */

import * as openpgp from 'openpgp'
import {workerData, parentPort} from "node:worker_threads"

async function Run(workerData)
{
    switch(workerData.script)
    {
    case 'sign':
        try
        {
            const signed = await PGPSign(workerData.data, workerData.pvtKey, workerData.passphrase)
            parentPort.postMessage(signed)
        }
        catch(error)
        {
            parentPort.postMessage({ error: error.message })
        }
        break;
    case 'verify':
        try
        {
            const signed = await PGPVerify(workerData.signed, workerData.pubKey)
            parentPort.postMessage(signed)
        }
        catch(error)
        {
            parentPort.postMessage({ error: error.message })
        }
    }
}

parentPort.on('message',(workerData)=>Run(workerData))


async function PGPSign(strMessage, pvtKey, passphrase) {
	pvtKey = DecodeString(pvtKey)
	const privateKey = await openpgp.decryptKey({
		privateKey: await openpgp.readPrivateKey({
			armoredKey: pvtKey
		}),
		passphrase
	})
	const message = await openpgp.createMessage({
		text: strMessage
	})
	const detachedSignature = await openpgp.sign({
		message, // Message object
		signingKeys: privateKey,
		detached: true
	})
	return `${To64(strMessage)}:${To64(detachedSignature)}`
}

async function PGPVerify(signedMessage, pubKey) {
	let x = signedMessage.split(":")
	if (signedMessage[0] != "-") {
		x[0] = DecodeString(x[0]) // message
		x[1] = DecodeString(x[1]) // signature
	}
	const signature = await openpgp.readSignature({
		armoredSignature: x[1] // parse detached signature
	})
	const message = await openpgp.createMessage({
		text: x[0]
	})
	const publicKey = await openpgp.readKey({
		armoredKey: DecodeString(pubKey)
	})
	let verificationResult
	try
	{
		verificationResult = await openpgp.verify({
			message, // Message object
			signature,
			verificationKeys: publicKey
		})		
	}
	catch(e)
	{
		console.log(e)
		throw(e)
	}

	const { verified, keyID } = verificationResult.signatures[0]
	try {
		await verified; // throws on invalid signature
		return x[0]
	} catch (e) {
		throw new Error('Signature could not be verified: ' + e.message);
	}
}

function To64(str) {
	let buf = Buffer.from(str, 'utf8')
	let b64 = buf.toString('base64')
	return b64
}

function From64(b64) {
	let buf = Buffer.from(b64, 'base64')
	let str = buf.toString('utf8')
	return str
}

function DecodeString(str) {
	str = str.trim()
	if (str.substring(0, 5) !== '-----')
		str = From64(str)
	return str
}