import { App } from "./App";
import { Integer } from "./Validator/Integer";

const express = require('express')
const exp = express()


console.log('asd');

App
    .get('/')
    .param('id', '', new Integer(false))
    .inject('request')
    .inject('response')
    .action((id) => {

    });


exp.use((req, res, next) => {
    App.setResource('request', req);
    App.setResource('response', res);
    const app = new App('UTC');
    app.run(req, res);
    next()
})

exp.listen(3000)