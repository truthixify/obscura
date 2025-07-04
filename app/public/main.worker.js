/*! For license information please see main.worker.js.LICENSE.txt */
var __webpack_modules__ = {
    19: (module, exports) => {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        var browser$1 = {
            exports: {}
        };
        var process = browser$1.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
            throw new Error("setTimeout has not been defined");
        }
        function defaultClearTimeout() {
            throw new Error("clearTimeout has not been defined");
        }
        (function() {
            try {
                if (typeof setTimeout === "function") {
                    cachedSetTimeout = setTimeout;
                } else {
                    cachedSetTimeout = defaultSetTimout;
                }
            } catch (e) {
                cachedSetTimeout = defaultSetTimout;
            }
            try {
                if (typeof clearTimeout === "function") {
                    cachedClearTimeout = clearTimeout;
                } else {
                    cachedClearTimeout = defaultClearTimeout;
                }
            } catch (e) {
                cachedClearTimeout = defaultClearTimeout;
            }
        })();
        function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
                return setTimeout(fun, 0);
            }
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                cachedSetTimeout = setTimeout;
                return setTimeout(fun, 0);
            }
            try {
                return cachedSetTimeout(fun, 0);
            } catch (e) {
                try {
                    return cachedSetTimeout.call(null, fun, 0);
                } catch (e) {
                    return cachedSetTimeout.call(this, fun, 0);
                }
            }
        }
        function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
                return clearTimeout(marker);
            }
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                cachedClearTimeout = clearTimeout;
                return clearTimeout(marker);
            }
            try {
                return cachedClearTimeout(marker);
            } catch (e) {
                try {
                    return cachedClearTimeout.call(null, marker);
                } catch (e) {
                    return cachedClearTimeout.call(this, marker);
                }
            }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
            if (!draining || !currentQueue) {
                return;
            }
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }
        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;
            var len = queue.length;
            while (len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                runTimeout(drainQueue);
            }
        };
        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function() {
            this.fun.apply(null, this.array);
        };
        process.title = "browser";
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = "";
        process.versions = {};
        function noop$1() {}
        process.on = noop$1;
        process.addListener = noop$1;
        process.once = noop$1;
        process.off = noop$1;
        process.removeListener = noop$1;
        process.removeAllListeners = noop$1;
        process.emit = noop$1;
        process.prependListener = noop$1;
        process.prependOnceListener = noop$1;
        process.listeners = function(name) {
            return [];
        };
        process.binding = function(name) {
            throw new Error("process.binding is not supported");
        };
        process.cwd = function() {
            return "/";
        };
        process.chdir = function(dir) {
            throw new Error("process.chdir is not supported");
        };
        process.umask = function() {
            return 0;
        };
        function noop() {}
        var browser = browser$1.exports.browser;
        var emitWarning = noop;
        var binding = browser$1.exports.binding;
        var exit = noop;
        var pid = 1;
        var features = {};
        var kill = noop;
        var dlopen = noop;
        var uptime = noop;
        var memoryUsage = noop;
        var uvCounters = noop;
        var platform = "browser";
        var arch = "browser";
        var execPath = "browser";
        var execArgv = [];
        var api = {
            nextTick: browser$1.exports.nextTick,
            title: browser$1.exports.title,
            browser,
            env: browser$1.exports.env,
            argv: browser$1.exports.argv,
            version: browser$1.exports.version,
            versions: browser$1.exports.versions,
            on: browser$1.exports.on,
            addListener: browser$1.exports.addListener,
            once: browser$1.exports.once,
            off: browser$1.exports.off,
            removeListener: browser$1.exports.removeListener,
            removeAllListeners: browser$1.exports.removeAllListeners,
            emit: browser$1.exports.emit,
            emitWarning,
            prependListener: browser$1.exports.prependListener,
            prependOnceListener: browser$1.exports.prependOnceListener,
            listeners: browser$1.exports.listeners,
            binding,
            cwd: browser$1.exports.cwd,
            chdir: browser$1.exports.chdir,
            umask: browser$1.exports.umask,
            exit,
            pid,
            features,
            kill,
            dlopen,
            uptime,
            memoryUsage,
            uvCounters,
            platform,
            arch,
            execPath,
            execArgv
        };
        exports.addListener = browser$1.exports.addListener;
        exports.arch = arch;
        exports.argv = browser$1.exports.argv;
        exports.binding = binding;
        exports.browser = browser;
        exports.chdir = browser$1.exports.chdir;
        exports.cwd = browser$1.exports.cwd;
        exports["default"] = api;
        exports.dlopen = dlopen;
        exports.emit = browser$1.exports.emit;
        exports.emitWarning = emitWarning;
        exports.env = browser$1.exports.env;
        exports.execArgv = execArgv;
        exports.execPath = execPath;
        exports.exit = exit;
        exports.features = features;
        exports.kill = kill;
        exports.listeners = browser$1.exports.listeners;
        exports.memoryUsage = memoryUsage;
        exports.nextTick = browser$1.exports.nextTick;
        exports.off = browser$1.exports.off;
        exports.on = browser$1.exports.on;
        exports.once = browser$1.exports.once;
        exports.pid = pid;
        exports.platform = platform;
        exports.prependListener = browser$1.exports.prependListener;
        exports.prependOnceListener = browser$1.exports.prependOnceListener;
        exports.removeAllListeners = browser$1.exports.removeAllListeners;
        exports.removeListener = browser$1.exports.removeListener;
        exports.title = browser$1.exports.title;
        exports.umask = browser$1.exports.umask;
        exports.uptime = uptime;
        exports.uvCounters = uvCounters;
        exports.version = browser$1.exports.version;
        exports.versions = browser$1.exports.versions;
        exports = module.exports = api;
    },
    585: module => {
        var s = 1e3;
        var m = s * 60;
        var h = m * 60;
        var d = h * 24;
        var w = d * 7;
        var y = d * 365.25;
        module.exports = function(val, options) {
            options = options || {};
            var type = typeof val;
            if (type === "string" && val.length > 0) {
                return parse(val);
            } else if (type === "number" && isFinite(val)) {
                return options.long ? fmtLong(val) : fmtShort(val);
            }
            throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
        };
        function parse(str) {
            str = String(str);
            if (str.length > 100) {
                return;
            }
            var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
            if (!match) {
                return;
            }
            var n = parseFloat(match[1]);
            var type = (match[2] || "ms").toLowerCase();
            switch (type) {
              case "years":
              case "year":
              case "yrs":
              case "yr":
              case "y":
                return n * y;

              case "weeks":
              case "week":
              case "w":
                return n * w;

              case "days":
              case "day":
              case "d":
                return n * d;

              case "hours":
              case "hour":
              case "hrs":
              case "hr":
              case "h":
                return n * h;

              case "minutes":
              case "minute":
              case "mins":
              case "min":
              case "m":
                return n * m;

              case "seconds":
              case "second":
              case "secs":
              case "sec":
              case "s":
                return n * s;

              case "milliseconds":
              case "millisecond":
              case "msecs":
              case "msec":
              case "ms":
                return n;

              default:
                return undefined;
            }
        }
        function fmtShort(ms) {
            var msAbs = Math.abs(ms);
            if (msAbs >= d) {
                return Math.round(ms / d) + "d";
            }
            if (msAbs >= h) {
                return Math.round(ms / h) + "h";
            }
            if (msAbs >= m) {
                return Math.round(ms / m) + "m";
            }
            if (msAbs >= s) {
                return Math.round(ms / s) + "s";
            }
            return ms + "ms";
        }
        function fmtLong(ms) {
            var msAbs = Math.abs(ms);
            if (msAbs >= d) {
                return plural(ms, msAbs, d, "day");
            }
            if (msAbs >= h) {
                return plural(ms, msAbs, h, "hour");
            }
            if (msAbs >= m) {
                return plural(ms, msAbs, m, "minute");
            }
            if (msAbs >= s) {
                return plural(ms, msAbs, s, "second");
            }
            return ms + " ms";
        }
        function plural(ms, msAbs, n, name) {
            var isPlural = msAbs >= n * 1.5;
            return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
        }
    },
    736: (module, __unused_webpack_exports, __webpack_require__) => {
        function setup(env) {
            createDebug.debug = createDebug;
            createDebug.default = createDebug;
            createDebug.coerce = coerce;
            createDebug.disable = disable;
            createDebug.enable = enable;
            createDebug.enabled = enabled;
            createDebug.humanize = __webpack_require__(585);
            createDebug.destroy = destroy;
            Object.keys(env).forEach((key => {
                createDebug[key] = env[key];
            }));
            createDebug.names = [];
            createDebug.skips = [];
            createDebug.formatters = {};
            function selectColor(namespace) {
                let hash = 0;
                for (let i = 0; i < namespace.length; i++) {
                    hash = (hash << 5) - hash + namespace.charCodeAt(i);
                    hash |= 0;
                }
                return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
            }
            createDebug.selectColor = selectColor;
            function createDebug(namespace) {
                let prevTime;
                let enableOverride = null;
                let namespacesCache;
                let enabledCache;
                function debug(...args) {
                    if (!debug.enabled) {
                        return;
                    }
                    const self = debug;
                    const curr = Number(new Date);
                    const ms = curr - (prevTime || curr);
                    self.diff = ms;
                    self.prev = prevTime;
                    self.curr = curr;
                    prevTime = curr;
                    args[0] = createDebug.coerce(args[0]);
                    if (typeof args[0] !== "string") {
                        args.unshift("%O");
                    }
                    let index = 0;
                    args[0] = args[0].replace(/%([a-zA-Z%])/g, ((match, format) => {
                        if (match === "%%") {
                            return "%";
                        }
                        index++;
                        const formatter = createDebug.formatters[format];
                        if (typeof formatter === "function") {
                            const val = args[index];
                            match = formatter.call(self, val);
                            args.splice(index, 1);
                            index--;
                        }
                        return match;
                    }));
                    createDebug.formatArgs.call(self, args);
                    const logFn = self.log || createDebug.log;
                    logFn.apply(self, args);
                }
                debug.namespace = namespace;
                debug.useColors = createDebug.useColors();
                debug.color = createDebug.selectColor(namespace);
                debug.extend = extend;
                debug.destroy = createDebug.destroy;
                Object.defineProperty(debug, "enabled", {
                    enumerable: true,
                    configurable: false,
                    get: () => {
                        if (enableOverride !== null) {
                            return enableOverride;
                        }
                        if (namespacesCache !== createDebug.namespaces) {
                            namespacesCache = createDebug.namespaces;
                            enabledCache = createDebug.enabled(namespace);
                        }
                        return enabledCache;
                    },
                    set: v => {
                        enableOverride = v;
                    }
                });
                if (typeof createDebug.init === "function") {
                    createDebug.init(debug);
                }
                return debug;
            }
            function extend(namespace, delimiter) {
                const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
                newDebug.log = this.log;
                return newDebug;
            }
            function enable(namespaces) {
                createDebug.save(namespaces);
                createDebug.namespaces = namespaces;
                createDebug.names = [];
                createDebug.skips = [];
                let i;
                const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
                const len = split.length;
                for (i = 0; i < len; i++) {
                    if (!split[i]) {
                        continue;
                    }
                    namespaces = split[i].replace(/\*/g, ".*?");
                    if (namespaces[0] === "-") {
                        createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
                    } else {
                        createDebug.names.push(new RegExp("^" + namespaces + "$"));
                    }
                }
            }
            function disable() {
                const namespaces = [ ...createDebug.names.map(toNamespace), ...createDebug.skips.map(toNamespace).map((namespace => "-" + namespace)) ].join(",");
                createDebug.enable("");
                return namespaces;
            }
            function enabled(name) {
                if (name[name.length - 1] === "*") {
                    return true;
                }
                let i;
                let len;
                for (i = 0, len = createDebug.skips.length; i < len; i++) {
                    if (createDebug.skips[i].test(name)) {
                        return false;
                    }
                }
                for (i = 0, len = createDebug.names.length; i < len; i++) {
                    if (createDebug.names[i].test(name)) {
                        return true;
                    }
                }
                return false;
            }
            function toNamespace(regexp) {
                return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
            }
            function coerce(val) {
                if (val instanceof Error) {
                    return val.stack || val.message;
                }
                return val;
            }
            function destroy() {
                console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
            }
            createDebug.enable(createDebug.load());
            return createDebug;
        }
        module.exports = setup;
    },
    833: (module, exports, __webpack_require__) => {
        var process = __webpack_require__(19);
        exports.formatArgs = formatArgs;
        exports.save = save;
        exports.load = load;
        exports.useColors = useColors;
        exports.storage = localstorage();
        exports.destroy = (() => {
            let warned = false;
            return () => {
                if (!warned) {
                    warned = true;
                    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
                }
            };
        })();
        exports.colors = [ "#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33" ];
        function useColors() {
            if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
                return true;
            }
            if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
                return false;
            }
            return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
        }
        function formatArgs(args) {
            args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
            if (!this.useColors) {
                return;
            }
            const c = "color: " + this.color;
            args.splice(1, 0, c, "color: inherit");
            let index = 0;
            let lastC = 0;
            args[0].replace(/%[a-zA-Z%]/g, (match => {
                if (match === "%%") {
                    return;
                }
                index++;
                if (match === "%c") {
                    lastC = index;
                }
            }));
            args.splice(lastC, 0, c);
        }
        exports.log = console.debug || console.log || (() => {});
        function save(namespaces) {
            try {
                if (namespaces) {
                    exports.storage.setItem("debug", namespaces);
                } else {
                    exports.storage.removeItem("debug");
                }
            } catch (error) {}
        }
        function load() {
            let r;
            try {
                r = exports.storage.getItem("debug");
            } catch (error) {}
            if (!r && typeof process !== "undefined" && "env" in process) {
                r = process.env.DEBUG;
            }
            return r;
        }
        function localstorage() {
            try {
                return localStorage;
            } catch (error) {}
        }
        module.exports = __webpack_require__(736)(exports);
        const {formatters} = module.exports;
        formatters.j = function(v) {
            try {
                return JSON.stringify(v);
            } catch (error) {
                return "[UnexpectedJSONParseError]: " + error.message;
            }
        };
    }
};

