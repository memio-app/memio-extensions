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
    class ItemVolume {
        constructor(volumeName, chapters) {
            this.name = volumeName;
            this.chapters = chapters;
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
    class NovelMedia extends ExtensionMedia {
        constructor(id, title, content, refer) {
            super(5 /* MediaType.Novel */, id, title);
            this.content = content;
            this.refer = refer;
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

    class B520 extends Rule {
        provideExtensionInfo() {
            let site = new Extension("b520", "笔趣阁520", 5 /* MediaType.Novel */);
            site.baseUrl = "http://www.b520.cc";
            site.thumbnail = "http://www.b520.cc/favicon.ico";
            site.description = "笔趣阁是广大书友最值得收藏的网络小说阅读网，新笔趣阁网站收录了当前最火热的网络小说，笔趣阁5200免费提供高质量的小说最新章节，是广大网络小说爱好者必备的小说阅读网。";
            site.lang = "zh";
            site.categoryList = [
                { name: "玄幻小说", url: "/xuanhuanxiaoshuo" },
                { name: "修真小说", url: "/xiuzhenxiaoshuo" },
                { name: "都市小说", url: "/dushixiaoshuo" },
                { name: "穿越小说", url: "/chuanyuexiaoshuo" },
                { name: "网游小说", url: "/wangyouxiaoshuo" },
                { name: "科幻小说", url: "/kehuanxiaoshuo" },
                { name: "言情小说", url: "/yanqingxiaoshuo" },
                { name: "同人小说", url: "/tongrenxiaoshuo" },
            ];
            site.searchList = [
                new SiteUrl("搜索小说", site.baseUrl + "/modules/article/search.php?searchkey={keyword}"),
            ];
            return site;
        }
        parseItemNodes(itemNodes) {
            let itemList = [];
            itemNodes.each((index, element) => {
                let itemNode = $(element);
                let link = itemNode.find("span.s2 > a").attr("href") || "";
                let id = link.replace(/\//g, "");
                let title = itemNode.find("span.s2 > a").text().trim();
                let description = itemNode.find("span.s3 > a").text().trim();
                let author = itemNode.find("span.s5").text().trim();
                let dateNode = itemNode.find("span.s3");
                dateNode.find("a").remove();
                let date = dateNode.text().trim().replace("(", "").replace(")", "");
                let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                detail.author = author;
                detail.description = description;
                detail.category = date;
                detail.author = author;
                detail.hasChapter = true;
                detail.type = 5 /* MediaType.Novel */;
                itemList.push(detail);
            });
            return itemList;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let pageUrl = this.site.baseUrl + `${url}`;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: pageUrl,
                    method: "GET",
                    responseCharset: "gb2312",
                }));
                let $nodes = $(response.body);
                let itemNodes = $nodes.find("div.l ul li");
                let itemList = this.parseItemNodes(itemNodes);
                return new ExtensionList(itemList, page, undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let searchUrl = url.replace("{keyword}", encodeURIComponent(keyword));
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: searchUrl,
                    method: "GET",
                    responseCharset: "gb2312",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                    ],
                }));
                let $nodes = $(response.body);
                let itemList = [];
                let itemNodes = $nodes.find("table tr");
                itemNodes.each((index, element) => {
                    let itemNode = $(element);
                    let link = itemNode.find("td a").first().attr("href") || "";
                    let id = link.replace(/\//g, "");
                    let title = itemNode.find("td a").first().text().trim();
                    let description = itemNode.find("td a").eq(1).text().trim();
                    let author = itemNode.find("td").eq(2).text().trim();
                    let date = itemNode.find("td").eq(4).text().trim();
                    let category = itemNode.find("td").eq(5).text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.author = author;
                    detail.description = description;
                    detail.category = category;
                    detail.status = date;
                    detail.author = author;
                    detail.hasChapter = true;
                    detail.type = 5 /* MediaType.Novel */;
                    itemList.push(detail);
                });
                return new ExtensionList(itemList, page, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + "/" + id + "/";
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: api,
                    method: "GET",
                    responseCharset: "gb2312",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                    ],
                }));
                let $nodes = $(response.body);
                let infoNode = $nodes.find("div#info");
                let title = infoNode.find("h1").text().trim();
                let author = infoNode.find("p").first().text().trim();
                let category = infoNode.find("p").last().text().trim();
                let description = $nodes.find("div#intro").text().trim();
                let cover = $nodes.find("div#fmimg img").attr("src");
                let thumbnail = cover;
                if (cover && !cover.startsWith("http")) {
                    thumbnail = this.site.baseUrl + cover;
                }
                let detail = new ExtensionDetail(id, url, title);
                detail.author = author;
                detail.description = description;
                detail.hasChapter = true;
                detail.thumbnail = thumbnail;
                detail.category = category;
                detail.type = 5 /* MediaType.Novel */;
                // find dt or dd
                let chapterNodes = $nodes.find("dt,dd");
                let volumes = [];
                let chapters = [];
                chapterNodes.each((index, element) => {
                    var _a;
                    let chapterNode = $(element);
                    if (element.tagName.toLowerCase() === "dt") {
                        chapters = [];
                        let existVolume = new ItemVolume(chapterNode.text().trim(), chapters);
                        volumes.push(existVolume);
                        return;
                    }
                    let chapterLink = chapterNode.find("a").attr("href") || "";
                    let chapterId = ((_a = chapterLink.split("/").pop()) === null || _a === void 0 ? void 0 : _a.replace(".html", "")) || "";
                    let chapterTitle = chapterNode.find("a").text().trim();
                    let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink, chapterTitle);
                    chapters.push(chapter);
                });
                detail.volumes = volumes.reverse();
                return detail;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: url, method: "GET", responseCharset: "gb2312",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                    ],
                }));
                let $nodes = $(response.body);
                let contentNode = $nodes.find("div#content");
                let title = $nodes.find("div.bookname h1").text().trim();
                // remove script
                contentNode.find("script").remove();
                let content = `<html><p>${contentNode.html()}</p></html>`;
                let media = new NovelMedia(id, title, content);
                return media;
            });
        }
    }
    (function () {
        const rule = new B520();
        rule.init();
    })();

    return B520;

})();
