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

    class Ntdm extends Rule {
        constructor() {
            super(...arguments);
            this.siteHost = "https://www.ntdm8.com";
            this.playerConfigJson = undefined;
        }
        provideExtensionInfo() {
            let site = new Extension("ntdm", "NT动漫", 3 /* MediaType.Video */);
            site.baseUrl = "https://www.ntdm8.com";
            site.description = "Age动漫专业的在线动漫网站，动漫免费在线观看，高品质画质，实时更新，追番利器!";
            site.thumbnail = "https://cdn.yinghuazy.xyz/webjs/ntdm8/image/favicon.ico";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("日本", "type/riben-{page}.html"),
                new SiteUrl("中国", "type/zhongguo-{page}.html"),
                new SiteUrl("欧美", "type/oumei-{page}.html"),
            ];
            site.searchList = [
                new SiteUrl("默认", "search/-------------.html?wd={keyword}&page={page}"),
            ];
            site.configParams = [
                { key: "host", value: "网站地址，可查看发布页（www.ntdm.fans）" },
            ];
            this.siteHost = site.baseUrl;
            return site;
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                const host = form.get("host");
                if (host && host.length > 0) {
                    if (host.endsWith("/")) {
                        this.siteHost = host.substring(0, host.length - 1);
                    }
                    else {
                        this.siteHost = host;
                    }
                    return true;
                }
                return false;
            });
        }
        parseVideoItemList(items) {
            return __awaiter(this, void 0, void 0, function* () {
                var details = [];
                items.each((index, element) => {
                    const ele = $(element);
                    const aNode = ele.find("a.cell_poster");
                    const link = aNode.attr("href") || "";
                    // /video/7006.html -> 7006
                    const id = link ? link.replace("/video/", "").replace(".html", "") : "";
                    const cover = aNode.find("img").attr("src") || "";
                    const status = aNode.find("span.newname").text().trim();
                    let categorys = ele.find("div.cell_imform_kvs span.cell_imform_value");
                    let category = "";
                    let author = "";
                    // get category at 0-3
                    if (categorys.length >= 3) {
                        category = $(categorys[1]).text().trim();
                        author = $(categorys[0]).text().trim() + " / " + $(categorys[3]).text().trim();
                    }
                    const title = ele.find("a.cell_imform_name").text().trim();
                    const description = ele.find("div.cell_imform_kvs div.cell_imform_kv").last().find("div.cell_imform_desc").text().trim();
                    let item = new ExtensionDetail(id, this.siteHost + link, title);
                    item.thumbnail = cover;
                    item.description = description;
                    item.status = status;
                    item.category = category;
                    item.author = author;
                    item.hasChapter = true;
                    item.type = 3 /* MediaType.Video */;
                    details.push(item);
                });
                return details;
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = this.siteHost + "/" + url.replace("{page}", page.toString());
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl,
                    method: "GET",
                }));
                let $nodes = $(httpResponse.body);
                let items = $nodes.find("div.baseblock > div.blockcontent1 > div.cell");
                let details = yield this.parseVideoItemList(items);
                let hasMore = details.length >= 15;
                let nextUrl = hasMore ? this.siteHost + "/" + url.replace("{page}", (page + 1).toString()) : undefined;
                return new ExtensionList(details, page, nextUrl);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = this.siteHost + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                var nextUrl = this.siteHost + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl,
                    method: "GET",
                }));
                let $nodes = $(httpResponse.body);
                let items = $nodes.find("div.baseblock > div.blockcontent1 > div.cell");
                let details = yield this.parseVideoItemList(items);
                let hasMore = details.length >= 10;
                return new ExtensionList(details, page, hasMore ? nextUrl : undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: url,
                    method: "GET",
                }));
                let $nodes = $(httpResponse.body);
                let cover = $nodes.find("div.blockcontent > img.poster").attr("src") || "";
                let categoryNodes = $nodes.find("div.blockcontent ul.blockcontent li.detail_imform_kv span.detail_imform_value");
                let category = "";
                let author = "";
                let status = "";
                // get category at 0-3
                if (categoryNodes.length >= 3) {
                    status = $(categoryNodes[0]).text().trim();
                    category = categoryNodes.last().text().trim();
                    author = $(categoryNodes[1]).text().trim() + " / " + $(categoryNodes[2]).text().trim();
                }
                let title = $nodes.find("div.blockcontent h4.detail_imform_name").text().trim();
                let description = $nodes.find("div.blockcontent div.detail_imform_desc_pre p").text().trim();
                let volumeNames = $nodes.find("ul#menu0 li");
                let volumeNodes = $nodes.find("div#content div#main0 div.movurl ul");
                let volumes = [];
                volumeNodes.each((vIndex, vElement) => {
                    const vEle = $(vElement);
                    const chapterNodes = vEle.find("li");
                    let volumeName = volumeNames.eq(vIndex).text().trim();
                    let chapters = [];
                    chapterNodes.each((cIndex, cElement) => {
                        const cEle = $(cElement);
                        const aNode = cEle.find("a");
                        const chapterTitle = aNode.text().trim();
                        const chapterLink = aNode.attr("href") || "";
                        // /play/7006-1-1.html -> 7006-1-1
                        const chapterId = chapterLink.replace("/play/", "").replace(".html", "");
                        let chapter = new ItemChapter(chapterId, this.siteHost + chapterLink, chapterTitle);
                        chapters.push(chapter);
                    });
                    let volume = new ItemVolume(volumeName || "默认", chapters);
                    volumes.push(volume);
                });
                let item = new ExtensionDetail(id, url, title);
                item.thumbnail = cover;
                item.description = description;
                item.status = status;
                item.category = category;
                item.author = author;
                item.hasChapter = true;
                item.type = 3 /* MediaType.Video */;
                item.volumes = volumes;
                return item;
            });
        }
        findPlayerConfigPath(key, html) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // parse <script type="text/javascript" src="/static/js/playerconfig.js?t=20251226">
                const scriptRegex = /<script type="text\/javascript" src="(\/static\/js\/playerconfig\.js\?t=\d+)"><\/script>/;
                const match = html.match(scriptRegex);
                if (!match || match.length < 2) {
                    throw new Error("playerconfig.js not found");
                }
                const scriptPath = match[1];
                const scriptUrl = this.siteHost + scriptPath;
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: scriptUrl, method: "GET", }));
                let jsContent = httpResponse.body;
                // parse MacPlayerConfig.player_list={...};
                const configRegex = /MacPlayerConfig\.player_list=({.+?}),MacPlayerConfig.downer_list/;
                const configMatch = jsContent.match(configRegex);
                if (!configMatch || configMatch.length < 2) {
                    console.error("player_list config not found");
                    return "";
                }
                let json = JSON.parse(configMatch[1]);
                this.playerConfigJson = json;
                let urlPath = json[key];
                return urlPath.parse;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var httpResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET", }));
                let html = httpResponse.body;
                // parse<div>sasad <script type="text/javascript">var player_aaaa={"flag":"play","encrypt":0,"trysee":0,"points":0,"link":"\/play\/7077-1-1.html","link_next":"\/play\/7077-2-3.html","link_pre":"\/play\/7077-2-1.html","url":"o%2FOVeQuRw71F8Rl%2F1KvXYEri6RXwurJMS4M677Jqse6eECBfrz0yVNud0xg1%2FkJ9s4P4kPO%2FzcZ2ejzDeLLNxQ%3D%3D","url_next":"o%2FOVeQuRw71F8Rl%2F1KvXYEri6RXwurJMS4M677Jqse566%2FkaWR6z%2FSc3%2BI0%2F0RGReSt3g89xZp5D9WAQm7XSHg%3D%3D","from":"dyttm3u8","server":"no","note":"","id":"7077","sid":2,"nid":2}</script>
                const scriptRegex = /<script type="text\/javascript">var player_aaaa=({.+?})<\/script>/;
                const match = html.match(scriptRegex);
                if (!match || match.length < 2) {
                    console.error("player_aaaa not found");
                    return new VideoMedia(id, "", url, true);
                }
                const playerJson = match[1];
                const playerObj = JSON.parse(playerJson);
                const encodedUrl = playerObj.url;
                const from = playerObj.from || "unknown";
                let watchUrl = "";
                if (!this.playerConfigJson) {
                    let playPath = yield this.findPlayerConfigPath(from, html);
                    if (playPath.length == 0) {
                        return new VideoMedia(id, "", url, true);
                    }
                    watchUrl = playPath + encodedUrl;
                }
                else {
                    let playPath = this.playerConfigJson[from].parse;
                    if (playPath.length == 0) {
                        return new VideoMedia(id, "", url, true);
                    }
                    watchUrl = playPath + encodedUrl;
                }
                return new VideoMedia(id, "", watchUrl, false, true);
            });
        }
    }
    (function () {
        const ntdm = new Ntdm();
        ntdm.init();
    })();

    return Ntdm;

})();
