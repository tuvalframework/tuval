import { App } from "../App/App";
import { Local } from "../Storage/Device/Local";
import { Integer } from "../App/Validator/Integer";
import { Text } from "../App/Validator/Text";
import { Request } from "../App/express/ExpressRequest";
import { Response } from "../App/express/ExpressResponse";


console.log('Account Module Yuklendi');

var fs = require('fs');
var path = require('path');

App
    .init()
    .inject('app')
    .inject('request')
    .action((app: App, request: Request) => {
        console.log('Module Accounts Yuklendi');
    })

App
    .get('/accounts')
    .desc('Get all users')
    .inject('request')
    .inject('response')
    .action(async (req: Request, res: Response) => {
        const localInstance = new Local(path.resolve(__dirname, '../../resources/disk-a'));
        await localInstance.createDirectory(path.resolve(__dirname, '../../resources/disk-a/test_memer'));
        await localInstance.write(localInstance.getPath('test_memer.txt'), 'tsdfsdest_memer');
        const text = await localInstance.read(localInstance.getPath('test_memer.txt'));
        console.log(text);
        res.send('Hello World from accounts');
    });


App
    .post('/accounts')
    .desc('Create account')
    .groups(['api', 'account', 'auth'])
    .label('event', 'users.[userId].create')
    .label('scope', 'sessions.write')
    .label('auth.type', 'emailPassword')
    .label('audits.event', 'user.create')
    .label('audits.resource', 'user/{response.$id}')
    .label('audits.userId', '{response.$id}')
    .label('sdk.auth', [])
    .label('sdk.namespace', 'account')
    .label('sdk.method', 'create')
    .label('sdk.description', '/docs/references/account/create.md')
    .label('sdk.response.code', Response.STATUS_CODE_CREATED)
    .label('sdk.response.type', Response.CONTENT_TYPE_JSON)
    // .label('sdk.response.model', Response.MODEL_USER)
    .label('abuse-limit', 10)
    .inject('request')
    .inject('response')
    .action(async (req: Request, res: Response) => {
        res.send('Hello World from accounts');
    });