var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
        return cachedModule.exports;
    }
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}

(() => {
    __webpack_require__.n = module => {
        var getter = module && module.__esModule ? () => module["default"] : () => module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();

(() => {
    __webpack_require__.d = (exports, definition) => {
        for (var key in definition) {
            if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                Object.defineProperty(exports, key, {
                    enumerable: true,
                    get: definition[key]
                });
            }
        }
    };
})();

(() => {
    __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
})();

var __webpack_exports__ = {};

const proxyMarker = Symbol("Comlink.proxy");

const createEndpoint = Symbol("Comlink.endpoint");

const releaseProxy = Symbol("Comlink.releaseProxy");

const finalizer = Symbol("Comlink.finalizer");

const throwMarker = Symbol("Comlink.thrown");

const isObject = val => typeof val === "object" && val !== null || typeof val === "function";

const proxyTransferHandler = {
    canHandle: val => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const {port1, port2} = new MessageChannel;
        expose(obj, port1);
        return [ port2, [ port2 ] ];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    }
};

const throwTransferHandler = {
    canHandle: value => isObject(value) && throwMarker in value,
    serialize({value}) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack
                }
            };
        } else {
            serialized = {
                isError: false,
                value
            };
        }
        return [ serialized, [] ];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    }
};

const transferHandlers = new Map([ [ "proxy", proxyTransferHandler ], [ "throw", throwTransferHandler ] ]);

