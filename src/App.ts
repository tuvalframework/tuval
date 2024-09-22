
    import { Hook } from './Hook';
    import { Route } from './Route';
    import { Request } from './Request';
    import { Response } from './Response';
    import { Validator } from './Validator';
    import { Router } from './Router';

    interface Param {
        default: string | ((...args: any[]) => any);
        skipValidation: boolean;
        optional: boolean;
        validator: Validator | ((...args: any[]) => Validator);
        injections: string[];
        order: number;
    }

    interface Injection {
        name: string;
        order: number;
    }

    class App {
        /**
         * Request method constants
         */
        public static readonly REQUEST_METHOD_GET = 'GET';
        public static readonly REQUEST_METHOD_POST = 'POST';
        public static readonly REQUEST_METHOD_PUT = 'PUT';
        public static readonly REQUEST_METHOD_PATCH = 'PATCH';
        public static readonly REQUEST_METHOD_DELETE = 'DELETE';
        public static readonly REQUEST_METHOD_OPTIONS = 'OPTIONS';
        public static readonly REQUEST_METHOD_HEAD = 'HEAD';

        /**
         * Mode Type
         */
        public static readonly MODE_TYPE_DEVELOPMENT = 'development';
        public static readonly MODE_TYPE_STAGE = 'stage';
        public static readonly MODE_TYPE_PRODUCTION = 'production';

        /**
         * @var resources
         */
        protected resources: Record<string, any> = {
            error: null,
        };

        /**
         * @var resourcesCallbacks
         */
        protected static resourcesCallbacks: Record<string, { callback: Function; injections: string[]; reset: boolean }> = {};

        /**
         * Current running mode
         */
        protected static mode: string = '';

        /**
         * Errors
         * Errors callbacks
         */
        protected static errors: Hook[] = [];

        /**
         * Init
         * A callback function that is initialized on application start
         */
        protected static init: Hook[] = [];

        /**
         * Shutdown
         * A callback function that is initialized on application end
         */
        protected static shutdown: Hook[] = [];

        /**
         * Options
         * A callback function for options method requests
         */
        protected static options: Hook[] = [];

        /**
         * Route
         * Memory cached result for chosen route
         */
        protected route: Route | null = null;

        /**
         * Wildcard route
         * If set, this gets executed if no other route is matched
         */
        protected static wildcardRoute: Route | null = null;

        /**
         * App
         * @param timezone
         */
        constructor(timezone: string) {
            process.env.TZ = timezone;
        }

        /**
         * GET
         * Add GET request route
         * @param url
         * @returns Route
         */
        public static get(url: string): Route {
            return this.addRoute(this.REQUEST_METHOD_GET, url);
        }

        /**
         * POST
         * Add POST request route
         * @param url
         * @returns Route
         */
        public static post(url: string): Route {
            return this.addRoute(this.REQUEST_METHOD_POST, url);
        }

        /**
         * PUT
         * Add PUT request route
         * @param url
         * @returns Route
         */
        public static put(url: string): Route {
            return this.addRoute(this.REQUEST_METHOD_PUT, url);
        }

        /**
         * PATCH
         * Add PATCH request route
         * @param url
         * @returns Route
         */
        public static patch(url: string): Route {
            return this.addRoute(this.REQUEST_METHOD_PATCH, url);
        }

        /**
         * DELETE
         * Add DELETE request route
         * @param url
         * @returns Route
         */
        public static delete(url: string): Route {
            return this.addRoute(this.REQUEST_METHOD_DELETE, url);
        }

        /**
         * Wildcard
         * Add Wildcard route
         * @returns Route
         */
        public static wildcard(): Route {
            this.wildcardRoute = new Route('', '');
            return this.wildcardRoute;
        }

        /**
         * Init
         * Set a callback function that will be initialized on application start
         * @returns Hook
         */
        public static init(): Hook {
            const hook = new Hook();
            hook.groups(['*']);
            this.init.push(hook);
            return hook;
        }

        /**
         * Shutdown
         * Set a callback function that will be initialized on application end
         * @returns Hook
         */
        public static shutdown(): Hook {
            const hook = new Hook();
            hook.groups(['*']);
            this.shutdown.push(hook);
            return hook;
        }

        /**
         * Options
         * Set a callback function for all requests with OPTIONS method
         * @returns Hook
         */
        public static options(): Hook {
            const hook = new Hook();
            hook.groups(['*']);
            this.options.push(hook);
            return hook;
        }

        /**
         * Error
         * An error callback for failed or no matched requests
         * @returns Hook
         */
        public static error(): Hook {
            const hook = new Hook();
            hook.groups(['*']);
            this.errors.push(hook);
            return hook;
        }

        /**
         * Get env var
         * Method for querying environment variables. If key is not found, default value will be returned.
         * @param key
         * @param defaultValue
         * @returns string | null
         */
        public static getEnv(key: string, defaultValue: string | null = null): string | null {
            return process.env[key] ?? defaultValue;
        }

        /**
         * Get Mode
         * Get current mode
         * @returns string
         */
        public static getMode(): string {
            return this.mode;
        }

        /**
         * Set Mode
         * Set current mode
         * @param value
         */
        public static setMode(value: string): void {
            this.mode = value;
        }

        /**
         * Get allow override
         * @returns boolean
         */
        public static getAllowOverride(): boolean {
            return Router.getAllowOverride();
        }

        /**
         * Set Allow override
         * @param value
         */
        public static setAllowOverride(value: boolean): void {
            Router.setAllowOverride(value);
        }

        /**
         * If a resource has been created return it, otherwise create it and then return it
         * @param name
         * @param fresh
         * @returns any
         * @throws Error
         */
        public getResource(name: string, fresh: boolean = false): any {
            if (name === 'utopia') {
                return this;
            }

            if (!(name in this.resources) || fresh || App.resourcesCallbacks[name]?.reset) {
                if (!(name in App.resourcesCallbacks)) {
                    throw new Error(`Failed to find resource: "${name}"`);
                }

                this.resources[name] = App.resourcesCallbacks[name].callback(this.getResources(App.resourcesCallbacks[name].injections));
                App.resourcesCallbacks[name].reset = false;
            }

            return this.resources[name];
        }

        /**
         * Get Resources By List
         * @param list
         * @returns Record<string, any>
         */
        public getResources(list: string[]): Record<string, any> {
            const resources: Record<string, any> = {};

            for (const name of list) {
                resources[name] = this.getResource(name);
            }

            return resources;
        }

        /**
         * Set a new resource callback
         * @param name
         * @param callback
         * @param injections
         * @throws Error
         */
        public static setResource(name: string, callback: Function, injections: string[] = []): void {
            if (name === 'utopia') {
                throw new Error(`'utopia' is a reserved keyword.`);
            }
            this.resourcesCallbacks[name] = { callback, injections, reset: true };
        }

        /**
         * Is app in production mode?
         * @returns boolean
         */
        public static isProduction(): boolean {
            return this.mode === this.MODE_TYPE_PRODUCTION;
        }

        /**
         * Is app in development mode?
         * @returns boolean
         */
        public static isDevelopment(): boolean {
            return this.mode === this.MODE_TYPE_DEVELOPMENT;
        }

        /**
         * Is app in stage mode?
         * @returns boolean
         */
        public static isStage(): boolean {
            return this.mode === this.MODE_TYPE_STAGE;
        }

        /**
         * Get Routes
         * Get all application routes
         * @returns Route[]
         */
        public static getRoutes(): Route[] {
            return Router.getRoutes();
        }

        /**
         * Get the current route
         * @returns Route | null
         */
        public getRoute(): Route | null {
            return this.route ?? null;
        }

        /**
         * Set the current route
         * @param route
         * @returns this
         */
        public setRoute(route: Route): this {
            this.route = route;
            return this;
        }

        /**
         * Add Route
         * Add routing route method, path and callback
         * @param method
         * @param url
         * @returns Route
         */
        public static addRoute(method: string, url: string): Route {
            const route = new Route(method, url);
            Router.addRoute(route);
            return route;
        }

        /**
         * Match
         * Find matching route given current user request
         * @param request
         * @param fresh
         * @returns Route | null
         */
        public match(request: Request, fresh: boolean = false): Route | null {
            if (this.route !== null && !fresh) {
                return this.route;
            }

            const url = new URL(request.getURI()).pathname;
            let method = request.getMethod();
            method = method === App.REQUEST_METHOD_HEAD ? App.REQUEST_METHOD_GET : method;

            this.route = Router.match(method, url);
            return this.route;
        }

        /**
         * Execute a given route with middlewares and error handling
         * @param route
         * @param request
         * @param response
         * @returns this
         */
        public execute(route: Route, request: Request, response: Response): this {
            const argumentsList: any[] = [];
            const groups = route.getGroups();
            const pathValues = route.getPathValues(request);

            try {
                if (route.getHook()) {
                    for (const hook of App.init) { // Global init hooks
                        if (hook.getGroups().includes('*')) {
                            const args = this.getArguments(hook, pathValues, request.getParams());
                            hook.getAction()(...args);
                        }
                    }
                }

                for (const group of groups) {
                    for (const hook of App.init) { // Group init hooks
                        if (hook.getGroups().includes(group)) {
                            const args = this.getArguments(hook, pathValues, request.getParams());
                            hook.getAction()(...args);
                        }
                    }
                }

                if (!response.isSent()) {
                    const args = this.getArguments(route, pathValues, request.getParams());
                    route.getAction()(...args);
                }

                for (const group of groups) {
                    for (const hook of App.shutdown) { // Group shutdown hooks
                        if (hook.getGroups().includes(group)) {
                            const args = this.getArguments(hook, pathValues, request.getParams());
                            hook.getAction()(...args);
                        }
                    }
                }

                if (route.getHook()) {
                    for (const hook of App.shutdown) { // Global shutdown hooks
                        if (hook.getGroups().includes('*')) {
                            const args = this.getArguments(hook, pathValues, request.getParams());
                            hook.getAction()(...args);
                        }
                    }
                }
            } catch (e) {
                App.setResource('error', () => e);

                for (const group of groups) {
                    for (const errorHook of App.errors) { // Group error hooks
                        if (errorHook.getGroups().includes(group)) {
                            try {
                                const args = this.getArguments(errorHook, pathValues, request.getParams());
                                errorHook.getAction()(...args);
                            } catch (error: any) {
                                throw new Error(`Error handler had an error: ${error.message}`);
                            }
                        }
                    }
                }

                for (const errorHook of App.errors) { // Global error hooks
                    if (errorHook.getGroups().includes('*')) {
                        try {
                            const args = this.getArguments(errorHook, pathValues, request.getParams());
                            errorHook.getAction()(...args);
                        } catch (error: any) {
                            throw new Error(`Error handler had an error: ${error.message}`);
                        }
                    }
                }
            }

            return this;
        }

        /**
         * Get Arguments
         * @param hook
         * @param values
         * @param requestParams
         * @returns any[]
         * @throws Error
         */
        protected getArguments(hook: Hook, values: Record<string, any>, requestParams: Record<string, any>): any[] {
            const args: any[] = [];
            for (const [key, param] of Object.entries(hook.getParams())) {
                const typedParam = param as Param; // Type assertion

                const existsInRequest = key in requestParams;
                const existsInValues = key in values;
                const paramExists = existsInRequest || existsInValues;

                let arg;
                if (existsInRequest) {
                    arg = requestParams[key];
                } else {
                    if (typeof typedParam.default !== 'string' && typeof typedParam.default === 'function') {
                        arg = typedParam.default(this.getResources(typedParam.injections));
                    } else {
                        arg = typedParam.default;
                    }
                }

                const value = existsInValues ? values[key] : arg;

                if (!typedParam.skipValidation) {
                    if (!paramExists && !typedParam.optional) {
                        throw new Error(`Param "${key}" is not optional.`);
                    }

                    if (paramExists) {
                        this.validate(key, typedParam, value);
                    }
                }

                hook.setParamValue(key, value);
                args[typedParam.order] = value;
            }

            for (const [key, injection] of Object.entries(hook.getInjections()) as [string, Injection][]) {
                args[injection.order] = this.getResource(injection.name);
            }

            return args;
        }

        /**
         * Run
         * This is the place to initialize any pre-routing logic.
         * This is where you might want to parse the application's current URL by any desired logic
         * @param request
         * @param response
         * @returns this
         */
        public run(request: Request, response: Response): this {
            this.resources['request'] = request;
            this.resources['response'] = response;

            App.setResource('request', () => request);
            App.setResource('response', () => response);

            let method = request.getMethod();
            let route = this.match(request);
            const groups = route instanceof Route ? route.getGroups() : [];

            if (method === App.REQUEST_METHOD_HEAD) {
                method = App.REQUEST_METHOD_GET;
                response.disablePayload();
            }

            if (method === App.REQUEST_METHOD_OPTIONS) {
                try {
                    for (const group of groups) {
                        for (const optionHook of App.options) { // Group options hooks
                            if (optionHook.getGroups().includes(group)) {
                                optionHook.getAction()(...this.getArguments(optionHook, {}, request.getParams()));
                            }
                        }
                    }

                    for (const optionHook of App.options) { // Global options hooks
                        if (optionHook.getGroups().includes('*')) {
                            optionHook.getAction()(...this.getArguments(optionHook, {}, request.getParams()));
                        }
                    }
                } catch (e) {
                    for (const errorHook of App.errors) { // Global error hooks
                        if (errorHook.getGroups().includes('*')) {
                            App.setResource('error', () => e);
                            errorHook.getAction()(...this.getArguments(errorHook, {}, request.getParams()));
                        }
                    }
                }

                return this;
            }

            if (route === null && App.wildcardRoute !== null) {
                route = App.wildcardRoute;
                this.route = route;
                const path = new URL(request.getURI()).pathname;
                route.path(path);
            }

            if (route !== null) {
                return this.execute(route, request, response);
            } else if (method === App.REQUEST_METHOD_OPTIONS) {
                try {
                    for (const group of groups) {
                        for (const optionHook of App.options) { // Group options hooks
                            if (optionHook.getGroups().includes(group)) {
                                optionHook.getAction()(...this.getArguments(optionHook, {}, request.getParams()));
                            }
                        }
                    }

                    for (const optionHook of App.options) { // Global options hooks
                        if (optionHook.getGroups().includes('*')) {
                            optionHook.getAction()(...this.getArguments(optionHook, {}, request.getParams()));
                        }
                    }
                } catch (e) {
                    for (const errorHook of App.errors) { // Global error hooks
                        if (errorHook.getGroups().includes('*')) {
                            App.setResource('error', () => e);
                            errorHook.getAction()(...this.getArguments(errorHook, {}, request.getParams()));
                        }
                    }
                }
            } else {
                for (const errorHook of App.errors) { // Global error hooks
                    if (errorHook.getGroups().includes('*')) {
                        App.setResource('error', () => new Error('Not Found') as any); // Customize error as needed
                        errorHook.getAction()(...this.getArguments(errorHook, {}, request.getParams()));
                    }
                }
            }

            return this;
        }

        /**
         * Validate Param
         * Creates a validator instance and validates the given value with given rules.
         * @param key
         * @param param
         * @param value
         * @throws Error
         */
        protected validate(key: string, param: Param, value: any): void {
            if (param.optional && value === null) {
                return;
            }

            let validator = param.validator;

            if (typeof validator === 'function') {
                validator = validator(this.getResources(param.injections));
            }

            if (!(validator instanceof Validator)) {
                throw new Error('Validator object is not an instance of the Validator class');
            }

            if (!validator.isValid(value)) {
                throw new Error(`Invalid \`${key}\` param: ${validator.getDescription()}`);
            }
        }

        /**
         * Reset all the static variables
         */
        public static reset(): void {
            Router.reset();
            this.resourcesCallbacks = {};
            this.mode = '';
            this.errors = [];
            this.init = [];
            this.shutdown = [];
            this.options = [];
        }
    }

  