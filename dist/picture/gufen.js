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
    class ItemChapter {
        constructor(id, url, name) {
            this.url = url;
            this.id = id;
            this.name = name;
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

    class Gufen extends Rule {
        constructor() {
            super(...arguments);
            this.siteHost = "https://www.gfmh.app";
        }
        provideExtensionInfo() {
            let site = new Extension("gufen", "古风漫画网", 2 /* MediaType.Picture */);
            site.baseUrl = "https://www.gfmh.app";
            site.description = "古风漫画网精心整理收集，最近更新漫画推荐、最近更新漫画大全.";
            site.thumbnail = "";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("全部漫画", site.baseUrl + "/category/page/{page}/"),
                new SiteUrl("日本漫画", site.baseUrl + "/category/list/2/page/{page}/"),
                new SiteUrl("国产漫画", site.baseUrl + "/category/list/1/page/{page}/"),
                new SiteUrl("韩国漫画", site.baseUrl + "/category/list/3/page/{page}/"),
                new SiteUrl("欧美漫画", site.baseUrl + "/category/list/4/page/{page}/"),
            ];
            site.searchList = [
                new SiteUrl("默认", site.baseUrl + "/search/{keyword}/{page}"),
            ];
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = url.replace("{page}", page.toString());
                var nextUrl = url.replace("{page}", (page + 1).toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                var listNode = $nodes.find("div.store_left ul.flex li");
                if (!listNode || listNode.length == 0) {
                    return new ExtensionList([], page ? page : 1, undefined);
                }
                var items = [];
                listNode.each((_index, element) => {
                    var _a;
                    let ele = $(element);
                    let link = ele.find("a").attr("href");
                    if (link) {
                        let cover = ele.find("a > img").attr("data-original");
                        let title = ele.find("div.w100 h2").text();
                        let description = ele.find("div.w100 p.indent").text();
                        let update = ele.find("div.w100 em.blue").text();
                        let author = ele.find("div.w100 div.li_bottom i.fa").text().trim();
                        let pattern = new RegExp('/(.*?).html', 'i');
                        let id = (_a = pattern.exec(link)) === null || _a === void 0 ? void 0 : _a[1];
                        let item = new ExtensionDetail(id, this.site.baseUrl + link, title);
                        item.thumbnail = cover;
                        item.description = description;
                        item.category = update;
                        item.author = author;
                        item.hasChapter = true;
                        item.type = 2 /* MediaType.Picture */;
                        items.push(item);
                    }
                });
                let disableNext = items.length < 16;
                return new ExtensionList(items, page, disableNext ? undefined : nextUrl);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                var listNode = $nodes.find("div.side_commend ul.flex li.searchresult");
                if (!listNode || listNode.length == 0) {
                    return new ExtensionList([], page ? page : 1, undefined);
                }
                var items = [];
                listNode.each((_index, element) => {
                    var _a;
                    let ele = $(element);
                    let link = ele.find("div.img_span a").attr("href");
                    if (link) {
                        let cover = ele.find("div.img_span a img").attr("data-original");
                        let title = ele.find("div a > h3").text();
                        let description = ele.find("p.searchresult_p").text();
                        let update = ele.find("p > a").last().text();
                        let author = ele.find("p").first().contents().filter((i, el) => el.nodeType === Node.TEXT_NODE).text().trim();
                        let status = ele.find("div.img_span > a").text();
                        let pattern = new RegExp('/(.*?).html', 'i');
                        let id = (_a = pattern.exec(link)) === null || _a === void 0 ? void 0 : _a[1];
                        let item = new ExtensionDetail(id, this.site.baseUrl + link, title);
                        item.thumbnail = cover;
                        item.description = description;
                        item.category = update;
                        item.author = author;
                        item.status = status;
                        item.hasChapter = true;
                        item.type = 2 /* MediaType.Picture */;
                        items.push(item);
                    }
                });
                let disableNext = items.length < 10;
                return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let comicUrl = new URL(url);
                let comicDomain = comicUrl.protocol + "//" + comicUrl.host;
                let $nodes = $(html);
                let detailNode = $nodes.find("div.novel_info_main");
                let cover = $nodes.find("div.novel_info_main img").attr("src");
                let description = $nodes.find("div#info div.intro>p").text().trim();
                let title = detailNode.find("div.novel_info_title h1").text();
                let author = detailNode.find("div.novel_info_title i").first().text();
                let update = detailNode.find("div.novel_info_title div").first().contents().filter((i, el) => el.nodeType === Node.TEXT_NODE).text().trim();
                let category = detailNode.find("div.novel_info_title p span");
                let categoryText = "";
                if (category && category.length > 0) {
                    category.each((_index, element) => {
                        let text = element.textContent;
                        categoryText += (text === null || text === void 0 ? void 0 : text.trim()) + " ";
                    });
                }
                let item = new ExtensionDetail(id, url, title);
                item.thumbnail = cover;
                item.description = description;
                item.author = author;
                item.status = update;
                item.category = categoryText.trim();
                item.hasChapter = true;
                item.type = 2 /* MediaType.Picture */;
                let chapterNode = $nodes.find("div#catalog");
                let volumes = chapterNode.find("div.chapter_list");
                item.volumes = [];
                volumes.each((_index, element) => {
                    var _a;
                    let volume = $(element);
                    let volumeName = "章节列表";
                    let chapters = volume.find("ul#ul_all_chapters > li");
                    let chapterList = [];
                    chapters.each((_index, element) => {
                        var _a;
                        let chapter = $(element);
                        let link = chapter.find("a").attr("href");
                        if (link == undefined)
                            return;
                        let title = chapter.find("a").text();
                        let pattern = new RegExp('/(.*?)/(.*?).html', 'i');
                        let id = (_a = pattern.exec(link)) === null || _a === void 0 ? void 0 : _a[2];
                        let item = new ItemChapter(id, comicDomain + link, title);
                        chapterList.push(item);
                    });
                    (_a = item.volumes) === null || _a === void 0 ? void 0 : _a.push({ name: volumeName, chapters: chapterList });
                });
                return item;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET", afterLoad: true }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let title = $nodes.find("div.reader-main h1").text();
                let imgList = $nodes.find("div#contents img");
                if (!imgList || imgList.length == 0) {
                    return new PictureMedia(id, "pageTitle", []);
                }
                let images = [];
                imgList.each((_index, element) => {
                    let img = $(element);
                    if (!img)
                        return;
                    let pageImage = img.attr("data-src");
                    if (!pageImage)
                        return;
                    images.push(pageImage);
                });
                let media = new PictureMedia(id, title, images);
                return media;
            });
        }
    }
    (function () {
        const gufen = new Gufen();
        gufen.init();
    })();

    return Gufen;

})();