function isAllowedOrigin(allowedOrigins, origin) {
    for (const allowedOrigin of allowedOrigins) {
        if (origin === allowedOrigin || allowedOrigin === "*") {
            return true;
        }
        if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
            return true;
        }
    }
    return false;
}

function expose(obj, ep = globalThis, allowedOrigins = [ "*" ]) {
    ep.addEventListener("message", (function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
            console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
            return;
        }
        const {id, type, path} = Object.assign({
            path: []
        }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce(((obj, prop) => obj[prop]), obj);
            const rawValue = path.reduce(((obj, prop) => obj[prop]), obj);
            switch (type) {
              case "GET":
                {
                    returnValue = rawValue;
                }
                break;

              case "SET":
                {
                    parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                    returnValue = true;
                }
                break;

              case "APPLY":
                {
                    returnValue = rawValue.apply(parent, argumentList);
                }
                break;

              case "CONSTRUCT":
                {
                    const value = new rawValue(...argumentList);
                    returnValue = proxy(value);
                }
                break;

              case "ENDPOINT":
                {
                    const {port1, port2} = new MessageChannel;
                    expose(obj, port2);
                    returnValue = transfer(port1, [ port1 ]);
                }
                break;

              case "RELEASE":
                {
                    returnValue = undefined;
                }
                break;

              default:
                return;
            }
        } catch (value) {
            returnValue = {
                value,
                [throwMarker]: 0
            };
        }
        Promise.resolve(returnValue).catch((value => ({
            value,
            [throwMarker]: 0
        }))).then((returnValue => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), {
                id
            }), transferables);
            if (type === "RELEASE") {
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
                if (finalizer in obj && typeof obj[finalizer] === "function") {
                    obj[finalizer]();
                }
            }
        })).catch((error => {
            const [wireValue, transferables] = toWireValue({
                value: new TypeError("Unserializable return value"),
                [throwMarker]: 0
            });
            ep.postMessage(Object.assign(Object.assign({}, wireValue), {
                id
            }), transferables);
        }));
    }));
    if (ep.start) {
        ep.start();
    }
}

