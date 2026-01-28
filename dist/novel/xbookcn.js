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

    class Xbookcn extends Rule {
        constructor() {
            super(...arguments);
            this.pageKeyMap = new Map();
        }
        provideExtensionInfo() {
            let site = new Extension('xbookcn', '中文成人文學網', 5 /* MediaType.Novel */);
            site.baseUrl = "https://www.xbookcn.net";
            site.description = "中文成人文學網，提供大量免費成人小說閱讀。";
            site.thumbnail = "https://www.xbookcn.net/favicon.ico";
            site.lang = "zh-TW";
            site.categoryList = [
                new SiteUrl('短篇情色小说', 'https://blog.xbookcn.net/'),
                new SiteUrl('热门小说', "https://book.xbookcn.net/p/columnist.html"),
                new SiteUrl('通俗小说', "https://book.xbookcn.net/p/popular.html"),
                new SiteUrl('都市小说', "https://book.xbookcn.net/p/urban.html"),
                new SiteUrl('武侠小说', "https://book.xbookcn.net/p/martial.html"),
                new SiteUrl('奇幻小说', "https://book.xbookcn.net/p/fantasy.html"),
                new SiteUrl('冒险小说', "https://book.xbookcn.net/p/adventure.html"),
                new SiteUrl('穿越小说', "https://book.xbookcn.net/p/history.html"),
                new SiteUrl('黑暗小说', "https://book.xbookcn.net/p/dark.html"),
                new SiteUrl('言情小说', "https://book.xbookcn.net/p/romance.html"),
            ];
            return site;
        }
        requestShortStoryList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                let start = (page - 1) * 100;
                //updated-max=2022-01-02T06:00:00%2B08:00
                let shortApi = `https://blog.xbookcn.net/search?max-results=100&start=${start}&by-date=false`;
                let pageKey = this.pageKeyMap.get(page);
                if (pageKey) {
                    shortApi += `&updated-max=${pageKey}`;
                }
                let shortResponse = yield this.client.request({ url: shortApi, method: "GET", });
                let $nodes = $(shortResponse.body);
                let postNodes = $nodes.find('div.post-outer div.post');
                let items = [];
                postNodes.each((index, element) => {
                    let ele = $(element);
                    let title = ele.find('h3.post-title a').text().trim();
                    if (title.indexOf("站内搜索") !== -1 || title.indexOf("目录索引") !== -1) {
                        return;
                    }
                    let link = ele.find('h3.post-title a').attr('href') || "";
                    // https://blog.xbookcn.net/2022/02/blog-post_19.html  ->  2022/02/blog-post_19
                    let id = link.replace('https://blog.xbookcn.net/', '').replace('.html', '');
                    let detail = new ExtensionDetail(id, link, title);
                    detail.hasChapter = false;
                    detail.type = 5 /* MediaType.Novel */;
                    items.push(detail);
                });
                let nextPageNode = $nodes.find('a#Blog1_blog-pager-older-link');
                let href = nextPageNode.attr('href') || "";
                //match https://blog.xbookcn.net/search?updated-max=2022-01-02T06:00:00%2B08:00&max-results=100 -> 2022-01-02T06:00:00%2B08:00
                let nextPageKey = href.match(/updated-max=([^&]+)/);
                if (nextPageKey && nextPageKey.length > 1) {
                    this.pageKeyMap.set(page + 1, nextPageKey[1]);
                }
                return new ExtensionList(items, page, nextPageKey != null ? href : "");
            });
        }
        requestNovelList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                let shortResponse = yield this.client.request({ url: url, method: "GET", });
                let $nodes = $(shortResponse.body);
                let pNodes = $nodes.find('div.post-outer div.post div.post-body p');
                let items = [];
                pNodes.each((index, element) => {
                    let ele = $(element);
                    let strong = ele.find('strong');
                    if (strong.length > 0) {
                        let aNode = ele.find('a');
                        let title = aNode.text().trim();
                        let link = aNode.attr('href') || "";
                        // https://book.xbookcn.net/search/label/%E8%9C%9C%E6%A1%83%E8%87%80 -> 蜜桃臀
                        let id = link.replace('https://book.xbookcn.net/search/label/', '').trim();
                        let detail = new ExtensionDetail(id, link, title);
                        detail.hasChapter = true;
                        detail.type = 5 /* MediaType.Novel */;
                        items.push(detail);
                    }
                    else {
                        let lastItem = items.length > 0 ? items[items.length - 1] : null;
                        if (lastItem) {
                            let text = ele.text().trim();
                            if (text.length > 0) {
                                lastItem.description = text;
                            }
                        }
                    }
                });
                return new ExtensionList(items, page, undefined);
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                if (url.indexOf('blog.xbookcn.net') !== -1) {
                    return this.requestShortStoryList(url, page);
                }
                else {
                    return this.requestNovelList(url, page);
                }
            });
        }
        requestChapter(nodes) {
            return __awaiter(this, void 0, void 0, function* () {
                let chapters = [];
                nodes.each((index, element) => {
                    let ele = $(element);
                    let chapterNode = ele.find('h3.post-title a');
                    let url = chapterNode.attr('href') || "";
                    let title = chapterNode.text().trim();
                    // https://book.xbookcn.net/2007/02/1.html -> 2007/02/1
                    let id = url.replace('https://book.xbookcn.net/', '').replace('.html', '');
                    let chapter = new ItemChapter(id, url, title);
                    chapters.push(chapter);
                });
                return chapters;
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://book.xbookcn.net/search/label/%E8%9C%9C%E6%A1%83%E8%87%80?max-results=100&start=0&by-date=false
                let pageKey = undefined;
                let page = 1;
                let start = (page - 1) * 100;
                let chapterUri = `https://book.xbookcn.net/search/label/${id}?max-results=100&start=${start}&by-date=false`;
                if (pageKey) {
                    chapterUri += `&updated-max=${pageKey}`;
                }
                let detail = new ExtensionDetail(id, url, "");
                let chapters = [];
                while (true) {
                    let response = yield this.client.request({ url: chapterUri, method: "GET", });
                    let $nodes = $(response.body);
                    let blogPosts = $nodes.find('div.blog-posts');
                    if (page == 1) {
                        let title = blogPosts.find("div.status-msg-wrap div.status-msg-body").text().trim();
                        let firstPostNodes = blogPosts.find('div.date-outer div.date-posts div.post-outer div.post').first();
                        let ps = firstPostNodes.find('div.post-body p');
                        let description = ps[1].textContent;
                        let author = ((_a = ps[0].textContent) === null || _a === void 0 ? void 0 : _a.replace('作者：', '').trim()) || "";
                        detail = new ExtensionDetail(id, url, title);
                        detail.type = 5 /* MediaType.Novel */;
                        detail.author = author;
                        detail.description = description || "";
                        firstPostNodes.remove();
                    }
                    let nodes = blogPosts.find('div.date-outer div.date-posts div.post-outer div.post');
                    let pageChapters = yield this.requestChapter(nodes);
                    chapters = chapters.concat(pageChapters);
                    let nextPageNode = $nodes.find('a#Blog1_blog-pager-older-link');
                    let href = nextPageNode.attr('href') || "";
                    //match https://book.xbookcn.net/search?updated-max=2022-01-02T06:00:00%2B08:00&max-results=100 -> 2022-01-02T06:00:00%2B08:00
                    let nextPageKey = href.match(/updated-max=([^&]+)/);
                    if (nextPageKey && nextPageKey.length > 1) {
                        pageKey = nextPageKey[1];
                        page += 1;
                        start = (page - 1) * 100;
                        chapterUri = `https://book.xbookcn.net/search/label/${id}?max-results=100&start=${start}&by-date=false&updated-max=${pageKey}`;
                    }
                    else {
                        break;
                    }
                }
                let volume = new ItemVolume("章节列表", chapters);
                detail.volumes = [volume];
                return detail;
            });
        }
        requestShortStoryDetail(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                let response = yield this.client.request({ url: url, method: "GET", });
                let $nodes = $(response.body);
                let contentNode = $nodes.find('div.blog-posts div.date-outer').first();
                let title = contentNode.find('h3.post-title').text().trim();
                let contentHtml = contentNode.find('div.post-body').html() || "";
                let media = new NovelMedia(id, title, `<html><body>${contentHtml}</body></html>`);
                return media;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (url.indexOf('blog.xbookcn.net') !== -1) {
                    return this.requestShortStoryDetail(url, id);
                }
                else {
                    //novel detail
                    let response = yield this.client.request({ url: url, method: "GET", });
                    let $nodes = $(response.body);
                    let contentNode = $nodes.find('div.post-outer').first();
                    let title = contentNode.find('h3.post-title').text().trim();
                    let contentHtml = contentNode.find('div.post-body').html() || "";
                    let media = new NovelMedia(id, title, `<html><body>${contentHtml}</body></html>`);
                    return media;
                }
            });
        }
    }
    (function () {
        const xbook = new Xbookcn();
        xbook.init();
    })();

    return Xbookcn;

})();
