import { ExpressApp } from "./App/express/ExpressApp";


ExpressApp.start(80, '0.0.0.0');

ExpressApp.loadModules('./src/Modules');