function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}

function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint)) endpoint.close();
}

function wrap(ep, target) {
    return createProxy(ep, [], target);
}

function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}

function releaseEndpoint(ep) {
    return requestResponseMessage(ep, {
        type: "RELEASE"
    }).then((() => {
        closeEndPoint(ep);
    }));
}

const proxyCounter = new WeakMap;

const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep => {
    const newCount = (proxyCounter.get(ep) || 0) - 1;
    proxyCounter.set(ep, newCount);
    if (newCount === 0) {
        releaseEndpoint(ep);
    }
}));

function registerProxy(proxy, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, ep, proxy);
    }
}

function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}

function createProxy(ep, path = [], target = function() {}) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return {
                        then: () => proxy
                    };
                }
                const r = requestResponseMessage(ep, {
                    type: "GET",
                    path: path.map((p => p.toString()))
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [ ...path, prop ]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: "SET",
                path: [ ...path, prop ].map((p => p.toString())),
                value
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: "ENDPOINT"
                }).then(fromWireValue);
            }
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "APPLY",
                path: path.map((p => p.toString())),
                argumentList
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "CONSTRUCT",
                path: path.map((p => p.toString())),
                argumentList
            }, transferables).then(fromWireValue);
        }
    });
    registerProxy(proxy, ep);
    return proxy;
}

