(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    class Extension {
        constructor(key, name, type) {
            this.version = 1;
            this.baseUrl = "";
            this.categoryList = [];
            this.searchList = [];
            this.configParams = [];
            this.forceConfig = false;
            this.forceLogin = false;
            this.loginParams = [];
            this.script = [];
            this.lang = "en";
            this.author = "memio";
            this.key = key;
            this.name = name;
            this.type = type;
            this.script.push(new SiteUrl("jquery", ""));
        }
    }
    class SiteUrl {
        constructor(name, url) {
            this.name = name;
            this.url = url;
        }
    }
    class ExtensionAuth {
        constructor() {
            this.headers = [];
        }
    }
    class ExtensionList {
        constructor(items, page, nextPage) {
            this.page = 1;
            this.items = items;
            this.page = page;
            this.nextPageUrl = nextPage;
        }
    }
    class ExtensionDetail {
        constructor(id, url, title) {
            this.type = 0 /* MediaType.Undefined */;
            this.hasChapter = false;
            this.url = url;
            this.id = id;
            this.title = title;
        }
    }
    class ExtensionMedia {
        constructor(mediaType, id, title) {
            this.mediaType = mediaType;
            this.id = id;
            this.title = title;
        }
    }
    class ArticleMedia extends ExtensionMedia {
        constructor(id, title, content) {
            super(1 /* MediaType.Article */, id, title);
            this.isMarkdown = false;
            this.content = content;
        }
    }

    class RequestResponse {
        constructor(statusCode, headers, body) {
            this.statusCode = statusCode;
            this.headers = headers;
            this.body = body;
        }
    }

    const u = typeof window !== "undefined" ? window.navigator.userAgent : "Android";
    const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1; //android终端
    const isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    function getDevice() {
        if (isAndroid)
            return "android";
        if (isIOS)
            return "ios";
    }
    const jsbridge = function (callback) {
        if (getDevice() === "android") {
            if (window.MemoWebViewJavascriptBridge) {
                return callback(window.MemoWebViewJavascriptBridge);
            }
            else {
                document.addEventListener("WebViewJavascriptBridgeReady", function () {
                    callback(window.MemoWebViewJavascriptBridge);
                }, false);
            }
        }
        else if (getDevice() === "ios") {
            // new ios method ---> for WKWebview
            if (window.MemoWebViewJavascriptBridge) {
                window.MemoWebViewJavascriptBridge.callbackWithRequest = function (data) {
                    window.webkit.messageHandlers.callbackWithRequest.postMessage(data);
                };
                window.MemoWebViewJavascriptBridge.request = function (option) {
                    window.webkit.messageHandlers.request.postMessage(option);
                    //TODO extra bridge method for ios to get response
                    return "";
                };
                return callback(window.MemoWebViewJavascriptBridge);
            }
        }
    };

    function sleep(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }
    class NativeRequestClient {
        constructor(bridge) {
            this.bridge = bridge;
            this.responseData = new Map();
        }
        reveiveResponse(key, response) {
            console.log("reveive key", key);
            this.responseData.set(key, response);
        }
        request(option) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    this.bridge.request(JSON.stringify(option), (key) => __awaiter(this, void 0, void 0, function* () {
                        this.responseData.delete(key);
                        // waiting for native response, 45s timeout
                        let maxCount = 30;
                        let count = 0;
                        console.log("wait key", key);
                        while (count < maxCount) {
                            console.log("waiting for response", count);
                            yield sleep(1500);
                            const response = this.responseData.get(key);
                            if (response) {
                                this.responseData.delete(key);
                                resolve(response);
                                count = maxCount;
                                return;
                            }
                            count++;
                        }
                        this.responseData.delete(key);
                        resolve(new RequestResponse(500, [], ''));
                    }));
                });
            });
        }
    }
    class NativeBridge {
        constructor(rule) {
            this.rule = rule;
            let nativeRequestClient = new NativeRequestClient(this);
            rule.setRequestClient(nativeRequestClient);
            this.registerNativeHandler(nativeRequestClient);
        }
        registerNativeHandler(client) {
            const nativeBridge = this;
            jsbridge((bridge) => {
                bridge.provideExtensionInfo = function () {
                    let siteInfo = nativeBridge.provideExtensionInfo();
                    let json = JSON.stringify(siteInfo);
                    return json;
                };
                bridge.requestItemList = function (json) {
                    let param = JSON.parse(decodeURIComponent(json));
                    var result = nativeBridge.requestItemList(param.url, param.page);
                    result.then((itemList) => {
                        let s = JSON.stringify(itemList);
                        nativeBridge.callbackWithRequest({ name: "requestItemList", data: s });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "requestItemList", data: error.message, error: true });
                    });
                };
                bridge.searchItemList = function (json) {
                    /// data from native
                    let param = JSON.parse(decodeURIComponent(json));
                    let result = nativeBridge.searchItemList(param.keyword, param.url, param.page);
                    result.then((itemList) => {
                        let s = JSON.stringify(itemList);
                        /// response to native
                        nativeBridge.callbackWithRequest({ name: "searchItemList", data: s });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "searchItemList", data: error.message, error: true });
                    });
                };
                bridge.requestChannelList = function (json) {
                    /// data from native
                    let param = JSON.parse(decodeURIComponent(json));
                    let result = nativeBridge.requestChannelList(param.key, param.page);
                    result.then((itemList) => {
                        let s = JSON.stringify(itemList);
                        /// response to native
                        nativeBridge.callbackWithRequest({ name: "requestChannelList", data: s });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "requestChannelList", data: error.message, error: true });
                    });
                };
                bridge.requestItemChapter = function (json) {
                    /// data from native
                    let param = JSON.parse(decodeURIComponent(json));
                    let result = nativeBridge.requestItemChapter(param.url, param.id);
                    result.then((chapters) => {
                        let s = JSON.stringify(chapters);
                        /// response to native
                        nativeBridge.callbackWithRequest({ name: "requestItemChapter", data: s });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "requestItemChapter", data: error.message, error: true });
                    });
                };
                bridge.requestItemMedia = function (json) {
                    /// data from native
                    let param = JSON.parse(decodeURIComponent(json));
                    let result = nativeBridge.requestItemMedia(param.url, param.id);
                    result.then((media) => {
                        let s = JSON.stringify(media);
                        /// response to native
                        nativeBridge.callbackWithRequest({ name: "requestItemMedia", data: s });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "requestItemMedia", data: error.message, error: true });
                    });
                };
                bridge.loginForm = function (json) {
                    let param = JSON.parse(decodeURIComponent(json));
                    let map = new Map();
                    for (var value in param) {
                        map.set(value, param[value]);
                    }
                    /// data from native
                    let result = nativeBridge.loginForm(map);
                    result.then((token) => {
                        /// response to native
                        var auth = JSON.stringify(token);
                        nativeBridge.callbackWithRequest({ name: "loginForm", data: auth });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "loginForm", data: error.message, error: true });
                    });
                };
                bridge.config = function (json) {
                    let param = JSON.parse(decodeURIComponent(json));
                    let map = new Map();
                    for (var value in param) {
                        map.set(value, param[value]);
                    }
                    /// data from native
                    let result = nativeBridge.config(map);
                    result.then((success) => {
                        /// response to native
                        nativeBridge.callbackWithRequest({ name: "config", data: success.toString() });
                    });
                    result.catch((error) => {
                        nativeBridge.callbackWithRequest({ name: "config", data: error.message, error: true });
                    });
                };
                bridge.responseWithRequest = function (key, status, headers, body) {
                    const obj = JSON.parse(decodeURIComponent(headers));
                    const responseData = new RequestResponse(status, obj, decodeURIComponent(body));
                    client.reveiveResponse(key, responseData);
                };
            });
        }
        /// json call native
        request(option, callback) {
            jsbridge((bridge) => {
                callback(bridge.request(option));
            });
        }
        callbackWithRequest(data) {
            jsbridge((bridge) => {
                let json = JSON.stringify(data);
                bridge.callbackWithRequest(json);
            });
        }
        /// site methods
        provideExtensionInfo() {
            let siteInfo = this.rule.provideExtensionInfo();
            return siteInfo;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.requestItemList(url, page);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.searchItemList(keyword, url, page);
            });
        }
        requestChannelList(key, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.requestChannelList(key, page);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.requestItemChapter(url, id);
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.requestItemMedia(url, id);
            });
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.loginForm(form);
            });
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.rule.config(form);
            });
        }
    }

    class Rule {
        constructor() {
            this.site = this.provideExtensionInfo();
        }
        setRequestClient(client) {
            this.client = client;
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return new ExtensionList([], 1, undefined);
            });
        }
        requestChannelList(key, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return new ExtensionList([], 1, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                return new ExtensionDetail(id, url, "");
            });
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                return new ExtensionAuth();
            });
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                return true;
            });
        }
        init() {
            if (typeof window === "undefined" || typeof document === "undefined") {
                // console.log("rule: window is not defined, cannot initialize bridge.");
                return;
            }
            let bridge;
            const rule = this;
            bridge = new NativeBridge(rule);
            window.__MEMO_BRIDGE__ = bridge;
        }
    }

    class Koyso extends Rule {
        constructor() {
            super(...arguments);
            this.siteLanguage = "schinese";
        }
        provideExtensionInfo() {
            let site = new Extension("koyso", "Koyso", 1 /* MediaType.Article */);
            site.baseUrl = "https://koyso.to";
            site.description = "Free pre-installed PC games for direct download. Simply download & play.";
            site.thumbnail = "https://koyso.to/static/picture/logo_u.ico";
            site.lang = "en";
            site.categoryList = [
                new SiteUrl("All", "/"),
                new SiteUrl("Action", "/category/action"),
                new SiteUrl("Adventure", "/category/adventure"),
                new SiteUrl("R18+", "/category/r18"),
                new SiteUrl("Shooting", "/category/shooting"),
                new SiteUrl("Casual", "/category/casual"),
                new SiteUrl("Sports / Racing", "/category/sports_racing"),
                new SiteUrl("Simulation", "/category/simulation"),
                new SiteUrl("RPG", "/category/rpg"),
                new SiteUrl("Strategy", "/category/strategy"),
                new SiteUrl("Fighting", "/category/fighting"),
                new SiteUrl("Horror", "/category/horror"),
                new SiteUrl("RTS", "/category/rts"),
                new SiteUrl("Card", "/category/card"),
                new SiteUrl("Indie", "/category/indie"),
                new SiteUrl("Lan", "/category/lan"),
            ];
            site.searchList = [
                // https://koyso.to/?keywords=%E4%B8%9C%E6%96%B9&sort=latest
                new SiteUrl("Search", "keywords={keyword}"),
            ];
            site.configParams = [
                { key: "language", value: "Language(english/schinese)" },
            ];
            return site;
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                let language = form.get("language") || "english";
                if (language === "schinese" || language === "english") {
                    this.siteLanguage = language;
                }
                else {
                    this.siteLanguage = "english";
                }
                return true;
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                //https://koyso.to/category/action?page=2&sort=latest
                let api = `${this.site.baseUrl}${url}?sort=latest&page=${page}`;
                let htmlResponse = yield this.client.request({
                    url: api, method: "GET",
                    headers: [
                        { key: "Cookie", value: `language=${this.siteLanguage};` }
                    ],
                });
                let $nodes = $(htmlResponse.body);
                let details = [];
                let articleNodes = $nodes.find("div.games_content a.game_item");
                articleNodes.each((index, element) => {
                    let ele = $(element);
                    let thumbnail = ele.find("div.game_media img").attr("data-src") || "";
                    // add https if missing
                    if (thumbnail && thumbnail.startsWith("//")) {
                        thumbnail = "https:" + thumbnail;
                    }
                    let link = ele.attr("href") || "";
                    // /game/1234-> 1234
                    let id = link.split("/").pop() || link;
                    let title = ele.find("div.game_info span").text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.thumbnail = thumbnail;
                    detail.type = 1 /* MediaType.Article */;
                    details.push(detail);
                });
                let pager = $nodes.find("div.pagination a").first().text().trim();
                // 46/70 -> 70
                let totalPage = parseInt(pager.split("/").pop() || "1");
                let hasMore = page < totalPage;
                let nextApi = `${this.site.baseUrl}${url}?sort=latest&page=${page + 1}`;
                return new ExtensionList(details, page, hasMore ? nextApi : undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                //https://koyso.to/?keywords=keyword&sort=latest
                let api = `${this.site.baseUrl}/?keywords=${encodeURIComponent(keyword)}&sort=latest`;
                let htmlResponse = yield this.client.request({
                    url: api, method: "GET",
                    headers: [
                        { key: "Cookie", value: `language=${this.siteLanguage};` }
                    ],
                });
                let $nodes = $(htmlResponse.body);
                let details = [];
                let articleNodes = $nodes.find("div.games_content a.game_item");
                articleNodes.each((index, element) => {
                    let ele = $(element);
                    let thumbnail = ele.find("div.game_media img").attr("data-src") || "";
                    // add https if missing
                    if (thumbnail && thumbnail.startsWith("//")) {
                        thumbnail = "https:" + thumbnail;
                    }
                    let link = ele.attr("href") || "";
                    // /game/1234-> 1234
                    let id = link.split("/").pop() || link;
                    let title = ele.find("div.game_info span").text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.thumbnail = thumbnail;
                    detail.type = 1 /* MediaType.Article */;
                    details.push(detail);
                });
                let list = new ExtensionList(details, page, undefined);
                return list;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                let htmlResponse = yield this.client.request({
                    url: url, method: "GET",
                    headers: [
                        { key: "Cookie", value: `language=${this.siteLanguage};` }
                    ],
                });
                let $nodes = $(htmlResponse.body);
                let postDiv = $nodes.find("div.game_content");
                let title = postDiv.find("h1.content_title").text().trim();
                let content = postDiv.find("div.content_body");
                let cover = postDiv.find("div.capsule_div img").attr("src") || "";
                //https://koyso.to/download/599
                let frame = `<iframe src="https://koyso.to/download/${id}" title="Download" poster="${cover}"></iframe>`;
                let media = new ArticleMedia(id, title, `<html>${content.html()}</br>${frame}</html>`);
                return media;
            });
        }
    }
    (function () {
        const koyso = new Koyso();
        koyso.init();
    })();

    return Koyso;

})();
