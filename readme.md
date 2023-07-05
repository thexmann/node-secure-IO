# Documentation for Node.js Secure IO

This Node.js module includes two parts:

A worker pool class which provides a way to manage multiple worker threads for performing CPU-intensive tasks without blocking the main event loop.

Two express.js middleware functions, ReceiveSigned and SendSigned, that use the worker pool to verify and sign the data respectively.

## License

Copyright 2023, C. Christmann
This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software 
Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

See <https://www.gnu.org/licenses/gpl-3.0.en.html> for the terms of this license.

## Prerequsites
The file crypto_scripts.js MUST be placed into a workers sub-directory directly off the application's root directory.

## WorkerPool Class
    WorkerPool(size: number)

This is the constructor function for the WorkerPool class. The argument is the number of worker threads to be created.

    WorkerPool.initialize()

This method is responsible for initializing the worker pool. It creates size number of worker threads and adds them to the pool.

    WorkerPool.runTask(taskData: object)

This method runs a task in the next available worker thread, where taskData is an object containing data to be passed to the worker thread. If a worker is available, it posts the taskData to the worker, and when the worker finishes executing the script and posts back the result, the Promise gets resolved with the result. If no workers are available, the Promise gets rejected with an error.

    WorkerPool.destroy()

This method terminates all worker threads in the pool.
## Middleware

    ReceiveSigned(publicKey: string)

This function creates an express middleware that expects a signed request body or query (depending on the method of the request). It verifies the signature using the publicKey (or req.publicKey if available) by running the verification task in the worker pool. If the signature is verified, it replaces the request body or query with the verified data. If the signature is not verified, it responds with an "Invalid signature" error.

    SendSigned(pvtKey: string, passphrase: string)

This function creates an express middleware that adds a Signed method to the response object. This method expects data and signs it using the pvtKey and passphrase by running the sign task in the worker pool. It then sends the signed data in the response. If there's an error during the signing process, it responds with an error message.

# Node.js Worker Thread File Documentation

This file implements a worker thread in Node.js for the purpose of PGP signing and verifying. It makes use of the openpgp library to perform these operations.

## Importing dependencies

    import * as openpgp from 'openpgp'
    import {workerData, parentPort} from "node:worker_threads"

We import the openpgp library and Node.js built-in worker_threads module. The workerData object contains information passed from the main thread, while the parentPort object allows communication back to the main thread.

# Run Function

The Run function is the main function executed when a message is received from the parent thread.

    async function Run(workerData)

It expects an object in the workerData parameter with the following properties:

- script: A string that can be either 'sign' or 'verify'. This dictates whether the worker thread will be performing a signing or verification operation.

- data: A string containing the message to be signed or verified.
    - parameters for signing:
        - pvtKey: A string containing the private key for signing operation.
        - passphrase: A string containing the passphrase of the private key for signing operation.
    - parameters for verification:
        - pubKey: A string containing the public key for verification operation.
        - signed: A string containing the signed message for verification operation.

The function will execute either the PGPSign or PGPVerify functions depending on the script value. The results or any error that occurred during the operation are sent back to the parent thread.

## PGPSign Function

This function signs a message using PGP.

    async function PGPSign(strMessage, pvtKey, passphrase)

It expects three parameters:

- strMessage: A string containing the message to be signed.
- pvtKey: A string containing the private key used for signing.
- passphrase: A string containing the passphrase of the private key.

The function returns a string in the format of <base64_message>:<base64_signature>.

## PGPVerify Function

This function verifies a PGP signed message.

    async function PGPVerify(signedMessage, pubKey)

It expects two parameters:

- signedMessage: A string containing the message and its signature in the format of <base64_message>:<base64_signature>.
- pubKey: A string containing the public key used for verification.

If the signature is valid, the function will return the original message. Otherwise, it will throw an error.

## Helper Functions

The file also contains several helper functions:

- To64(str): Converts a string to Base64 format.
- From64(b64): Converts a Base64 string back to its original format.
- DecodeString(str): Checks if a string is in Base64 format. If it is, it converts it back to its original format.

# Test Code Documentation for Node.js Worker Pool and Middleware

This document describes a test script that sets up an Express.js server and routes using the ReceiveSigned and SendSigned middleware from the CCSignedIO.js module. The server listens on port 9999.
## Pre-requisites

    You should have Node.js and Express.js installed.
    You should have CCSignedIO.js module.

##Setup
In this setup, we import Express and the CCSignedIO.js module. We initialize an Express application and start the server to listen on port 9999.

We define a keys object which includes a private and public key. These keys are base64 encoded strings. We'll use these keys in our routes.

    import {ReceiveSigned, SendSigned} from "./libs/CCSignedIO.js"
    import Express from 'express'

    const app = Express()
    app.listen(9999)

    const keys = 
    {
        pvtKey: "LS0tLS1CRUdJ...", 
        pubKey: "LS0tLS1CRUdJ..."
    }

## Middleware Setup

The Express.json() middleware is used to parse incoming requests with JSON payloads.

    app.use(Express.json())

Then we set up our SendSigned and ReceiveSigned middleware:

    app.use(SendSigned(keys.pvtKey,"123456"))
    app.use(ReceiveSigned(keys.pubKey))

## Routes
/sign route

This route expects a POST request. It uses the SendMessage function to respond with a message signed by the private key:

    app.post("/sign",SendMessage )

/verify route

This route expects a POST request. It uses the ReceiveSigned middleware to verify the request's body. If the request body is properly signed with the corresponding private key, the route responds with the verified request body:

    app.post('/verify',(req,res)=> res.json(req.body) )

/verifyOne route

This route expects a POST request. It uses the SetPubKey function to set the publicKey from req.session.publicKeynext, then uses ReceiveSigned() middleware to verify the request body with the newly set public key. If verification is successful, it responds with the verified body:

    app.post('/verifyOne', SetPubKey,ReceiveSigned(), (req,res)=> res.json(req.body) )

## Additional Functions
### SendMessage(req, res)

This async function is a handler for the /sign route. It takes the message from req.body or a default message "This is a test". The message is then signed and sent as a response using the res.Signed() method provided by the SendSigned middleware:

    async function SendMessage(req,res)
    {
        const message = req.body.message || "This is a test"
        res.Signed(message)
    }

}

### SetPubKey(req, res, next)

<!-- This function sets req.publicKey from req.session.publicKey and calls the next middleware: -->

    function SetPubKey(req,res,next)
    {
        req.publicKey = req.session.publicKey
        next()
    }

## Running the Test Code

Once you have set up your code, you can start your server by running:

    node run test

Now you can test the /sign, /verify, and /verifyOne routes via a REST client like VSCode's REST Client. The test.rest is provided for testing.
