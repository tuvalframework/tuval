import { Database } from './Database';
import { Exception as DatabaseException } from './Exception';

(Map as any).prototype.push = (function() {
    
    return function(value) {
        
      this.set(value.key, value);
    };
  })();

export class Document extends Map<string, any> {
    public static readonly SET_TYPE_ASSIGN = 'assign';
    public static readonly SET_TYPE_PREPEND = 'prepend';
    public static readonly SET_TYPE_APPEND = 'append';

    constructor(input: Record<string, any> = {}) {
        super();

        if (input['$permissions'] && !Array.isArray(input['$permissions'])) {
            throw new DatabaseException('$permissions must be of type array');
        }

        for (const [key, value] of Object.entries(input)) {
            if (Array.isArray(value)) {
                if (value.some(v => v['$id'] || v['$collection'])) {
                    this.set(key, new Document(value));
                } else {
                    this.set(key, value.map(v => (v['$id'] || v['$collection']) ? new Document(v) : v));
                }
            } else {
                this.set(key, value);
            }
        }

      /*   return new Proxy(this, {
            get: (target: any, prop: string) => {
                if (prop === 'has') {
                    // target.getArrayCopy();
                    const a = 'sad'
                }
                if (!target.__proto__.hasOwnProperty( prop) && !target.__proto__.__proto__.hasOwnProperty( prop) ) {
                    return target.get(prop as any);
                }
                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof prop === 'string') {
                    target[prop] = value;
                    return true;
                }
                return false;
            }
        }); */
    }

    public getId(): string {
        return this.getAttribute('$id', '');
    }

    public getInternalId(): string {
        return this.getAttribute('$internalId', '');
    }

    public setInternalId(id: string): void {
         this.set('$internalId', id);
    }

    public getCollection(): string {
        return this.getAttribute('$collection', '');
    }

    public getPermissions(): string[] {
        return JSON.parse(this.getAttribute('$permissions', []));
    }

    public getRead(): string[] {
        return this.getPermissionsByType(Database.PERMISSION_READ);
    }

    public getCreate(): string[] {
        return this.getPermissionsByType(Database.PERMISSION_CREATE);
    }

    public getUpdate(): string[] {
        return this.getPermissionsByType(Database.PERMISSION_UPDATE);
    }

    public getDelete(): string[] {
        return this.getPermissionsByType(Database.PERMISSION_DELETE);
    }

    public getWrite(): string[] {
        return Array.from(new Set(this.getCreate().concat(this.getUpdate(), this.getDelete())));
    }

    public getPermissionsByType(type: string): string[] {
        return Array.from(new Set(this.getPermissions().filter(permission => permission.startsWith(type)).map(permission => permission.replace(new RegExp(`^${type}\\(|\\)|"`, 'g'), ''))));
    }

    public getCreatedAt(): string | null {
        return this.getAttribute('$createdAt');
    }

    public getUpdatedAt(): string | null {
        return this.getAttribute('$updatedAt');
    }

    public getAttributes(): Record<string, any> {
        const attributes: Record<string, any> = {};
        const internalKeys = Database.INTERNAL_ATTRIBUTES.map(attr => attr['$id']);

        for (const [attribute, value] of this.entries()) {
            if (!internalKeys.includes(attribute)) {
                attributes[attribute] = value;
            }
        }

        return attributes;
    }

    public getAttribute<T = any>(name: string, defaultValue: any = null): T {
        return this.has(name) ? this.get(name) : defaultValue;
    }

    public setAttribute(key: string, value: any, type: string = Document.SET_TYPE_ASSIGN): this {
        switch (type) {
            case Document.SET_TYPE_ASSIGN:
                this.set(key, value);
                break;
            case Document.SET_TYPE_APPEND:
                if (!this.has(key) || !Array.isArray(this.get(key))) {
                    this.set(key, []);
                }
                this.get(key).push(value);
                break;
            case Document.SET_TYPE_PREPEND:
                if (!this.has(key) || !Array.isArray(this.get(key))) {
                    this.set(key, []);
                }
                this.get(key).unshift(value);
                break;
        }

        return this;
    }

    public setAttributes(attributes: Record<string, any>): this {
        for (const [key, value] of Object.entries(attributes)) {
            this.setAttribute(key, value);
        }

        return this;
    }

    public removeAttribute(key: string): this {
        this.delete(key);
        return this;
    }

    public find(key: string, find: any, subject: string = ''): any {
        const target = this.get(subject) ?? this;

        if (Array.isArray(target)) {
            for (const value of target) {
                if (value[key] === find) {
                    return value;
                }
            }
            return false;
        }

        return target[key] === find ? target : false;
    }

    public findAndReplace(key: string, find: any, replace: any, subject: string = ''): boolean {
        const target = this.get(subject) ?? this;

        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                if (target[i][key] === find) {
                    target[i] = replace;
                    return true;
                }
            }
            return false;
        }

        if (target[key] === find) {
            target[key] = replace;
            return true;
        }

        return false;
    }

    public findAndRemove(key: string, find: any, subject: string = ''): boolean {
        const target = this.get(subject) ?? this;

        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                if (target[i][key] === find) {
                    target.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        if (target[key] === find) {
            delete target[key];
            return true;
        }

        return false;
    }

    public isEmpty(): boolean {
        return this.size === 0;
    }

    public isSet(key: string): boolean {
        return this.has(key);
    }

    public getArrayCopy(allow: string[] = [], disallow: string[] = []): Record<string, any> {
        const array = Array.from(this.entries());
        const output: Record<string, any> = {};

        for (const [key, value] of array) {
            if (allow.length && !allow.includes(key)) {
                continue;
            }

            if (disallow.length && disallow.includes(key)) {
                continue;
            }

            if (value instanceof Document) {
                output[key] = value.getArrayCopy(allow, disallow);
            } else if (Array.isArray(value)) {
                output[key] = value.map(v => (v instanceof Document) ? v.getArrayCopy(allow, disallow) : v);
            } else {
                output[key] = value;
            }
        }

        return output;
    }

    public clone(): Document {
        const clone = new Document();

        for (const [key, value] of this.entries()) {
            if (value instanceof Document) {
                clone.set(key, value.clone());
            } else if (Array.isArray(value)) {
                clone.set(key, value.map(v => (v instanceof Document) ? v.clone() : v));
            } else {
                clone.set(key, value);
            }
        }

        return clone;
    }
}