function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}

function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [ processed.map((v => v[0])), myFlat(processed.map((v => v[1]))) ];
}

const transferCache = new WeakMap;

function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}

function proxy(obj) {
    return Object.assign(obj, {
        [proxyMarker]: true
    });
}

function windowEndpoint(w, context = globalThis, targetOrigin = "*") {
    return {
        postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
        addEventListener: context.addEventListener.bind(context),
        removeEventListener: context.removeEventListener.bind(context)
    };
}

function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [ {
                type: "HANDLER",
                name,
                value: serializedValue
            }, transferables ];
        }
    }
    return [ {
        type: "RAW",
        value
    }, transferCache.get(value) || [] ];
}

function fromWireValue(value) {
    switch (value.type) {
      case "HANDLER":
        return transferHandlers.get(value.name).deserialize(value.value);

      case "RAW":
        return value.value;
    }
}

function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve => {
        const id = generateUUID();
        ep.addEventListener("message", (function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        }));
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({
            id
        }, msg), transfers);
    }));
}

function generateUUID() {
    return new Array(4).fill(0).map((() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))).join("-");
}

var browser = __webpack_require__(833);

var browser_default = __webpack_require__.n(browser);

function getSharedMemoryAvailable() {
    const globalScope = typeof window !== "undefined" ? window : globalThis;
    return typeof SharedArrayBuffer !== "undefined" && globalScope.crossOriginIsolated;
}

function getRemoteBarretenbergWasm(worker) {
    return wrap(worker);
}

function getNumCpu() {
    return navigator.hardwareConcurrency;
}

function threadLogger() {
    return console.log;
}

function killSelf() {
    self.close();
}

const Ready = {
    ready: true
};

function readinessListener(worker, callback) {
    worker.addEventListener("message", (function ready(event) {
        if (!!event.data && event.data.ready === true) {
            worker.removeEventListener("message", ready);
            callback();
        }
    }));
}

async function createThreadWorker() {
    const worker = new Worker(new URL("./thread.worker.js", import.meta.url), {
        type: "module"
    });
    const debugStr = browser_default().disable();
    browser_default().enable(debugStr);
    worker.postMessage({
        debug: debugStr
    });
    await new Promise((resolve => readinessListener(worker, resolve)));
    return worker;
}

