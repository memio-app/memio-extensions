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

    class Xmanhua extends Rule {
        provideExtensionInfo() {
            let site = new Extension("xmanhua", "X漫畫", 2 /* MediaType.Picture */);
            site.thumbnail = "https://www.xmanhua.com/favicon.ico";
            site.description = "日本漫畫_在線漫畫閱讀第一站(xmanhua)";
            site.baseUrl = "https://www.xmanhua.com";
            site.lang = "zh-TW";
            site.categoryList = [
                new SiteUrl("最新漫畫", "/manga-list-0-0-2-p{page}/"),
                new SiteUrl("人氣漫畫", "/manga-list-p{page}/"),
                new SiteUrl("連載中", "/manga-list-0-0-2-p{page}/"),
                new SiteUrl("已完結", "/manga-list-0-2-2-p{page}/"),
                new SiteUrl("熱血", "/manga-list-31-0-2-p{page}/"),
                new SiteUrl("戀愛", "/manga-list-26-0-2-p{page}/"),
                new SiteUrl("校園", "/manga-list-1-0-2-p{page}/"),
                new SiteUrl("冒險", "/manga-list-2-0-2-p{page}/"),
                new SiteUrl("科幻", "/manga-list-25-0-2-p{page}/"),
                new SiteUrl("生活", "/manga-list-11-0-2-p{page}/"),
                new SiteUrl("懸疑", "/manga-list-17-0-2-p{page}/"),
                new SiteUrl("運動", "/manga-list-34-0-2-p{page}/"),
            ];
            site.searchList = [
                new SiteUrl("搜索", "search?title={keyword}&page={page}"),
            ];
            return site;
        }
        parseDetails(mhList) {
            let details = [];
            mhList.each((index, element) => {
                let el = $(element);
                let link = el.find("a").first().attr("href") || "";
                // /7610xm/ -> 7610xm
                let id = link.split("/")[1];
                let thumbnail = el.find("a:eq(0) img").attr("src") || "";
                let title = el.find("div.mh-item-detali h2.title a").text().trim();
                let updateInfo = el.find("p.chapter a").text().trim();
                let detailUrl = this.site.baseUrl + link;
                let detail = new ExtensionDetail(id, detailUrl, title);
                detail.thumbnail = thumbnail;
                detail.description = updateInfo;
                detail.type = 2 /* MediaType.Picture */;
                detail.hasChapter = true;
                details.push(detail);
            });
            return details;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + url.replace("{page}", page.toString());
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let htmlContent = response.body;
                let $nodes = $(htmlContent);
                let mhList = $nodes.find("ul.mh-list > li div.mh-item");
                console.log("mhList length:", mhList.length);
                let details = this.parseDetails(mhList);
                let hasmore = details.length >= 12;
                let nextApi = hasmore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
                return new ExtensionList(details, page, nextApi);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let htmlContent = response.body;
                let $nodes = $(htmlContent);
                let mhList = $nodes.find("ul.mh-list > li div.mh-item");
                let details = this.parseDetails(mhList);
                let hasmore = details.length >= 12;
                let nextApi = hasmore ? this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString()) : undefined;
                return new ExtensionList(details, page, nextApi);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let detailNode = $nodes.find("div.container div.detail-info");
                let thumbanail = detailNode.find("img.detail-info-cover").attr("src") || "";
                let title = detailNode.find("p.detail-info-title").text().trim();
                let author = detailNode.find("p.detail-info-tip span:eq(0) a").text().trim();
                let status = detailNode.find("p.detail-info-tip span:eq(1) span").text().trim();
                let category = detailNode.find("p.detail-info-tip span:eq(2) span").text().trim();
                let description = detailNode.find("p.detail-info-content").text().trim();
                let chapters = [];
                let chapterNodes = $nodes.find("div#chapterlistload a");
                chapterNodes.each((_i, el) => {
                    let item = $(el);
                    let link = item.attr("href") || "";
                    ///m102367/ -> m102367
                    let chapterId = link.split("/")[1];
                    let p = item.find("span").text().trim();
                    item.find("span").remove();
                    let chapterName = item.text().trim() + p;
                    let chapter = new ItemChapter(chapterId, this.site.baseUrl + link, chapterName);
                    chapters.push(chapter);
                });
                let detail = new ExtensionDetail(id || "", url, title);
                detail.author = author;
                detail.status = status;
                detail.category = category;
                detail.description = description;
                detail.thumbnail = thumbanail;
                detail.type = 2 /* MediaType.Picture */;
                detail.hasChapter = true;
                detail.volumes = [new ItemVolume("章節", chapters.reverse())];
                return detail;
            });
        }
        loadScriptContent(html) {
            let $nodes = $(html);
            let result = [];
            $nodes.each((index, element) => {
                var _a, _b, _c, _d, _e, _f;
                if (element instanceof HTMLScriptElement) {
                    let scriptContent = element.innerHTML;
                    if (scriptContent.includes("XMANHUA_CURL")) {
                        // var XMANHUA_CID = 134056;  -> 134056
                        let cid = ((_a = scriptContent.match(/var\s+XMANHUA_CID\s*=\s*(\d+);/)) === null || _a === void 0 ? void 0 : _a[1]) || "";
                        // var XMANHUA_IMAGE_COUNT = 30;
                        let imageCount = ((_b = scriptContent.match(/var\s+XMANHUA_IMAGE_COUNT\s*=\s*(\d+);/)) === null || _b === void 0 ? void 0 : _b[1]) || "";
                        // var XMANHUA_CTITLE = "黑貓篇43話";
                        let title = ((_c = scriptContent.match(/var\s+XMANHUA_CTITLE\s*=\s*"([^"]+)";/)) === null || _c === void 0 ? void 0 : _c[1]) || "";
                        // var XMANHUA_VIEWSIGN = "c3d6f6ee15048ab2d87f71bc3c1b389e";
                        let sign = ((_d = scriptContent.match(/var\s+XMANHUA_VIEWSIGN\s*=\s*"([^"]+)";/)) === null || _d === void 0 ? void 0 : _d[1]) || "";
                        // var XMANHUA_VIEWSIGN_DT = "2026-01-08 15:17:18";
                        let dt = ((_e = scriptContent.match(/var\s+XMANHUA_VIEWSIGN_DT\s*=\s*"([^"]+)";/)) === null || _e === void 0 ? void 0 : _e[1]) || "";
                        // var XMANHUA_COMIC_MID = 11505;
                        let mid = ((_f = scriptContent.match(/var\s+XMANHUA_COMIC_MID\s*=\s*(\d+);/)) === null || _f === void 0 ? void 0 : _f[1]) || "";
                        result = [cid, imageCount, title, sign, dt, mid]; // Exit the each loop
                        console.log("Xmanhua loadScriptContent:", result);
                        return false;
                    }
                }
            });
            return result;
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                //https://www.xmanhua.com/m134056/
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let results = this.loadScriptContent(html);
                if (results.length < 2) {
                    return new PictureMedia("-1", "", []);
                }
                let cid = results[0];
                let imageCount = parseInt(results[1] || "0");
                let title = results[2] || "";
                let sign = results[3] || "";
                let dt = results[4] || "";
                let mid = results[5] || "";
                let param = `_cid=${cid}&_mid=${mid}&_dt=${encodeURIComponent(dt)}&_sign=${sign}`;
                let images = [];
                let page = 1;
                // https://www.xmanhua.com/m134056/chapterimage.ashx?cid=134056&page=31
                while (page < imageCount) {
                    let api = this.site.baseUrl + `/${id}/chapterimage.ashx?cid=${cid}&page=${page}&${param}`;
                    let response = yield this.client.request({ url: api, method: "GET", headers: [{ key: "Referer", value: this.site.baseUrl }] });
                    let scriptContent = response.body;
                    if (scriptContent.length < 10) {
                        break;
                    }
                    try {
                        // [`image1.jpg`, `image2.jpg`, ...]
                        let array = [];
                        let result = eval(scriptContent);
                        console.log("result:", result);
                        if (result && Array.isArray(result) == false) {
                            array = eval(result);
                        }
                        else {
                            array = result;
                        }
                        let imagesJson = array;
                        images.push(...imagesJson);
                        page = images.length + 1;
                    }
                    catch (err) {
                        console.error("Xmanhua parse image error:", err);
                        break;
                    }
                }
                let media = new PictureMedia(id, title, images);
                media.refer = this.site.baseUrl;
                return media;
            });
        }
    }
    (function () {
        const xmanhua = new Xmanhua();
        xmanhua.init();
    })();

    return Xmanhua;

})();
