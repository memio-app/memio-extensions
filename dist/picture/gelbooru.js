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
    class Channel {
        constructor(type = 0 /* ChannelType.List */, name, value) {
            this.type = type;
            this.name = name;
            this.value = value;
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
    class PictureMedia extends ExtensionMedia {
        constructor(id, title, imageList) {
            super(2 /* MediaType.Picture */, id, title);
            this.imageList = imageList;
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

    class Gelbooru extends Rule {
        provideExtensionInfo() {
            let site = new Extension("gelbooru", "Gelbooru", 2 /* MediaType.Picture */);
            site.baseUrl = "https://gelbooru.com";
            site.description = "Browse millions of anime, manga, videos, and video game themed images on Gelbooru. Discover art with detailed tags. Contains explicit hentai content.";
            site.thumbnail = "https://gelbooru.com/favicon.png";
            site.lang = "en";
            site.categoryList = [
                new SiteUrl("ALL", "page=post&s=list&tags=all"),
            ];
            site.searchList = [
                // https://gelbooru.com/index.php?page=post&s=list&tags=+nintendo+pokemon
                new SiteUrl("Tags", "page=post&s=list&tags={keyword}"),
            ];
            site.channel = new Channel(0 /* ChannelType.List */, "Tags", "tags");
            site.useGuide = `## How to use Tags search
1. Enter keywords separated by spaces to search for images with multiple tags.
2. For example, to search for images tagged with "nintendo" and "pokemon", enter "nintendo pokemon" in the search field.
3. You can find tags in [gelbooru tags](https://gelbooru.com/index.php?page=tags&s=list).

## How to set up Tags channel
1. Go to the Gelbooru Tags List page: https://gelbooru.com/index.php?page=tags&s=list
2. Select the tag you want to browse, for example: https://gelbooru.com/index.php?page=post&s=list&tags=nintendo
3. Copy the tag parameter value "nintendo" from the URL.
4. In the channel settings, select "Tags" and enter the parameter value "nintendo". Save to view all works with that tag.
        `;
            return site;
        }
        parseItemDetails(nodeList) {
            let itemList = [];
            nodeList.each((index, element) => {
                let ele = $(element);
                let link = ele.find("a").attr("href") || "";
                let id = ele.find("a").attr("id") || "";
                // p13306614 -> 13306614
                id = id.replace("p", "");
                let title = ele.find("a img").attr("title") || "";
                if (title.length > 100) {
                    title = title.substring(0, 100) + "...";
                }
                let thumb = ele.find("a img").attr("src") || "";
                let detail = new ExtensionDetail(id, link, title);
                detail.type = 2 /* MediaType.Picture */;
                detail.thumbnail = thumb;
                detail.hasChapter = false;
                itemList.push(detail);
            });
            return itemList;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://gelbooru.com/index.php?page=post&s=list&tags=all&pid=42
                let pid = (page - 1) * 42;
                let api = this.site.baseUrl + "/index.php?" + url + `&pid=${pid}`;
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
                let itemList = this.parseItemDetails(imageNodes);
                let paginator = $nodes.find("div#paginator");
                let lastA = paginator.find("a").last();
                // ?page=post&s=list&tags=all&pid=11629800 -> 11629800
                let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
                let hasmore = maxPid > (pid + 42);
                let nextPage = hasmore ? this.site.baseUrl + "/index.php?" + url + `&pid=${pid + 42}` : undefined;
                return new ExtensionList(itemList, page, nextPage);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://gelbooru.com/index.php?page=post&s=list&tags=nintendo+pokemon&pid=42
                let pid = (page - 1) * 42;
                let searchUrl = this.site.baseUrl + "/index.php?" + url.replace("{keyword}", encodeURIComponent(keyword)) + `&pid=${pid}`;
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: searchUrl, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
                let itemList = this.parseItemDetails(imageNodes);
                let paginator = $nodes.find("div#paginator");
                let lastA = paginator.find("a").last();
                // ?page=post&s=list&tags=nintendo+pokemon&pid=11629800 -> 11629800
                let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
                let hasmore = maxPid > (pid + 42);
                let nextPage = hasmore ? this.site.baseUrl + "/index.php?" + url.replace("{keyword}", encodeURIComponent(keyword)) + `&pid=${pid + 42}` : undefined;
                return new ExtensionList(itemList, page, nextPage);
            });
        }
        requestChannelList(key, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://gelbooru.com/index.php?page=post&s=list&tags=nintendo&pid=42
                let pid = (page - 1) * 42;
                let api = this.site.baseUrl + "/index.php?page=post&s=list&tags=" + encodeURIComponent(key) + `&pid=${pid}`;
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
                let itemList = this.parseItemDetails(imageNodes);
                let paginator = $nodes.find("div#paginator");
                let lastA = paginator.find("a").last();
                // ?page=post&s=list&tags=all&pid=11629800 -> 11629800
                let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
                let hasmore = maxPid > (pid + 42);
                let nextPage = hasmore ? this.site.baseUrl + "/index.php?page=post&s=list&tags=" + encodeURIComponent(key) + `&pid=${pid + 42}` : undefined;
                return new ExtensionList(itemList, page, nextPage);
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://gelbooru.com/index.php?page=post&s=view&id=13306575
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let picture = $nodes.find("section.image-container picture img").attr("src") || "";
                let imaUrl = picture.replace("/samples", "images").replace("sample_", "");
                let media = new PictureMedia(id, id, [imaUrl]);
                return media;
            });
        }
    }
    (function () {
        const gelbooru = new Gelbooru();
        gelbooru.init();
    })();

    return Gelbooru;

})();
