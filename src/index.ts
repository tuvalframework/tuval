import { App } from "./App";
import { Integer } from "./Validator/Integer";
import { Request } from "./express/ExpressRequest";

const express = require('express')
const exp = express()


console.log('asd');

App
    .get('/')
    .desc('Get all users')
    .param('id', '', new Integer(false))
    .inject('request')
    .inject('response')
    .action((id) => {

    });


exp.use((req, res, next) => {
    const tuvalReq = new Request(req);
    App.setResource('request', () => tuvalReq); // Wrap Request in a function
    App.setResource('response', res);
    const app = new App('UTC');
    app.run(tuvalReq, res);
    next()
})

exp.listen(3000)