
import { Database } from '../../Database';
import { Document as UtopiaDocument } from '../../Document';
import { Cursor } from '../../Validator/Query/Cursor';
import { Filter } from '../../Validator/Query/Filter';
import { Limit } from '../../Validator/Query/Limit';
import { Offset } from '../../Validator/Query/Offset';
import { Order } from '../../Validator/Query/Order';
import { Select } from '../../Validator/Query/Select';
import { IndexedQueries } from '../IndexedQueries';

export class Documents extends IndexedQueries {
    constructor(attributes: any[], indexes: any[]) {
        attributes.push(new UtopiaDocument({
            '$id': '$id',
            'key': '$id',
            'type': Database.VAR_STRING,
            'array': false,
        }));
        attributes.push(new UtopiaDocument({
            '$id': '$internalId',
            'key': '$internalId',
            'type': Database.VAR_STRING,
            'array': false,
        }));
        attributes.push(new UtopiaDocument({
            '$id': '$createdAt',
            'key': '$createdAt',
            'type': Database.VAR_DATETIME,
            'array': false,
        }));
        attributes.push(new UtopiaDocument({
            '$id': '$updatedAt',
            'key': '$updatedAt',
            'type': Database.VAR_DATETIME,
            'array': false,
        }));

        const validators = [
            new Limit(),
            new Offset(),
            new Cursor(),
            new Filter(attributes),
            new Order(attributes),
            new Select(attributes),
        ];

        super(attributes, indexes, validators);
    }
}