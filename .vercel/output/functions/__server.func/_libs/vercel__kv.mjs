import { n as __exportAll } from "../_runtime.mjs";
import { t as require_nodejs } from "./crypto-js+upstash__redis.mjs";
//#region node_modules/@vercel/kv/dist/index.js
var dist_exports = /* @__PURE__ */ __exportAll({
	VercelKV: () => VercelKV,
	createClient: () => createClient,
	kv: () => kv
});
var import_nodejs = require_nodejs();
var _kv = null;
process.env.UPSTASH_DISABLE_TELEMETRY = "1";
var VercelKV = class extends import_nodejs.Redis {
	/**
	* Same as `scan` but returns an AsyncIterator to allow iteration via `for await`.
	*/
	async *scanIterator(options) {
		let cursor = 0;
		let keys;
		do {
			[cursor, keys] = await this.scan(cursor, options);
			for (const key of keys) yield key;
		} while (cursor !== 0);
	}
	/**
	* Same as `hscan` but returns an AsyncIterator to allow iteration via `for await`.
	*/
	async *hscanIterator(key, options) {
		let cursor = 0;
		let items;
		do {
			[cursor, items] = await this.hscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== 0);
	}
	/**
	* Same as `sscan` but returns an AsyncIterator to allow iteration via `for await`.
	*/
	async *sscanIterator(key, options) {
		let cursor = 0;
		let items;
		do {
			[cursor, items] = await this.sscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== 0);
	}
	/**
	* Same as `zscan` but returns an AsyncIterator to allow iteration via `for await`.
	*/
	async *zscanIterator(key, options) {
		let cursor = 0;
		let items;
		do {
			[cursor, items] = await this.zscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== 0);
	}
};
function createClient(config) {
	return new VercelKV({
		cache: "default",
		...config
	});
}
new Proxy({}, { get(target, prop, receiver) {
	if (prop === "then" || prop === "parse") return Reflect.get(target, prop, receiver);
	if (!_kv) {
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new Error("@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN");
		console.warn("\x1B[33m\"The default export has been moved to a named export and it will be removed in version 1, change to import { kv }\x1B[0m\"");
		_kv = createClient({
			url: process.env.KV_REST_API_URL,
			token: process.env.KV_REST_API_TOKEN
		});
	}
	return Reflect.get(_kv, prop);
} });
var kv = new Proxy({}, { get(target, prop) {
	if (!_kv) {
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new Error("@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN");
		_kv = createClient({
			url: process.env.KV_REST_API_URL,
			token: process.env.KV_REST_API_TOKEN
		});
	}
	return Reflect.get(_kv, prop);
} });
//#endregion
export { dist_exports as t };
