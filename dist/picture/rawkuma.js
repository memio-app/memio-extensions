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

    class Rawkuma extends Rule {
        provideExtensionInfo() {
            let site = new Extension("rawkuma", "Rawkuma", 2 /* MediaType.Picture */);
            site.baseUrl = "https://rawkuma.net";
            site.description = "Read manga online, high quality manga, raw manga, manhua, manhwa updated daily. Join Rawkuma for the best reading experience.";
            site.thumbnail = "https://rawkuma.net/wp-content/uploads/2025/09/ラークマのサイトアイコンHEADER-300x300.png";
            site.lang = "en";
            site.categoryList = [
                new SiteUrl("Manga", "[manga]"),
                new SiteUrl("Manhua", `["manhua"]`),
                new SiteUrl("Manhwa", `["manhwa"]`),
                new SiteUrl("Novel", `["novel"]`),
                new SiteUrl("Action", `["action"]`),
                new SiteUrl("Adaptions", `["adaptions"]`),
                new SiteUrl("Adult", `["adult"]`),
                new SiteUrl("Adventure", `["adventure"]`),
                new SiteUrl("Animals", `["animals"]`),
                new SiteUrl("Comedy", `["comedy"]`),
                new SiteUrl("Crime", `["crime"]`),
                new SiteUrl("Drama", `["drama"]`),
                new SiteUrl("Ecchi", `["ecchi"]`),
                new SiteUrl("Fantasy", `["fantasy"]`),
                new SiteUrl("Game", `["game"]`),
                new SiteUrl("Gender Bender", `["gender-bender"]`),
                new SiteUrl("Girls' Love", `["girls-love"]`),
                new SiteUrl("Harem", `["harem"]`),
                new SiteUrl("Hentai", `["hentai"]`),
                new SiteUrl("Historical", `["historical"]`),
                new SiteUrl("Horror", `["horror"]`),
                new SiteUrl("Isekai", `["isekai"]`),
                new SiteUrl("Josei", `["josei"]`),
                new SiteUrl("Lolicon", `["lolicon"]`),
                new SiteUrl("magic", `["magic"]`),
                new SiteUrl("Martial Arts", `["martial-arts"]`),
                new SiteUrl("Mature", `["mature"]`),
                new SiteUrl("Mecha", `["mecha"]`),
                new SiteUrl("Mystery", `["mystery"]`),
                new SiteUrl("Philosophical", `["philosophical"]`),
                new SiteUrl("Police", `["police"]`),
                new SiteUrl("Psychological", `["psychological"]`),
                new SiteUrl("Romance", `["romance"]`),
                new SiteUrl("School Life", `["school-life"]`),
                new SiteUrl("Sci-Fi", `["sci-fi"]`),
                new SiteUrl("Seinen", `["seinen"]`),
                new SiteUrl("Shoujo", `["shoujo"]`),
                new SiteUrl("Shoujo Ai", `["shoujo-ai"]`),
                new SiteUrl("Shounen", `["shounen"]`),
                new SiteUrl("Shounen Ai", `["shounen-ai"]`),
                new SiteUrl("Slice of Life", `["slice-of-life"]`),
                new SiteUrl("Smut", `["smut"]`),
                new SiteUrl("Sports", `["sports"]`),
                new SiteUrl("Supernatural", `["supernatural"]`),
                new SiteUrl("Thriller", `["thriller"]`),
                new SiteUrl("Tragedy", `["tragedy"]`),
                new SiteUrl("Yaoi", `["yaoi"]`),
                new SiteUrl("Yuri", `["yuri"]`),
            ];
            site.searchList = [
                new SiteUrl("Search By Title", "search"),
            ];
            return site;
        }
        parseItemDetails(itemNodes) {
            let details = [];
            itemNodes.each((index, element) => {
                let ele = $(element);
                // find <a color="primary" href="...">
                //let aNode = ele.find("a[color='primary']");
                let aNode = ele.find("a").first();
                let img = aNode.find("img.wp-post-image").attr("src") || "";
                let link = aNode.attr("href") || "";
                // https://rawkuma.net/manga/tensei-shitara-joban-de-shinu-naka-boss-datta-heroine-kenzokuka-de-ikinokoru/
                let id = link.split("/manga/")[1].replace("/", "");
                let title = ele.find("a.text-base").text().trim();
                let lastChapter = ele.find("div.my-2 > span:eq(0)").text().trim();
                let status = ele.find("div.my-2 > span:eq(1)").text().trim();
                let star = ele.find("span.text-yellow-400").text().trim();
                let desc = ele.find("p.line-clamp-3").text().trim();
                let detail = new ExtensionDetail(id, link, title);
                detail.type = 2 /* MediaType.Picture */;
                detail.hasChapter = true;
                detail.description = desc;
                detail.thumbnail = img;
                detail.category = lastChapter;
                detail.author = status;
                detail.status = star;
                details.push(detail);
            });
            return details;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + `/wp-admin/admin-ajax.php?action=advanced_search`;
                let formData = `genre=${url}&order=desc&orderby=popular&page=${page}`;
                let headers = [
                    { key: "Content-Type", value: "application/x-www-form-urlencoded" },
                ];
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: api, method: "POST", body: formData, headers: headers,
                    contentType: "application/x-www-form-urlencoded"
                }));
                let $nodes = $(htmlResponse.body);
                let itemNodes = $nodes.find("div.rounded-lg");
                let details = this.parseItemDetails(itemNodes);
                let hasMore = details.length >= 24;
                let list = new ExtensionList(details, page, hasMore ? api : undefined);
                return list;
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let api = this.site.baseUrl + `/wp-admin/admin-ajax.php?action=advanced_search`;
                let formData = `query=${keyword}&order=desc&orderby=popular&page=${page}`;
                let headers = [
                    { key: "Content-Type", value: "application/x-www-form-urlencoded" },
                ];
                let htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: api, method: "POST", body: formData, headers: headers,
                    contentType: "application/x-www-form-urlencoded"
                }));
                let $nodes = $(htmlResponse.body);
                let itemNodes = $nodes.find("div.rounded-lg");
                let details = this.parseItemDetails(itemNodes);
                let hasMore = details.length >= 24;
                let list = new ExtensionList(details, page, hasMore ? api : undefined);
                return list;
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let response = yield this.client.request({ url: url, method: "GET" });
                let $node = $(response.body);
                let chapterListNode = $node.find("div#chapter-list");
                // <div id=" chapter-list " hx-get=" https://rawkuma.net/wp-admin/admin-ajax.php?manga_id=83552&#038;page= 1&#038;action=chapter_list " hx-target=" this " hx-swap=" outerHTML " hx-trigger=" getChapterList " class=" w-full border-secondary/75 bg-primary/15 text-gray-100 h-64 flex items-center justify-center ">
                let mangaId = ((_a = chapterListNode.attr("hx-get")) === null || _a === void 0 ? void 0 : _a.split("manga_id=")[1].split("&")[0]) || "";
                let chapterUrl = `https://rawkuma.net/wp-admin/admin-ajax.php?manga_id=${mangaId}&page=1&action=chapter_list`;
                let chapterResponse = yield this.client.request({ url: chapterUrl, method: "GET" });
                let $chapterNodes = $(chapterResponse.body);
                // <div data-chapter-number="19.3" ...
                let chapterNodes = $chapterNodes.find("div[data-chapter-number]");
                let chapters = [];
                chapterNodes.each((index, element) => {
                    let ele = $(element);
                    ele.attr("data-chapter-number") || "";
                    let chapterLink = ele.find("a").first().attr("href") || "";
                    let chapterId = chapterLink.split("/").filter(part => part.startsWith("chapter-"))[0] || "";
                    let chapterTitle = ele.find("span").text().trim();
                    let chapter = new ItemChapter(chapterId, chapterLink, chapterTitle);
                    chapters.push(chapter);
                });
                let volume = new ItemVolume("Volume", chapters.reverse());
                let detail = new ExtensionDetail(id, url, "");
                detail.hasChapter = true;
                detail.volumes = [volume];
                return detail;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                let response = yield this.client.request({ url: url, method: "GET" });
                let $nodes = $(response.body);
                let sectionImgs = $nodes.find("section.items-center img");
                let images = [];
                sectionImgs.each((index, element) => {
                    let ele = $(element);
                    let imgSrc = ele.attr("src") || "";
                    if (imgSrc.length > 0) {
                        images.push(imgSrc);
                    }
                });
                let media = new PictureMedia(id, "", images);
                return media;
            });
        }
    }
    (function () {
        // Register extension.
        let rule = new Rawkuma();
        rule.init();
    })();

    return Rawkuma;

})();
