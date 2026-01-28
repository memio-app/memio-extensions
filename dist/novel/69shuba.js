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

    class Shuba69 extends Rule {
        provideExtensionInfo() {
            let site = new Extension("69shuba", "69书吧", 5 /* MediaType.Novel */);
            site.baseUrl = "https://www.69shuba.com";
            site.thumbnail = "https://cdn.cdnshu.com/favicon.ico";
            site.description = "69书吧提供最新最热网络小说，无弹窗小说阅读,最新章节阅读，全文阅读，无错小说阅读";
            site.lang = "zh-HK";
            //https://www.69shuba.com/ajax_novels/class/11/6.htm
            site.categoryList = [
                { name: "全部分类", url: "/ajax_novels/class/0/{page}.htm" },
                { name: "言情小说", url: "/ajax_novels/class/3/{page}.htm" },
                { name: "玄幻魔法", url: "/ajax_novels/class/1/{page}.htm" },
                { name: "修真武侠", url: "/ajax_novels/class/2/{page}.htm" },
                { name: "穿越时空", url: "/ajax_novels/class/11/{page}.htm" },
                { name: "都市小说", url: "/ajax_novels/class/9/{page}.htm" },
                { name: "历史军事", url: "/ajax_novels/class/4/{page}.htm" },
                { name: "游戏竞技", url: "/ajax_novels/class/5/{page}.htm" },
                { name: "科幻空间", url: "/ajax_novels/class/6/{page}.htm" },
                { name: "悬疑惊悚", url: "/ajax_novels/class/7/{page}.htm" },
                { name: "同人小说", url: "/ajax_novels/class/8/{page}.htm" },
                { name: "官场职场", url: "/ajax_novels/class/10/{page}.htm" },
                { name: "青春校园", url: "/ajax_novels/class/12/{page}.htm" },
            ];
            site.searchList = [
                new SiteUrl("搜索小说", site.baseUrl + "/modules/article/search.php"),
            ];
            site.forceLogin = false;
            site.loginParams = [
                { key: "Cookie", value: "Cookie" },
            ];
            site.useGuide = `## 如何搜索书籍
1. 该网站搜索需要验证用户身份，您需要提供在网页端生成的Cookie信息。
2. 打开浏览器，访问 [69书吧-www.69shuba.com](https://www.69shuba.com/) 网站。
3. 进入搜索页面，输入任意关键词进行搜索。
4. 使用浏览器的开发者工具，找到请求头中的Cookie信息，提取关键词 **shuba_userverfiy** 及其对应的值。如 shuba_userverfiy=1765963948@173d5fb0753eb21fd27b6ba175adb751; 
5. 将提取到的Cookie信息复制并粘贴到本扩展的登录参数中。
6. 保存后，您就可以使用搜索功能查找小说了。
`;
            return site;
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                let auth = new ExtensionAuth();
                let cookie = form.get("Cookie") || "";
                if (cookie.indexOf("shuba_userverfiy=") < 0) {
                    return auth;
                }
                auth.headers = [
                    { key: "Cookie", value: cookie },
                ];
                return auth;
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let pageUrl = this.site.baseUrl + url.replace("{page}", page.toString());
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: pageUrl, method: "GET" }));
                let html = response.body;
                let $nodes = $(html);
                let itemNodes = $nodes.filter("li");
                console.log(itemNodes.length);
                let items = [];
                itemNodes.each((index, element) => {
                    var _a;
                    let itemNode = $(element);
                    let cover = itemNode.find("img").attr("data-src") || "";
                    let link = itemNode.find("h3 > a").attr("href") || "";
                    let id = ((_a = link.split("/").pop()) === null || _a === void 0 ? void 0 : _a.replace(".htm", "")) || "";
                    link = link.replace(".htm", "/");
                    let title = itemNode.find("h3 > a").text().trim();
                    let labels = itemNode.find("div.labelbox label").toArray().map(x => $(x).text().trim());
                    let description = itemNode.find("ol").text().trim();
                    let lastUpdateNode = itemNode.find("div.zxzj");
                    lastUpdateNode.find("span").remove();
                    let lastUpdate = lastUpdateNode.text().trim();
                    let detail = new ExtensionDetail(id, link, title);
                    detail.author = labels.join(", ");
                    detail.description = description;
                    detail.category = lastUpdate;
                    detail.hasChapter = true;
                    detail.thumbnail = cover;
                    detail.type = 5 /* MediaType.Novel */;
                    items.push(detail);
                });
                let hasMore = items.length >= 50;
                return new ExtensionList(items, page, hasMore ? url : undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let formData = "searchkey=" + encodeURIComponent(keyword) + "&searchtype=all";
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: url,
                    contentType: "application/x-www-form-urlencoded",
                    method: "POST",
                    body: formData
                }));
                let html = response.body;
                let $nodes = $(html);
                let itemNodes = $nodes.find("div.newbox ul li ");
                let items = [];
                itemNodes.each((index, element) => {
                    var _a;
                    let itemNode = $(element);
                    let cover = itemNode.find("img").attr("data-src") || "";
                    let link = itemNode.find("h3 > a").attr("href") || "";
                    let id = ((_a = link.split("/").pop()) === null || _a === void 0 ? void 0 : _a.replace(".htm", "")) || "";
                    link = link.replace(".htm", "/");
                    let title = itemNode.find("h3 > a").text().trim();
                    let labels = itemNode.find("div.labelbox label").toArray().map(x => $(x).text().trim());
                    let description = itemNode.find("ol").text().trim();
                    let lastUpdateNode = itemNode.find("div.zxzj");
                    lastUpdateNode.find("span").remove();
                    let lastUpdate = lastUpdateNode.text().trim();
                    let detail = new ExtensionDetail(id, link, title);
                    detail.author = labels.join(", ");
                    detail.description = description;
                    detail.category = lastUpdate;
                    detail.hasChapter = true;
                    detail.thumbnail = cover;
                    detail.type = 5 /* MediaType.Novel */;
                    items.push(detail);
                });
                return new ExtensionList(items, page, undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                //https://www.69shuba.com/book/90442/
                let pageUrl = this.site.baseUrl + "/book/" + id + "/";
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: pageUrl, method: "GET", responseCharset: "gbk" }));
                let html = response.body;
                let $nodes = $(html);
                let catalog = $nodes.find("div#catalog");
                let title = catalog.find("h1 a").text().trim().replace("最新章节", "");
                let detail = new ExtensionDetail(id, pageUrl, title);
                let chapters = [];
                let chapterNodes = catalog.find("ul li");
                chapterNodes.each((index, element) => {
                    let chapterNode = $(element);
                    let chapterLink = chapterNode.find("a").attr("href") || "";
                    let chapterId = chapterLink.split("/").pop() || "";
                    let chapterTitle = chapterNode.find("a").text().trim();
                    let chapter = new ItemChapter(chapterId, chapterLink, chapterTitle);
                    chapters.push(chapter);
                });
                let volumes = [new ItemVolume("章节列表", chapters.reverse())];
                detail.volumes = volumes;
                return detail;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                //https://www.69shuba.com/book/90442/305373.html
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: url,
                    method: "GET",
                    responseCharset: "gbk",
                    headers: [
                        { key: "Referer", value: this.site.baseUrl }
                    ]
                }));
                let html = response.body;
                let $nodes = $(html);
                let contentNode = $nodes.find("div.txtnav");
                let title = contentNode.find("h1").text().trim();
                // remove script
                contentNode.find("script").remove();
                contentNode.find("h1").remove();
                contentNode.find("div").remove();
                let content = `<html><p>${contentNode.html()}</p></html>`;
                //&emsp;&emsp;墨画连忙点了点头，然后和管事行礼道谢便离开了。
                content = content.replace(/^(&emsp;)+/gm, '');
                let media = new NovelMedia(id, title, content);
                return media;
            });
        }
    }
    (function () {
        const rule = new Shuba69();
        rule.init();
    })();

    return Shuba69;

})();
