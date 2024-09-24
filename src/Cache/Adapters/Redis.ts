import { Redis as Client } from 'ioredis';
import { Adapter } from "../Adapter";

namespace Utopia.Cache.Adapter {
    export class Redis implements Adapter {
        protected redis: Client;

        constructor(redis: Client) {
            this.redis = redis;
        }

        load(key: string, ttl: number, hash: string = ''): any {
            if (!hash) {
                hash = key;
            }

            return this.redis.hget(key, hash).then((redisString) => {
                if (!redisString) {
                    return false;
                }

                const cache = JSON.parse(redisString);
                if (cache.time + ttl > Date.now() / 1000) {
                    return cache.data;
                }

                return false;
            });
        }

        save(key: string, data: any, hash: string = ''): Promise<boolean | string | any[]> {
            if (!key || !data) {
                return Promise.resolve(false);
            }

            if (!hash) {
                hash = key;
            }

            const value = JSON.stringify({
                time: Date.now() / 1000,
                data: data,
            });

            return this.redis.hset(key, hash, value).then(() => data).catch(() => false);
        }

        list(key: string): Promise<string[]> {
            return this.redis.hkeys(key).then((keys) => keys || []);
        }

        purge(key: string, hash: string = ''): Promise<boolean> {
            if (hash) {
                return this.redis.hdel(key, hash).then((result) => !!result);
            }

            return this.redis.del(key).then((result) => !!result);
        }

        flush(): Promise<boolean> {
            return this.redis.flushall().then(() => true);
        }

        ping(): Promise<boolean> {
            return this.redis.ping().then(() => true).catch(() => false);
        }

        getSize(): Promise<number> {
            return this.redis.dbsize();
        }
    }
}