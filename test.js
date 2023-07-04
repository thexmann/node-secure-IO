/**
 * Copyright 2023, C. Christmann This program is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
  *  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General 
 * Public License for more details.
 * See https://www.gnu.org/licenses/gpl-3.0.en.html for the terms of this license.
 */

import {ReceiveSigned, SendSigned} from "./libs/CCSignedIO.js"
import Express from 'express'

const app = Express()
app.listen(9999)


const keys = 
{
    pvtKey: "LS0tLS1CRUdJTiBQR1AgUFJJVkFURSBLRVkgQkxPQ0stLS0tLQoKeFlZRVpLTThseFlKS3dZQkJBSGFSdzhCQVFkQVl2dS95ZUpTdGFzeVhUd0NEWkx6OURWL3BNWE9nQ2JTClRrdWJVdnoyUWgzK0NRTUlhRnBBUFNNTjVyemd1cVZkdWtHYkxmT2lBek9XQnZjVkZCekRHTERSYk1GLwpMTE4wZm9yWHZMOGhaRzZFVTZuK0Y2TVdjNHRRTGgrMUlocjdwbkl4aEJFT01ZN1ZEV2ZUWUhLMlB4anYKTk0wR2RHVnpkR1Z5d293RUVCWUtBRDRGZ21TalBKY0VDd2tIQ0FtUUdkQWErdlRkY3k0REZRZ0tCQllBCkFnRUNHUUVDbXdNQ0hnRVdJUVIrbFNNRUs1cU0yNDJMV0NJWjBCcjY5TjF6TGdBQWVwa0EvamYvelA3UQp5ek82clQ2SlJWckVNOFlseEd3YWJHUEFYUmFZQzVzRVNTcWxBUURJNVlhOGFzdU5GL2ZhTFgwQTcyb1MKcUsvaHBmVmpXR3JjNUsyWktmeFhEY2VMQkdTalBKY1NDaXNHQVFRQmwxVUJCUUVCQjBDd2E3enV0NFdnClVQbGVwVTdoWmVLTmdCY09NZ0x3U3hCNHpQSGRCY3ZjWmdNQkNBZitDUU1JTTFiMXJmdWowcS9ncWxxSwovcmRJSzUzTzZuS1UzRThUazNUQjQ4ZlpIMUJWckxqZTkyRkpzcmhlaGgycy9na01KeVJZbGZOM29aY3MKU3lsSnpnYjJpbWxrZDFVekpOZnllcVpZOWNuRmhzSjRCQmdXQ0FBcUJZSmtvenlYQ1pBWjBCcjY5TjF6CkxnS2JEQlloQkg2Vkl3UXJtb3piall0WUloblFHdnIwM1hNdUFBQzFUd0VBcHJXamtHSUNZZzRma25BcQpVWk5nSERBMkhIWU9VU0tVNnFyYzAzQWN5cUlBLzNrT0FtSlBvMm1EUXA2NUxPMlZJYXRnZ3hYTEZtYlAKdlFvNDc4UmJoTkVKCj1iZlJJCi0tLS0tRU5EIFBHUCBQUklWQVRFIEtFWSBCTE9DSy0tLS0tCg==", 
    pubKey: "LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tCgp4ak1FWktNOGx4WUpLd1lCQkFIYVJ3OEJBUWRBWXZ1L3llSlN0YXN5WFR3Q0RaTHo5RFYvcE1YT2dDYlMKVGt1YlV2ejJRaDNOQm5SbGMzUmxjc0tNQkJBV0NnQStCWUprb3p5WEJBc0pCd2dKa0JuUUd2cjAzWE11CkF4VUlDZ1FXQUFJQkFoa0JBcHNEQWg0QkZpRUVmcFVqQkN1YWpOdU5pMWdpR2RBYSt2VGRjeTRBQUhxWgpBUDQzLzh6KzBNc3p1cTAraVVWYXhEUEdKY1JzR214andGMFdtQXViQkVrcXBRRUF5T1dHdkdyTGpSZjMKMmkxOUFPOXFFcWl2NGFYMVkxaHEzT1N0bVNuOFZ3M09PQVJrb3p5WEVnb3JCZ0VFQVpkVkFRVUJBUWRBCnNHdTg3cmVGb0ZENVhxVk80V1hpallBWERqSUM4RXNRZU16eDNRWEwzR1lEQVFnSHduZ0VHQllJQUNvRgpnbVNqUEpjSmtCblFHdnIwM1hNdUFwc01GaUVFZnBVakJDdWFqTnVOaTFnaUdkQWErdlRkY3k0QUFMVlAKQVFDbXRhT1FZZ0ppRGgrU2NDcFJrMkFjTURZY2RnNVJJcFRxcXR6VGNCektvZ0QvZVE0Q1lrK2phWU5DCm5ya3M3WlVocTJDREZjc1dacys5Q2pqdnhGdUUwUWs9Cj11RHBECi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0K"
}

const session = {publicKey:keys.pubKey}

app.use(Express.json())

app.use(SendSigned(keys.pvtKey,"123456"))
app.use(ReceiveSigned(keys.pubKey))

app.post("/sign",SendMessage )

app.post('/verify',(req,res)=> res.json(req.body) )

app.post('/verifyOne', SetPubKey,ReceiveSigned(), (req,res)=> res.json(req.body) )


async function SendMessage(req,res)
{
    const message = req.body.message || "This is a test"
    res.Signed(message)
}

function SetPubKey(req,res,next)
{
    req.publicKey = session.publicKey
    next()
}