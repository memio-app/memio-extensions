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

    class Shukuge extends Rule {
        provideExtensionInfo() {
            let site = new Extension("shukuge", "365Book", 5 /* MediaType.Novel */);
            site.baseUrl = "http://www.shukuge.com";
            site.thumbnail = "http://www.shukuge.com/favicon.ico";
            site.description = "免费全本小说下载_TXT免费小说_免费小说下载 - 365小说网";
            site.lang = "zh";
            site.categoryList = [
                { name: "最新收录", url: site.baseUrl + "/new/" },
                { name: "最新短篇小说", url: site.baseUrl + "/l-duanpian/" },
                { name: "最新中篇小说", url: site.baseUrl + "/l-zhongpian/" },
                { name: "最新长篇小说", url: site.baseUrl + "/l-changpian/" },
                { name: "玄幻小说", url: site.baseUrl + "/i-xuanhuan/" },
                { name: "言情小说", url: site.baseUrl + "/i-yanqing/" },
                { name: "穿越小说", url: site.baseUrl + "/i-chuanyue/" },
                { name: "重生小说", url: site.baseUrl + "/i-chongsheng/" },
                { name: "架空小说", url: site.baseUrl + "/i-jiakong/" },
                { name: "总裁小说", url: site.baseUrl + "/i-zongcai/" },
                { name: "仙侠小说", url: site.baseUrl + "/i-xianxia/" },
                { name: "武侠小说", url: site.baseUrl + "/i-wuxia/" },
                { name: "耽美小说", url: site.baseUrl + "/i-danmei/" },
                { name: "都市小说", url: site.baseUrl + "/i-dushi/" },
                { name: "军事小说", url: site.baseUrl + "/i-junshi/" },
                { name: "网游小说", url: site.baseUrl + "/i-wangyou/" },
                { name: "悬疑小说", url: site.baseUrl + "/i-xuanyi/" },
                { name: "文学小说", url: site.baseUrl + "/i-wenxue/" },
                { name: "科幻小说", url: site.baseUrl + "/i-kehuan/" },
                { name: "修真小说", url: site.baseUrl + "/i-xiuzhen/" },
                { name: "历史小说", url: site.baseUrl + "/i-lishi/" },
                { name: "其他小说", url: site.baseUrl + "/i-qita/" }
            ];
            site.searchList = [
                new SiteUrl("作者/小说名", site.baseUrl + "/Search?wd=")
            ];
            return site;
        }
        parseItemNodes(itemNodes) {
            let itemList = [];
            itemNodes.each((index, element) => {
                var _a;
                let itemNode = $(element);
                let link = itemNode.find("div.bookdesc > a").attr("href") || "";
                // /book/160349/ -> 160349
                let id = ((_a = link.match(/\/book\/(\d+)\//)) === null || _a === void 0 ? void 0 : _a[1]) || "";
                let title = itemNode.find("div.bookdesc h2").text().trim();
                let cover = itemNode.find("a.cover img").attr("src") || "";
                let detailNodes = itemNode.find("p.sp span");
                let author = detailNodes.eq(0).text().trim();
                let category = detailNodes.text().replace(author, "").trim();
                let description = itemNode.find("div.bookdesc p.desc").first().text().trim();
                let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                detail.author = author;
                detail.thumbnail = this.site.baseUrl + cover;
                detail.category = category;
                detail.description = description;
                detail.hasChapter = true;
                itemList.push(detail);
            });
            return itemList;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let pageUrl = url + page;
                let nextPageUrl = url + (page + 1);
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: pageUrl, method: "GET" }));
                let $nodes = $(response.body);
                let itemNodes = $nodes.find("div.panel-body div.listitem");
                let itemList = this.parseItemNodes(itemNodes);
                let hasNextPage = false;
                let nextPageLi = $nodes.find("ul.pagination li.active").next();
                if (nextPageLi.hasClass("disabled")) {
                    hasNextPage = false;
                }
                else {
                    hasNextPage = true;
                }
                return new ExtensionList(itemList, page, hasNextPage ? nextPageUrl : undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let pageUrl = url + encodeURIComponent(keyword);
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: pageUrl, method: "GET" }));
                let $nodes = $(response.body);
                let itemNodes = $nodes.find("div.panel-body div.listitem");
                let itemList = this.parseItemNodes(itemNodes);
                return new ExtensionList(itemList, page, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                let $nodes = $(response.body);
                let itemNode = $nodes.find("div.bookd");
                let title = itemNode.find("div.bookd-title h1").text().replace("TXT全集", "").trim();
                let cover = itemNode.find("div.bookdcover img").attr("src") || "";
                let detailNodes = itemNode.find("div.bookdmore p");
                let author = detailNodes.eq(2).text().trim();
                let category = detailNodes.eq(1).text().trim();
                let description = itemNode.find("div.bookdtext p").first().text().trim();
                let date = detailNodes.last().text().trim();
                let detail = new ExtensionDetail(id, url, title);
                detail.author = author;
                detail.thumbnail = this.site.baseUrl + cover;
                detail.category = category;
                detail.description = description;
                detail.hasChapter = true;
                detail.status = date;
                let chapterUrl = `http://www.shukuge.com/book/${id}/index.html`;
                let chapterResponse = yield ((_b = this.client) === null || _b === void 0 ? void 0 : _b.request({ url: chapterUrl, method: "GET" }));
                let $chapterNodes = $(chapterResponse.body);
                let chapterNodes = $chapterNodes.find("div#list dd");
                let chapterList = [];
                chapterNodes.each((index, element) => {
                    var _a;
                    let chapterNode = $(element);
                    let chapterLink = chapterNode.find("a").attr("href") || "";
                    let chapterTitle = chapterNode.find("a").text().trim();
                    //// /book/143932/45477921.html  -> 45477921
                    let chapterId = ((_a = chapterLink.match(/\/book\/\d+\/(\d+)\.html/)) === null || _a === void 0 ? void 0 : _a[1]) || "";
                    let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink, chapterTitle);
                    chapterList.push(chapter);
                });
                let volume = new ItemVolume("目录", chapterList);
                detail.volumes = [volume];
                return detail;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                let $nodes = $(response.body);
                let title = $nodes.find("div.bookd-title h1").text().trim();
                let contentNodes = $nodes.find("div#content").last();
                contentNodes.remove("div.bottem1");
                let contentText = ("<html><p>" + contentNodes.html() + "</p></html>") || "";
                let media = new NovelMedia(id, title, contentText);
                return media;
            });
        }
    }
    (function () {
        const rule = new Shukuge();
        rule.init();
    })();

    return Shukuge;

})();
