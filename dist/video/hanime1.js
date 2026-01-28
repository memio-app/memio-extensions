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
    class VideoMedia extends ExtensionMedia {
        constructor(id, title, url, autoCatch = true, webPlay = false) {
            super(3 /* MediaType.Video */, id, title);
            this.autoCatch = true;
            this.webPlay = false;
            this.watchUrl = url;
            this.autoCatch = autoCatch;
            this.webPlay = webPlay;
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

    class HAnime1 extends Rule {
        provideExtensionInfo() {
            let site = new Extension("hanime1", "H動漫/裏番/線上看", 3 /* MediaType.Video */);
            site.thumbnail = "https://vdownload.hembed.com/image/icon/nav_logo.png?secure=HxkFdqiVxMMXXjau9riwGg==,4855471889";
            site.baseUrl = "https://hanime1.me";
            site.description = "Hanime1.me 帶給你最完美的H動漫、H動畫、裏番、里番、成人色情卡通片的線上看體驗，絕對沒有天殺的片頭廣告！";
            site.lang = "zh-TW";
            site.categoryList = [
                new SiteUrl("全部", "/search?genre=%E5%85%A8%E9%83%A8&page={page}"),
                new SiteUrl("裏番", "/search?genre=%E8%A3%8F%E7%95%AA&page={page}"),
                new SiteUrl("泡麵番", "/search?genre=%E6%B3%A1%E9%BA%B5%E7%95%AA&page={page}"),
                new SiteUrl("Motion Anime", "/search?genre=Motion+Anime&page={page}"),
                new SiteUrl("3DCG", "/search?genre=3DCG&page={page}"),
                new SiteUrl("2.5D", "/search?genre=2.5D&page={page}"),
                new SiteUrl("2D動畫", " /search?genre=2D%E5%8B%95%E7%95%AB&page={page}"),
                new SiteUrl("AI生成", " /search?genre=AI%E7%94%9F%E6%88%90&page={page}"),
                new SiteUrl("MMD", " /search?genre=MMD&page={page}"),
                new SiteUrl("Cosplay", " /search?genre=Cosplay&page={page}"),
            ];
            site.searchList = [
                new SiteUrl("搜尋", "/search?genre=%E8%A3%8F%E7%95%AA&query={keyword}&page={page}"),
            ];
            return site;
        }
        parseVerVideo(nodeList) {
            let items = [];
            nodeList.each((index, element) => {
                const ele = $(element);
                let link = ele.attr("href") || "";
                if (!link.startsWith(this.site.baseUrl)) {
                    return;
                }
                // https://hanime1.me/watch?v=166451 -> 166451
                let id = link.split("v=")[1];
                let title = ele.find("div.home-rows-videos-title").text().trim();
                let thumbnail = ele.find("img").attr("src") || "";
                let detail = new ExtensionDetail(id, link, title);
                detail.thumbnail = thumbnail;
                detail.hasChapter = false;
                detail.type = 3 /* MediaType.Video */;
                items.push(detail);
            });
            return items;
        }
        parseHorVideo(nodeList) {
            let items = [];
            nodeList.each((index, element) => {
                const ele = $(element);
                let link = ele.find("a").attr("href") || "";
                if (!link.startsWith(this.site.baseUrl)) {
                    return;
                }
                // https://hanime1.me/watch?v=166451 -> 166451
                let id = link.split("v=")[1];
                let thumbnail = ele.find("img").last().attr("src") || "";
                let title = ele.find("div.card-mobile-title").text().trim();
                let status = ele.find("div.card-mobile-duration").first().text().trim();
                let author = ele.find("a.card-mobile-user").text().trim();
                status = status.replace(/\n/g, "").replace(/\s/g, "");
                let detail = new ExtensionDetail(id, link, title);
                detail.thumbnail = thumbnail;
                detail.hasChapter = false;
                detail.status = status;
                detail.author = author;
                detail.type = 3 /* MediaType.Video */;
                if (!this.dupliteDetail(detail, items)) {
                    items.push(detail);
                }
            });
            return items;
        }
        dupliteDetail(detail, items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === detail.id) {
                    return true;
                }
            }
            return false;
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                let searchUrl = url.replace("{keyword}", encodeURIComponent(keyword));
                return this.requestItemList(searchUrl, page);
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = this.site.baseUrl + url.replace("{page}", page.toString());
                var nextUrl = this.site.baseUrl + url.replace("{page}", (page + 1).toString());
                const response = yield this.client.request({ url: realUrl, method: "GET" });
                const html = response.body;
                const $nodes = $(html);
                let items = [];
                let nodeList = $nodes.find("div.home-rows-videos-wrapper > a");
                if (nodeList.length == 0) {
                    nodeList = $nodes.find("div#home-rows-wrapper div.content-padding-new div.row > div");
                    items = this.parseHorVideo(nodeList);
                }
                else {
                    items = this.parseVerVideo(nodeList);
                }
                let pagination = $nodes.find("ul.pagination:eq(0) li.page-item").last();
                let nextA = ((_a = pagination.find("a")) === null || _a === void 0 ? void 0 : _a.attr("href")) || "";
                let hasMore = nextA.length > 0;
                return new ExtensionList(items, page, hasMore ? nextUrl : undefined);
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                // https://hanime1.me/watch?v=400589
                let api = this.site.baseUrl + `/watch?v=` + id;
                const response = yield this.client.request({ url: api, method: "GET" });
                const html = response.body;
                const $nodes = $(html);
                let title = $nodes.find("h3.shareBtn-title").text().trim();
                let playerSource = $nodes.find("video#player source");
                if (playerSource.length == 0) {
                    let media = new VideoMedia(id, "", url, true, false);
                    return media;
                }
                let maxSource = "480";
                let playUrl = "";
                playerSource.each((index, element) => {
                    const ele = $(element);
                    let sourceLink = ele.attr("src") || "";
                    let size = ele.attr("size") || "480";
                    if (size >= maxSource) {
                        playUrl = sourceLink;
                        maxSource = size;
                    }
                });
                if (playUrl.length == 0) {
                    let media = new VideoMedia(id, "", url, true, false);
                    return media;
                }
                let media = new VideoMedia(id, title, playUrl, false, false);
                return media;
            });
        }
    }
    (function () {
        const hanime1 = new HAnime1();
        hanime1.init();
    })();

    return HAnime1;

})();
