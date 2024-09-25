import { ExpressApp } from "./App/express/ExpressApp";
import { Memory } from "./Cache/Adapters/Memory";
import { Cache } from "./Cache/Cache";
import { MariaDB } from "./Database/Adapters/MariaDB";
import { Database } from "./Database/Database";
import { Document } from "./Database/Document";


// ExpressApp.start(80, '0.0.0.0');

// ExpressApp.loadModules('./src/Modules');

const mysql = require('mysql2/promise');

async function main() {

    const $cache = new Cache(new Memory()); // veya istediğiniz herhangi bir önbellek adaptörünü kullanın

    const $database = new Database(new MariaDB(
        {
            host: 'localhost', // Kendi sunucunuzla değiştirin
            user: 'root',      // Veritabanı kullanıcınızla değiştirin
            password: 'password', // Veritabanı şifrenizle değiştirin
            database: 'yourdb',  // Veritabanı adınızla değiştirin
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        }
    ), $cache);

    $database.getNamespace();

    // Tüm koleksiyon isimlerinin önüne eklenen ad alanını ayarlar
    $database.setNamespace('my_namespace'
    );

    // Varsayılan veritabanını ayarlar
    $database.setDatabase('dbName');


    // Yeni bir veritabanı oluşturur.
    // Varsayılan veritabanı adını kullanır.
    await $database.create();

    const users = await $database.getCollection('users');
    const teams = await $database.getCollection('teams');
    const customers = await $database.getCollection('customers');

    if (users.isEmpty()) {
        await $database.createCollection('users');
    }

    if (teams.isEmpty()) {
        await $database.createCollection('teams', [
            new Document({
                '$id': 'ADI',
                'key': 'ADI',
                'type': Database.VAR_STRING,
                'size': 256,
                'required': true,
                'signed': true,
                'array': false,
                'filters': [],
            }),
        ]);
    }

    if (customers.isEmpty()) {
        await $database.createCollection('customers');
    }

  //  await $database.createAttribute('users', 'name', 'string', 255, false);
   // await $database.createAttribute('users', 'email', 'string');
   // await $database.createAttribute('users', 'password', 'string');

}

main()