const randomBytes = len => {
    const getWebCrypto = () => {
        if (typeof window !== "undefined" && window.crypto) return window.crypto;
        if (typeof globalThis !== "undefined" && globalThis.crypto) return globalThis.crypto;
        return undefined;
    };
    const crypto = getWebCrypto();
    if (!crypto) {
        throw new Error("randomBytes UnsupportedEnvironment");
    }
    const buf = new Uint8Array(len);
    const MAX_BYTES = 65536;
    if (len > MAX_BYTES) {
        for (let generated = 0; generated < len; generated += MAX_BYTES) {
            crypto.getRandomValues(buf.subarray(generated, generated + MAX_BYTES));
        }
    } else {
        crypto.getRandomValues(buf);
    }
    return buf;
};

class BarretenbergWasmBase {
    constructor() {
        this.memStore = {};
        this.logger = browser_default()("bb.js:bb_wasm_base");
    }
    getImportObj(memory) {
        const importObj = {
            wasi_snapshot_preview1: {
                random_get: (out, length) => {
                    out = out >>> 0;
                    const randomData = randomBytes(length);
                    const mem = this.getMemory();
                    mem.set(randomData, out);
                },
                clock_time_get: (a1, a2, out) => {
                    out = out >>> 0;
                    const ts = BigInt((new Date).getTime()) * 1000000n;
                    const view = new DataView(this.getMemory().buffer);
                    view.setBigUint64(out, ts, true);
                },
                proc_exit: () => {
                    this.logger("PANIC: proc_exit was called.");
                    throw new Error;
                }
            },
            env: {
                logstr: addr => {
                    const str = this.stringFromAddress(addr);
                    const m = this.getMemory();
                    const str2 = `${str} (mem: ${(m.length / (1024 * 1024)).toFixed(2)}MiB)`;
                    this.logger(str2);
                },
                get_data: (keyAddr, outBufAddr) => {
                    const key = this.stringFromAddress(keyAddr);
                    outBufAddr = outBufAddr >>> 0;
                    const data = this.memStore[key];
                    if (!data) {
                        this.logger(`get_data miss ${key}`);
                        return;
                    }
                    this.writeMemory(outBufAddr, data);
                },
                set_data: (keyAddr, dataAddr, dataLength) => {
                    const key = this.stringFromAddress(keyAddr);
                    dataAddr = dataAddr >>> 0;
                    this.memStore[key] = this.getMemorySlice(dataAddr, dataAddr + dataLength);
                },
                memory
            }
        };
        return importObj;
    }
    exports() {
        return this.instance.exports;
    }
    call(name, ...args) {
        if (!this.exports()[name]) {
            throw new Error(`WASM function ${name} not found.`);
        }
        try {
            return this.exports()[name](...args) >>> 0;
        } catch (err) {
            const message = `WASM function ${name} aborted, error: ${err}`;
            this.logger(message);
            this.logger(err.stack);
            throw err;
        }
    }
    memSize() {
        return this.getMemory().length;
    }
    getMemorySlice(start, end) {
        return this.getMemory().subarray(start, end).slice();
    }
    writeMemory(offset, arr) {
        const mem = this.getMemory();
        mem.set(arr, offset);
    }
    getMemory() {
        return new Uint8Array(this.memory.buffer);
    }
    stringFromAddress(addr) {
        addr = addr >>> 0;
        const m = this.getMemory();
        let i = addr;
        for (;m[i] !== 0; ++i) ;
        const textDecoder = new TextDecoder("ascii");
        return textDecoder.decode(m.slice(addr, i));
    }
}

class HeapAllocator {
    constructor(wasm) {
        this.wasm = wasm;
        this.allocs = [];
        this.inScratchRemaining = 1024;
        this.outScratchRemaining = 1024;
    }
    getInputs(buffers) {
        return buffers.map((bufOrNum => {
            if (typeof bufOrNum === "object") {
                if (bufOrNum.length <= this.inScratchRemaining) {
                    const ptr = this.inScratchRemaining -= bufOrNum.length;
                    this.wasm.writeMemory(ptr, bufOrNum);
                    return ptr;
                } else {
                    const ptr = this.wasm.call("bbmalloc", bufOrNum.length);
                    this.wasm.writeMemory(ptr, bufOrNum);
                    this.allocs.push(ptr);
                    return ptr;
                }
            } else {
                return bufOrNum;
            }
        }));
    }
    getOutputPtrs(outLens) {
        return outLens.map((len => {
            const size = len || 4;
            if (size <= this.outScratchRemaining) {
                return this.outScratchRemaining -= size;
            } else {
                const ptr = this.wasm.call("bbmalloc", size);
                this.allocs.push(ptr);
                return ptr;
            }
        }));
    }
    addOutputPtr(ptr) {
        if (ptr >= 1024) {
            this.allocs.push(ptr);
        }
    }
    freeAll() {
        for (const ptr of this.allocs) {
            this.wasm.call("bbfree", ptr);
        }
    }
}

