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

    class BaoziMH extends Rule {
        provideExtensionInfo() {
            let site = new Extension("baozimh", "包子漫画", 2 /* MediaType.Picture */);
            site.baseUrl = "https://www.baozimh.com";
            site.description = "包子漫畫爲您提供優質的漫畫閱讀體驗。連載漫畫，免費漫畫，玄幻漫畫，言情漫畫，穿越漫畫，都市漫畫，仙俠漫畫，武俠漫畫，現代言情漫畫，古代言情漫畫，靈異漫畫，遊戲漫畫，歷史漫畫，懸疑漫畫，科幻漫畫，競技體育漫畫，軍事漫畫，青春漫畫，耽美漫畫，日漫，國漫，看不完的漫畫，漫畫閱讀網站，就在包子漫畫";
            site.thumbnail = "https://www.baozimh.com/favicon.ico";
            site.lang = "zh-TW";
            site.categoryList = [
                new SiteUrl("全部", "region=all&type=all"),
                new SiteUrl("國漫", "region=cn&type=all"),
                new SiteUrl("日本", "region=jp&type=all"),
                new SiteUrl("韓國", "region=kr&type=all"),
                new SiteUrl("歐美", "region=en&type=all"),
                new SiteUrl("連載中", "region=all&type=all&state=serial"),
                new SiteUrl("已完結", "region=all&type=all&state=pub"),
                new SiteUrl("戀愛", "region=all&type=lianai"),
                new SiteUrl("純愛", "region=all&type=xiaoyuan"),
                new SiteUrl("古風", "region=all&type=gufeng"),
                new SiteUrl("異能", "region=all&type=yineng"),
                new SiteUrl("懸疑", "region=all&type=xuanyi"),
                new SiteUrl("劇情", "region=all&type=juqing"),
                new SiteUrl("科幻", "region=all&type=kehuan"),
                new SiteUrl("奇幻", "region=all&type=qihuan"),
                new SiteUrl("玄幻", "region=all&type=xuanhuan"),
                new SiteUrl("穿越", "region=all&type=chuanyue"),
                new SiteUrl("冒險", "region=all&type=mouxian"),
                new SiteUrl("推理", "region=all&type=tuili"),
                new SiteUrl("武俠", "region=all&type=wuxia"),
                new SiteUrl("格鬥", "region=all&type=gedou"),
                new SiteUrl("戰爭", "region=all&type=zhanzheng"),
                new SiteUrl("熱血", "region=all&type=rexie"),
                new SiteUrl("搞笑", "region=all&type=gaoxiao"),
                new SiteUrl("大女主", "region=all&type=danuzhu"),
                new SiteUrl("都市", "region=all&type=dushi"),
                new SiteUrl("總裁", "region=all&type=zongcai"),
                new SiteUrl("後宮", "region=all&type=hougong"),
                new SiteUrl("日常", "region=all&type=richang"),
                new SiteUrl("韓漫", "region=all&type=hanman"),
                new SiteUrl("少年", "region=all&type=shaonian"),
                new SiteUrl("其它", "region=all&type=qita"),
            ];
            site.searchList = [
                new SiteUrl("檢索", "search?q={keyword}"),
            ];
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + "/api/bzmhq/amp_comic_list?" + url + `&page=${page}&limit=36`;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                try {
                    var json = JSON.parse(htmlResponse.body);
                    let items = json.items;
                    let details = [];
                    items.forEach((item) => {
                        let id = item.comic_id;
                        let category = item.type_names.join(", ");
                        let author = item.author;
                        let title = item.name;
                        let thumbnail = "https://static-tw.baozimh.com/cover/" + item.topic_img;
                        let state = item.region_name;
                        let link = this.site.baseUrl + "/comic/" + id;
                        let detail = new ExtensionDetail(id, link, title);
                        detail.thumbnail = thumbnail;
                        detail.category = category;
                        detail.author = author;
                        detail.status = state;
                        detail.hasChapter = true;
                        detail.type = 2 /* MediaType.Picture */;
                        details.push(detail);
                    });
                    let nextApi = details.length >= 36 ? this.site.baseUrl + "/api/bzmhq/amp_comic_list?" + url + `&page=${page + 1}&limit=36` : undefined;
                    return new ExtensionList(details, page, nextApi);
                }
                catch (e) {
                    console.log(e);
                }
                return new ExtensionList([], page, undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword));
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let details = [];
                let listNodes = $nodes.find("div.classify-items > div.comics-card");
                listNodes.each((_i, el) => {
                    var _a, _b;
                    let item = $(el);
                    let link = item.find("a.comics-card__poster").attr("href");
                    if (link == undefined)
                        return;
                    let id = (_b = (_a = link.match(/\/comic\/(.*?)$/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
                    let thumbnail = item.find("a.comics-card__poster amp-img").first().attr("src");
                    let title = item.find("a.comics-card__info div.comics-card__title h3").text().trim();
                    let author = item.find("a.comics-card__info small").text().trim();
                    let category = item.find("a.comics-card__poster div.tabs span").first().text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.thumbnail = thumbnail;
                    detail.author = author;
                    detail.category = category;
                    detail.hasChapter = true;
                    detail.type = 2 /* MediaType.Picture */;
                    details.push(detail);
                });
                return new ExtensionList(details, page, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let detail = $nodes.find("div.comics-detail");
                let thumbnail = (_c = (_b = detail.find("div.de-info__bg").attr("style")) === null || _b === void 0 ? void 0 : _b.match(/url\('(.*?)'\)/)) === null || _c === void 0 ? void 0 : _c[1];
                let title = detail.find("h1.comics-detail__title").text().trim();
                let author = detail.find("h2.comics-detail__author").text().trim();
                let tagList = detail.find("div.tag-list span.tag");
                let tags = tagList.map((_i, el) => {
                    return $(el).text().trim();
                }).get().join(", ");
                let description = detail.find("p.comics-detail__desc").text().trim();
                let chapterNodes = $nodes.find("div#chapters_other_list > div, div#chapter-items > div");
                console.log("chapterNodes length:", chapterNodes.length);
                if (chapterNodes.length == 0) {
                    chapterNodes = $nodes.find("div.l-box > div.pure-g > div.comics-chapters");
                }
                let chapters = [];
                chapterNodes.each((_i, el) => {
                    var _a, _b;
                    let chapter = $(el);
                    let link = chapter.find("a").attr("href");
                    if (link == undefined)
                        return;
                    // /user/page_direct?comic_id=modujingbingdenuli-zhucunyangping&section_slot=0&chapter_slot=26 -> 26
                    let id = (_b = (_a = link.match(/chapter_slot=(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
                    let chapterTitle = chapter.find("a span").text().trim();
                    let chapterItem = new ItemChapter(id, this.site.baseUrl + link, chapterTitle);
                    chapters.push(chapterItem);
                });
                let item = new ExtensionDetail(id, url, title);
                item.thumbnail = thumbnail;
                item.author = author;
                item.category = tags;
                item.description = description;
                item.hasChapter = true;
                item.type = 2 /* MediaType.Picture */;
                item.volumes = [
                    {
                        name: "章节列表",
                        chapters: chapters
                    }
                ];
                return item;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let hasMoreImage = true;
                let images = [];
                let title = "";
                let api = url;
                let page = 1;
                while (hasMoreImage) {
                    var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                    var html = htmlResponse.body;
                    let $nodes = $(html);
                    if (title == "") {
                        title = $nodes.find("div.l-content span.title").first().text().trim();
                        // 第26卷(1/4) -> 第26卷
                        title = title.replace(/\((\d+)\/(\d+)\)/, "").trim();
                    }
                    let imageNodes = $nodes.find("ul.comic-contain amp-img");
                    imageNodes.each((_i, el) => {
                        let img = $(el).attr("data-src");
                        if (img) {
                            images.push(img);
                        }
                    });
                    let pageA = $nodes.find("a#next-chapter").attr("href");
                    // https://www.twmanga.com/comic/chapter/yiquanchaoren-one/0_354_2.html -> 0_354_2
                    let pageId = (_b = pageA === null || pageA === void 0 ? void 0 : pageA.split("/").pop()) === null || _b === void 0 ? void 0 : _b.split(".").shift();
                    let sections = pageId === null || pageId === void 0 ? void 0 : pageId.split("_");
                    if (pageA != undefined && sections && sections.length == 3) {
                        let pageNum = parseInt(sections[2]);
                        if (pageNum != undefined && pageNum === page + 1) {
                            api = pageA;
                            page = pageNum;
                            hasMoreImage = true;
                        }
                        else {
                            hasMoreImage = false;
                        }
                    }
                    else {
                        hasMoreImage = false;
                    }
                }
                let media = new PictureMedia(id, title, images);
                return media;
            });
        }
    }
    (function () {
        const baozimh = new BaoziMH();
        baozimh.init();
    })();

    return BaoziMH;

})();
