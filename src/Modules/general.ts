
import { App } from "../App/App";
import { Local } from "../Storage/Device/Local";
import { Integer } from "../App/Validator/Integer";
import { Text } from "../App/Validator/Text";
import { Request } from "../App/express/ExpressRequest";
import { Response } from "../App/express/ExpressResponse";



App
    .get('/:id/:name')
    .desc('Get all users')
    .param('id', '', new Integer(false))
    .param('name', '', new Text(255))
    .inject('request')
    .inject('response')
    .action((id: number, name: string, req: Request, res: Response) => {
        console.log(id);
        console.log(name);
        res.send(name);
    });