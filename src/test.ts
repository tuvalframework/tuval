import { ExpressApp } from "./App/express/ExpressApp";
import { Memory } from "./Cache/Adapters/Memory";
import { Cache } from "./Cache/Cache";
import { MariaDB } from "./Database/Adapters/MariaDB";
import { Database } from "./Database/Database";


// ExpressApp.start(80, '0.0.0.0');

// ExpressApp.loadModules('./src/Modules');

const mysql = require('mysql2/promise');

async function main() {

    const $cache = new Cache(new Memory()); // or use any cache adapter you wish

    const $database = new Database(new MariaDB(
        {
            host: 'localhost', // Replace with your host
            user: 'root',      // Replace with your database user
            password: 'password', // Replace with your database password
            database: 'yourdb',  // Replace with your database name
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        }
    ), $cache);

    $database.getNamespace();

    // Sets namespace that prefixes all collection names
    $database.setNamespace('my_namespace'
    );

    // Sets default database
    $database.setDatabase('dbName');


    // Creates a new database. 
    // Uses default database as the name.
    $database.create();

    $database.createCollection( 'users');


    // Get default database
    console.log($database.getNamespace());

    const connection = await mysql.createConnection({
        host: 'localhost', // Replace with your host
        user: 'root',      // Replace with your database user
        password: 'password', // Replace with your database password
        database: 'yourdb'   // Replace with your database name
    });

    console.log('Connected to the database.');

    try {
        const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
        console.log('The solution is: ', rows[0].solution);
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await connection.end();
    }
}

main()