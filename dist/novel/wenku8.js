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
    class SiteHeader {
        constructor(key, value) {
            this.key = key;
            this.value = value;
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

    class Wenku8 extends Rule {
        provideExtensionInfo() {
            let site = new Extension("wenku8", "轻小说文库", 5 /* MediaType.Novel */);
            site.baseUrl = "https://www.wenku8.cc";
            site.description = "这是一个专门的日本轻小说网站，本站只收录各类日本轻小说与ACG小说。\n需要登录后才能浏览小说内容。";
            site.thumbnail = "https://bangumi.oss-cn-hangzhou.aliyuncs.com/site/ic_novel_wenku8.jpg";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("最近更新", site.baseUrl + "/modules/article/toplist.php?sort=lastupdate&charset=utf8&page={page}"),
                new SiteUrl("热门轻小说", site.baseUrl + "/modules/article/toplist.php?sort=allvisit&charset=utf8&page={page}"),
                new SiteUrl("动画化作品", site.baseUrl + "/modules/article/toplist.php?sort=anime&charset=utf8&page={page}"),
                new SiteUrl("新书一览", site.baseUrl + "/modules/article/toplist.php?sort=postdate&charset=utf8&page={page}"),
                new SiteUrl("总收藏榜", site.baseUrl + "/modules/article/toplist.php?sort=goodnum&charset=utf8&page={page}"),
                new SiteUrl("月排行榜", site.baseUrl + "/modules/article/toplist.php?sort=monthvisit&charset=utf8&page={page}"),
                new SiteUrl("完结全本", site.baseUrl + "/modules/article/articlelist.php?fullflag=1&charset=utf8&page={page}"),
            ];
            site.searchList = [
                new SiteUrl("搜索(书名)", site.baseUrl + "/modules/article/search.php?searchtype=articlename&searchkey={keyword}&charset=utf8&page={page}"),
                new SiteUrl("搜索(作者)", site.baseUrl + "/modules/article/search.php?searchtype=author&searchkey={keyword}&charset=utf8&page={page}"),
                new SiteUrl("TAG", site.baseUrl + "/modules/article/tags.php?t={keyword}&charset=utf8&page={page}"),
                new SiteUrl("文库(1-14)", site.baseUrl + "/modules/article/articlelist.php?class={keyword}&charset=utf8&page={page}"),
            ];
            site.loginParams = [
                { key: "username", value: "用户名" },
                { key: "password", value: "密码" },
            ];
            site.forceLogin = true;
            site.useGuide = `## 轻小说文库账号注册

1. 可以访问轻小说文库网站：https://www.wenku8.cc/
2. 若没有账号，可以先进入 [注册页面](https://www.wenku8.net/register.php) 创建账号。
3. 注册成功后，使用你的账号登录网站，确保账号可以正常使用。

## 登录账号

1. 在扩展的登录界面，输入你在轻小说文库注册的用户名和密码。
2. 提交登录信息，扩展会自动处理登录过程。
3. 登录成功后，你就可以浏览和阅读轻小说内容了。

**注意事项：**
- 请确保你的账号信息正确无误，以免登录失败。
- 如果遇到登录问题，可以尝试在浏览器中登录网站，确认账号状态。
        `;
            return site;
        }
        itemListParse($nodes) {
            var listNode = $nodes.find("div#content table.grid tr > td > div");
            var items = [];
            listNode.each((_index, element) => {
                var _a;
                let ele = $(element);
                let link = ele.find("div > b > a").attr("href");
                if (link) {
                    let cover = ele.find("div > a > img").attr("src");
                    let title = ele.find("div > b > a").text();
                    let update = ele.find("div > p:eq(1)").text();
                    let author = ele.find("div > p:eq(0)").text();
                    let tags = ele.find("div > p:eq(2)").text();
                    let description = ele.find("div > p:eq(3)").text();
                    let pattern = new RegExp('/book/(.*?).htm$', 'i');
                    let id = (_a = pattern.exec(link)) === null || _a === void 0 ? void 0 : _a[1];
                    let item = new ExtensionDetail(id, this.site.baseUrl + link + "?charset=utf8", title);
                    item.thumbnail = cover;
                    item.description = description;
                    item.status = update;
                    item.author = author;
                    item.category = tags;
                    item.hasChapter = true;
                    item.type = 5 /* MediaType.Novel */;
                    items.push(item);
                }
            });
            return items;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = url.replace("{page}", page.toString());
                var nextUrl = url.replace("{page}", (page + 1).toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let items = this.itemListParse($nodes);
                var disableNext = true;
                const pageStats = $nodes.find("em#pagestats").text().split("/");
                if (pageStats && pageStats.length == 2) {
                    disableNext = pageStats[0] === pageStats[1];
                }
                return new ExtensionList(items, page, disableNext ? undefined : nextUrl);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                if ($nodes.find("div#centerm").length > 0) {
                    let items = this.itemListParse($nodes);
                    var disableNext = true;
                    const pageStats = $nodes.find("em#pagestats").text().split("/");
                    if (pageStats && pageStats.length == 2) {
                        disableNext = pageStats[0] === pageStats[1];
                    }
                    return new ExtensionList(items, page, disableNext ? undefined : nextUrl);
                }
                else {
                    var items = [];
                    let mainNode = $nodes.find("div#centerl");
                    if (mainNode) {
                        let detailNode = mainNode.find("div#content > div");
                        let cover = detailNode.find("table tr > td > img").attr("src");
                        let description = detailNode.find("table tr > td[valign=top] span").last().text();
                        let title = detailNode.find("table span > b").first().text();
                        let author = detailNode.find("table:eq(0) > tbody > tr:eq(1) > td:eq(1)").text();
                        let status = detailNode.find("table:eq(2) tr > td[valign=top] span:eq(3) > a").text();
                        let category = detailNode.find("table:eq(2) tr > td[valign=top] span.hottext > b").first().text();
                        let formAction = $nodes.find("form[name=frmreview]").attr("action");
                        let id;
                        if (formAction) {
                            const aidMatch = formAction.match(/aid=(\d+)/);
                            if (aidMatch && aidMatch[1]) {
                                id = aidMatch[1];
                            }
                        }
                        let item = new ExtensionDetail(id, this.site.baseUrl + "/book/" + id + ".htm?charset=utf8", title);
                        item.thumbnail = cover;
                        item.description = description;
                        item.status = status;
                        item.author = author;
                        item.category = category;
                        item.hasChapter = true;
                        item.type = 5 /* MediaType.Novel */;
                        items.push(item);
                    }
                    return new ExtensionList(items, page, undefined);
                }
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let detailNode = $nodes.find("div#content > div");
                let cover = detailNode.find("table tr > td > img").attr("src");
                let description = detailNode.find("table tr > td[valign=top] span").last().text();
                let title = detailNode.find("table span > b").first().text();
                let author = detailNode.find("table:eq(0) > tbody > tr:eq(1) > td:eq(1)").text();
                let status = detailNode.find("table:eq(2) tr > td[valign=top] span:eq(3) > a").text();
                let category = detailNode.find("table:eq(2) tr > td[valign=top] span.hottext > b").first().text();
                let item = new ExtensionDetail(id, url, title);
                item.thumbnail = cover;
                item.description = description;
                item.author = author;
                item.status = status;
                item.category = category;
                item.hasChapter = true;
                item.type = 5 /* MediaType.Novel */;
                let bookId = "";
                if (id == undefined) {
                    let pattern = new RegExp('/book/(.*?).htm$', 'i');
                    bookId = (_b = pattern.exec(url)) === null || _b === void 0 ? void 0 : _b[1];
                }
                else {
                    bookId = id;
                }
                let indexUrl = this.site.baseUrl + "/modules/article/reader.php?aid={bookId}&charset=utf8".replace("{bookId}", bookId);
                var indexResponse = yield ((_c = this.client) === null || _c === void 0 ? void 0 : _c.request({ url: indexUrl, method: "GET" }));
                var indexHtml = indexResponse.body;
                let $volumns = $(indexHtml);
                let volumes = $($volumns.filter("table.css").first()).find("tr");
                item.volumes = [];
                let tempVolume = new ItemVolume("", []);
                volumes.each((_index, element) => {
                    var _a;
                    let $element = $(element);
                    let volume = $element.find("td.vcss");
                    if (volume.length > 0) {
                        tempVolume = new ItemVolume(volume.text(), []);
                        (_a = item.volumes) === null || _a === void 0 ? void 0 : _a.push(tempVolume);
                        return;
                    }
                    let chapters = $element.find("td.ccss");
                    chapters.each((_index, element) => {
                        var _a;
                        let chapter = $(element);
                        let link = chapter.find("a").attr("href");
                        if (link == undefined) {
                            return;
                        }
                        let pattern = /&cid=(.*)/gi;
                        let cid = (_a = pattern.exec(link)) === null || _a === void 0 ? void 0 : _a[1];
                        let title = chapter.find("a").text();
                        let item = new ItemChapter(cid, link + "&charset=utf8", title);
                        tempVolume.chapters.push(item);
                    });
                });
                return item;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let title = $nodes.find("div#title").text();
                let findedContent = $nodes.find("div#content").first();
                let content = findedContent.html();
                return new NovelMedia(id, title, "<p>" + content + "</p>");
            });
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let username = (_a = form.get("username")) !== null && _a !== void 0 ? _a : "";
                let password = (_b = form.get("password")) !== null && _b !== void 0 ? _b : "";
                if (username == "" || password == "") {
                    return new ExtensionAuth();
                }
                let url = this.site.baseUrl + "/login.php?do=submit&jumpurl=http%3A%2F%2Fwww.wenku8.cc%2Findex.php";
                let body = 'username=' + username + '&password=' + password + '&usecookie=2592000&action=login';
                let headers = [
                    { key: "Content-Type", value: "application/x-www-form-urlencoded" },
                ];
                let htmlResponse = yield ((_c = this.client) === null || _c === void 0 ? void 0 : _c.request({
                    url: url, method: "POST", body: body, headers: headers,
                    contentType: "application/x-www-form-urlencoded",
                    responseHeaders: ["p3p", "set-cookie"]
                }));
                var extensionAuth = new ExtensionAuth();
                const resHeaders = htmlResponse === null || htmlResponse === void 0 ? void 0 : htmlResponse.headers;
                var containP3pHeader = false;
                var containHeader = [];
                resHeaders.forEach((header) => {
                    if (header.key.toLowerCase() == "p3p") {
                        containP3pHeader = true;
                    }
                    else if (header.key.toLowerCase() == "set-cookie") {
                        containHeader.push(new SiteHeader(header.key, header.value));
                    }
                });
                if (containP3pHeader) {
                    extensionAuth.headers.push(...containHeader);
                }
                return extensionAuth;
            });
        }
    }
    (function () {
        const wenku8 = new Wenku8();
        wenku8.init();
    })();

    return Wenku8;

})();
