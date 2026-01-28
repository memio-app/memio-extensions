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

    class AgeDm extends Rule {
        constructor() {
            super(...arguments);
            this.siteHost = "https://ageapi.omwjhz.com:18888";
        }
        provideExtensionInfo() {
            let site = new Extension("agedm", "AGE动漫", 3 /* MediaType.Video */);
            site.baseUrl = "https://ageapi.omwjhz.com:18888";
            site.description = "Age动漫专业的在线动漫网站，动漫免费在线观看，高品质画质，实时更新，追番利器!";
            site.thumbnail = "https://p1.bdxiguaimg.com/origin/13843000115ffe11c0c01";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("最近更新", site.baseUrl + "/v2/catalog?order=time&status=all&page={page}&size=30"),
                new SiteUrl("连载中", site.baseUrl + "/v2/catalog?order=time&status=%E8%BF%9E%E8%BD%BD&page={page}&size=30"),
                new SiteUrl("已完结", site.baseUrl + "/v2/catalog?order=time&status=%E5%AE%8C%E7%BB%93&page={page}&size=30"),
                new SiteUrl("TV", site.baseUrl + "/v2/catalog?genre=TV&order=time&page={page}&size=30"),
                new SiteUrl("剧场版", site.baseUrl + "/v2/catalog?genre=%E5%89%A7%E5%9C%BA%E7%89%88&order=time&page={page}&size=30"),
                new SiteUrl("OVA", site.baseUrl + "/v2/catalog?genre=OVA&order=time&page={page}&size=30"),
                new SiteUrl("1月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=1&page={page}&size=30"),
                new SiteUrl("4月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=4&page={page}&size=30"),
                new SiteUrl("7月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=7&page={page}&size=30"),
                new SiteUrl("10月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=10&page={page}&size=30"),
            ];
            site.searchList = [
                new SiteUrl("默认", site.baseUrl + "/v2/search?query={keyword}&page={page}"),
            ];
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = url.replace("{page}", page.toString());
                var nextUrl = url.replace("{page}", (page + 1).toString());
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl,
                    method: "GET",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    ]
                }));
                const json = JSON.parse(httpResponse.body);
                var items = [];
                json.videos.forEach((ele) => {
                    const id = ele.id.toString();
                    const link = this.site.baseUrl + `/v2/detail/${id}`;
                    const cover = ele.cover;
                    const title = ele.name;
                    const description = ele.intro;
                    const update = this.formatTimeStamp(ele.time);
                    const author = ele.writer;
                    const category = ele.tags;
                    let item = new ExtensionDetail(id, link, title);
                    item.thumbnail = cover;
                    item.description = description;
                    item.status = update;
                    item.category = category;
                    item.author = author;
                    item.hasChapter = true;
                    item.type = 3 /* MediaType.Video */;
                    items.push(item);
                    return item;
                });
                const total = json.total;
                let disableNext = (page !== null && page !== void 0 ? page : 1) * 30 >= total;
                return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
            });
        }
        formatTimeStamp(timestamp) {
            const date = new Date(timestamp * 1000); // 乘以1000转换为毫秒
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // 自定义格式：YYYY-MM-DD
            return formattedDate;
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl,
                    method: "GET",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    ]
                }));
                const json = JSON.parse(httpResponse.body);
                var items = [];
                json.data.videos.forEach((ele) => {
                    const id = ele.id.toString();
                    const link = this.site.baseUrl + `/v2/detail/${id}`;
                    const cover = ele.cover;
                    const title = ele.name;
                    const description = ele.intro;
                    const update = this.formatTimeStamp(ele.time);
                    const author = ele.writer;
                    const category = ele.tags;
                    let item = new ExtensionDetail(id, link, title);
                    item.thumbnail = cover;
                    item.description = description;
                    item.status = update;
                    item.category = category;
                    item.author = author;
                    item.hasChapter = true;
                    item.type = 3 /* MediaType.Video */;
                    items.push(item);
                    return item;
                });
                let disableNext = json.data.totalPage <= (page);
                return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                const requestUrl = id ? `${this.site.baseUrl}/v2/detail/${id}` : url;
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: requestUrl,
                    method: "GET",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    ]
                }));
                const json = JSON.parse(httpResponse.body);
                const ele = json.video;
                const detailId = ele.id.toString();
                const link = `${this.site.baseUrl}/v2/detail/${id}`;
                const title = ele.name;
                let detail = new ExtensionDetail(detailId, link, title);
                detail.thumbnail = ele.cover;
                detail.description = ele.intro;
                detail.status = ele.status;
                detail.category = ele.tags;
                detail.author = ele.writer;
                detail.hasChapter = true;
                detail.type = 3 /* MediaType.Video */;
                let volumes = ele.playlists;
                const mediaUrlPrefix = json.player_jx.zj;
                const mediaVipPrefix = json.player_jx.vip;
                detail.volumes = [];
                const keys = Object.keys(volumes);
                keys.forEach((key) => {
                    var _a;
                    let volumeName = key;
                    let chapterList = [];
                    let prefix = key.includes("m3u8") ? mediaUrlPrefix : mediaVipPrefix;
                    var index = 0;
                    volumes[key].forEach((item) => {
                        let chapterId = ++index;
                        let chapterLink = prefix + item[1];
                        let chapterTitle = item[0];
                        let chapter = new ItemChapter(chapterId.toString(), chapterLink, chapterTitle);
                        chapterList.push(chapter);
                    });
                    (_a = detail.volumes) === null || _a === void 0 ? void 0 : _a.push({ name: volumeName, chapters: chapterList });
                });
                return detail;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: url,
                    method: "GET",
                    headers: [
                        { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    ]
                }));
                var html = httpResponse.body;
                const rExp = /var Vurl = '(.+?)'/g;
                const result = rExp.exec(html);
                var autoCatch = true;
                if (result != null && result.length > 1) {
                    autoCatch = false;
                }
                const watchUrl = result ? result[1] : url;
                return new VideoMedia(id, "", watchUrl, autoCatch);
            });
        }
    }
    (function () {
        const agedm = new AgeDm();
        agedm.init();
    })();

    return AgeDm;

})();