class BarretenbergWasmMain extends BarretenbergWasmBase {
    constructor() {
        super(...arguments);
        this.workers = [];
        this.remoteWasms = [];
        this.nextWorker = 0;
        this.nextThreadId = 1;
    }
    getNumThreads() {
        return this.workers.length + 1;
    }
    async init(module, threads = Math.min(getNumCpu(), BarretenbergWasmMain.MAX_THREADS), logger = browser_default()("bb.js:bb_wasm"), initial = 32, maximum = 2 ** 16) {
        this.logger = logger;
        const initialMb = initial * 2 ** 16 / (1024 * 1024);
        const maxMb = maximum * 2 ** 16 / (1024 * 1024);
        const shared = getSharedMemoryAvailable();
        this.logger(`Initializing bb wasm: initial memory ${initial} pages ${initialMb}MiB; ` + `max memory: ${maximum} pages, ${maxMb}MiB; ` + `threads: ${threads}; shared memory: ${shared}`);
        this.memory = new WebAssembly.Memory({
            initial,
            maximum,
            shared
        });
        const instance = await WebAssembly.instantiate(module, this.getImportObj(this.memory));
        this.instance = instance;
        this.call("_initialize");
        if (threads > 1) {
            this.logger(`Creating ${threads} worker threads`);
            this.workers = await Promise.all(Array.from({
                length: threads - 1
            }).map(createThreadWorker));
            this.remoteWasms = await Promise.all(this.workers.map(getRemoteBarretenbergWasm));
            await Promise.all(this.remoteWasms.map((w => w.initThread(module, this.memory))));
        }
    }
    async destroy() {
        await Promise.all(this.workers.map((w => w.terminate())));
    }
    getImportObj(memory) {
        const baseImports = super.getImportObj(memory);
        return {
            ...baseImports,
            wasi: {
                "thread-spawn": arg => {
                    arg = arg >>> 0;
                    const id = this.nextThreadId++;
                    const worker = this.nextWorker++ % this.remoteWasms.length;
                    this.remoteWasms[worker].call("wasi_thread_start", id, arg).catch(this.logger);
                    return id;
                }
            },
            env: {
                ...baseImports.env,
                env_hardware_concurrency: () => this.remoteWasms.length + 1
            }
        };
    }
    callWasmExport(funcName, inArgs, outLens) {
        const alloc = new HeapAllocator(this);
        const inPtrs = alloc.getInputs(inArgs);
        const outPtrs = alloc.getOutputPtrs(outLens);
        this.call(funcName, ...inPtrs, ...outPtrs);
        const outArgs = this.getOutputArgs(outLens, outPtrs, alloc);
        alloc.freeAll();
        return outArgs;
    }
    getOutputArgs(outLens, outPtrs, alloc) {
        return outLens.map(((len, i) => {
            if (len) {
                return this.getMemorySlice(outPtrs[i], outPtrs[i] + len);
            }
            const slice = this.getMemorySlice(outPtrs[i], outPtrs[i] + 4);
            const ptr = new DataView(slice.buffer, slice.byteOffset, slice.byteLength).getUint32(0, true);
            alloc.addOutputPtr(ptr);
            const lslice = this.getMemorySlice(ptr, ptr + 4);
            const length = new DataView(lslice.buffer, lslice.byteOffset, lslice.byteLength).getUint32(0, false);
            return this.getMemorySlice(ptr + 4, ptr + 4 + length);
        }));
    }
}

BarretenbergWasmMain.MAX_THREADS = 32;

addEventListener("message", (e => {
    if (e.data.debug) {
        browser_default().enable(e.data.debug);
    }
}));

expose(new BarretenbergWasmMain);

postMessage(Ready);