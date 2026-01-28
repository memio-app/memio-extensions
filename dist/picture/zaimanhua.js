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

    class Zaimanhua extends Rule {
        provideExtensionInfo() {
            let site = new Extension("zaimanhua", "再漫画", 2 /* MediaType.Picture */);
            site.baseUrl = "https://manhua.zaimanhua.com";
            site.thumbnail = "https://tvax3.sinaimg.cn/crop.0.0.600.600.50/006rTElvly8hysey9ha3xj30go0goq4j.jpg";
            site.lang = "zh";
            site.description = "再漫画为您提供每日更新在线漫画观看，拥有国内最新最全的少年少女漫画大全，好看的少年少女漫画大全尽在再漫画漫画网";
            site.categoryList = [
                new SiteUrl("最近更新", "size=20&page={page}"),
            ];
            site.searchList = [
                new SiteUrl("搜索", "keyword={keyword}&source=0&page={page}&size=24"),
            ];
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://manhua.zaimanhua.com/api/v1/comic2/update_list?page=1&size=20
                let api = this.site.baseUrl + "/api/v1/comic2/update_list?" + url.replace("{page}", page.toString());
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let jsonContent = response.body;
                try {
                    let json = JSON.parse(jsonContent);
                    let comicList = json.data.comicList;
                    let details = [];
                    comicList.forEach((comic) => {
                        let id = comic.id.toString();
                        let title = comic.name;
                        let author = comic.authors;
                        let category = comic.types;
                        let status = comic.status;
                        let thumbnail = comic.cover;
                        let detailUrl = this.site.baseUrl + "/details/" + id;
                        let detail = new ExtensionDetail(id, detailUrl, title);
                        detail.author = author;
                        detail.category = category;
                        detail.status = status;
                        detail.thumbnail = thumbnail;
                        detail.type = 2 /* MediaType.Picture */;
                        detail.hasChapter = true;
                        details.push(detail);
                    });
                    let totalNum = json.data.totalNum;
                    let hasMore = page * 20 < totalNum;
                    let nextApi = hasMore ? this.site.baseUrl + "/api/v1/comic2/update_list?" + url.replace("{page}", (page + 1).toString()) : undefined;
                    return new ExtensionList(details, page, nextApi);
                }
                catch (e) {
                    console.log("requestItemList parse json error:", e);
                }
                return new ExtensionList([], page, undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://manhua.zaimanhua.com/app/v1/search/index?keyword=恋爱&source=0&page=1&size=24
                let api = this.site.baseUrl + "/app/v1/search/index?" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let jsonContent = response.body;
                try {
                    let json = JSON.parse(jsonContent);
                    let comicList = json.data.list;
                    let details = [];
                    comicList.forEach((comic) => {
                        let id = comic.id.toString();
                        let title = comic.title;
                        let author = comic.authors;
                        let category = comic.types;
                        let status = comic.last_update_chapter_name;
                        let thumbnail = comic.cover;
                        let detailUrl = this.site.baseUrl + "/details/" + id;
                        let detail = new ExtensionDetail(id, detailUrl, title);
                        detail.author = author;
                        detail.category = category;
                        detail.status = status;
                        detail.thumbnail = thumbnail;
                        detail.type = 2 /* MediaType.Picture */;
                        detail.hasChapter = true;
                        details.push(detail);
                    });
                    let totalNum = json.data.total;
                    let hasMore = page * 24 < totalNum;
                    let nextApi = hasMore ? this.site.baseUrl + "/app/v1/search/index?" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString()) : undefined;
                    return new ExtensionList(details, page, nextApi);
                }
                catch (e) {
                    console.log("searchItemList parse json error:", e);
                }
                return new ExtensionList([], page, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                //https://manhua.zaimanhua.com/api/v1/comic2/comic/detail?id=41672
                let api = this.site.baseUrl + "/api/v1/comic2/comic/detail?id=" + id;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let jsonContent = response.body;
                try {
                    let json = JSON.parse(jsonContent);
                    if (json.errno !== 0) {
                        let msg = json.errmsg || "unknown error";
                        return new ExtensionDetail("-1", url, msg);
                    }
                    let comicData = json.data.comicInfo;
                    let title = comicData.title;
                    let author = comicData.authorsTagList.map((tag) => tag.tagName).join(", ");
                    let category = comicData.themeTagList.map((tag) => tag.tagName).join(", ");
                    let description = comicData.description;
                    let volumes = [];
                    comicData.chapterList.forEach((v) => {
                        let chapters = [];
                        let volumeName = v.title;
                        v.data.forEach((c) => {
                            let chapterId = c.chapter_id.toString();
                            let chapterTitle = c.chapter_title;
                            // https://manhua.zaimanhua.com/detail/41672/103820
                            let chapterUrl = this.site.baseUrl + "/detail/" + id + "/" + chapterId;
                            let chapterItem = new ItemChapter(chapterId, chapterUrl, chapterTitle);
                            chapters.push(chapterItem);
                        });
                        let volume = new ItemVolume(volumeName, chapters.reverse());
                        volumes.push(volume);
                    });
                    let detail = new ExtensionDetail(id, url, title);
                    detail.author = author;
                    detail.category = category;
                    detail.description = description;
                    detail.volumes = volumes;
                    detail.type = 2 /* MediaType.Picture */;
                    detail.hasChapter = true;
                    return detail;
                }
                catch (e) {
                    console.log("requestItemChapter parse json error:", e);
                }
                return new ExtensionDetail("-1", url, "");
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // https://manhua.zaimanhua.com/detail/41672/103820 -> 41672
                let comicId = url.split("/").slice(-2)[0];
                // https://manhua.zaimanhua.com/api/v1/comic2/chapter/detail?comic_id=41672&chapter_id=181803
                let api = this.site.baseUrl + `/api/v1/comic2/chapter/detail?comic_id=${comicId}&chapter_id=${id}`;
                console.log("requestItemMedia api:", api);
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let jsonContent = response.body;
                try {
                    let json = JSON.parse(jsonContent);
                    let chapterData = json.data.chapterInfo;
                    let title = chapterData.title;
                    let pageList = chapterData.page_url;
                    let images = [];
                    pageList.forEach((page) => {
                        let imageUrl = page;
                        images.push(imageUrl);
                    });
                    let media = new PictureMedia(id, title, images);
                    return media;
                }
                catch (e) {
                    console.log("requestItemMedia parse json error:", e);
                }
                return new PictureMedia("-1", "", []);
            });
        }
    }
    (function () {
        const zaimanhua = new Zaimanhua();
        zaimanhua.init();
    })();

    return Zaimanhua;

})();
