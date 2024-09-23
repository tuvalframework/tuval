import { App } from "../App/App";
import { Request } from "../App/express/ExpressRequest";
import { Response } from "../App/express/ExpressResponse";


App
    .init()
    .inject('app')
    .inject('request')
    .action((app: App, request: Request) => {
        console.log('Module yuklendi');
    })

App
    .get('/module')
    .desc('Get all users')
    .inject('request')
    .inject('response')
    .action(( req: Request, res: Response) => {

        res.send('Hello World from module');
    });