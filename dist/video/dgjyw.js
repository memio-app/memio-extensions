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

    class Dgjyw extends Rule {
        provideExtensionInfo() {
            let site = new Extension("dgjyw", "东莞影视网", 3 /* MediaType.Video */);
            site.baseUrl = "https://www.dgjyw.com";
            site.description = "东莞影视网为您提供了丰富多样的电影和电视剧免费在线观看,影片资源齐全，有动作片喜剧片爱情片科幻片恐怖片剧情片等等";
            site.thumbnail = "https://www.dgjyw.com/favicon.ico";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("电影", "1-0-0-0-0-{page}"),
                new SiteUrl("电视剧", "14-0-0-0-0-{page}"),
                new SiteUrl("综艺", "23-0-0-0-0-{page}"),
                new SiteUrl("动漫", "28-0-0-0-0-{page}"),
                new SiteUrl("短剧", "34-0-0-0-0-{page}"),
                new SiteUrl("体育赛事", "42-0-0-0-0-{page}"),
                new SiteUrl("纪录片", "9-0-0-0-0-{page}"),
                new SiteUrl("演唱会", "47-0-0-0-0-{page}"),
            ];
            site.forceLogin = true;
            site.loginParams = [
                { key: "Cookie", value: "请填写网站的Cookie值" },
            ];
            site.useGuide = `## 如何获取东莞影视网的Cookie值
        
1. 打开浏览器，访问东莞影视网（https://www.dgjyw.com）后并显示成功后；
2. 使用浏览器的开发者工具（通常可以通过按F12键或右键点击页面并选择“检查”来打开）。
3. 在开发者工具中，找到“应用程序”或“存储”选项卡，然后选择“Cookie”。
4. 在Cookie列表中，找到与东莞影视网相关的Cookie项，通常需要 **qnzbcnmcb=****; nxgmnmry=xxxxxx;** 即可。
5. 复制需要的Cookie键值对，并将其粘贴到扩展的登录参数中的“Cookie”字段中。
6. 保存设置后，重新启动扩展以确保更改生效。

        `;
            return site;
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                let auth = new ExtensionAuth();
                let cookie = form.get("Cookie") || "";
                auth.headers.push(new SiteHeader("Cookie", cookie));
                return auth;
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                let api = this.site.baseUrl + `/dongguanmb/` + url.replace("{page}", page.toString()) + `.html`;
                let nextApi = this.site.baseUrl + `/dongguanmb/` + url.replace("{page}", (page + 1).toString()) + `.html`;
                console.log(`Requesting item list from: ${api}`);
                const response = yield this.client.request({
                    url: api,
                    method: "GET",
                    headers: [
                        { key: "Referer", value: "https://www.dgjyw.com" },
                    ],
                    responseCharset: "gb2312",
                });
                const html = response.body;
                const $nodes = $(html);
                let items = [];
                let itemListNodes = $nodes.find("dl.B");
                itemListNodes.each((index, element) => {
                    let ele = $(element);
                    let linkNode = ele.find("dt a");
                    let link = linkNode.attr("href") || "";
                    let title = ele.find("dt a").text().trim();
                    let coverNode = ele.find("dd.imgHomeList a img");
                    let cover = coverNode.attr("data-src") || coverNode.attr("src") || "";
                    let category = ele.find("span.ysj").text().trim();
                    let status = ele.find("span.bott").text().trim();
                    let act = ele.find("dd.act").text().trim();
                    // /dongguanmv/348507/ -> 348507
                    let id = link.replace("/dongguanmv/", "").replace("/", "");
                    let item = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    item.thumbnail = this.site.baseUrl + cover;
                    item.status = status;
                    item.category = category;
                    item.description = act;
                    item.hasChapter = true;
                    item.type = 3 /* MediaType.Video */;
                    items.push(item);
                });
                let hasMore = items.length >= 60;
                return new ExtensionList(items, page, hasMore ? nextApi : undefined);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield this.client.request({
                    url: url,
                    method: "GET",
                    headers: [
                        { key: "Referer", value: "https://www.dgjyw.com" },
                    ],
                    responseCharset: "gb2312",
                });
                const html = response.body;
                const $nodes = $(html);
                let detailNode = $nodes.find("div.DinfoLeft");
                let cover = detailNode.find("div.Dimg img").attr("src") || "";
                let dinfoNode = detailNode.find("div.Dinfo");
                let title = dinfoNode.find("h1").text().trim();
                let description = dinfoNode.find("dd.xz").text().trim();
                let category = dinfoNode.find("dd").first().text().trim();
                let status = dinfoNode.find("dd.scut").text().trim();
                let author = dinfoNode.find("dd.s").text().trim();
                let item = new ExtensionDetail(id, url, title);
                item.thumbnail = this.site.baseUrl + cover;
                item.description = description;
                item.category = category;
                item.status = status;
                item.author = author;
                item.hasChapter = true;
                item.type = 3 /* MediaType.Video */;
                let volumeNode = $nodes.find("div.DinfoVolume").first();
                let chapterNodes = volumeNode.next().find("li");
                let chapters = [];
                chapterNodes.each((index, element) => {
                    let ele = $(element);
                    let chapterLinkNode = ele.find("a");
                    let chapterLink = chapterLinkNode.attr("href") || "";
                    let chapterTitle = chapterLinkNode.text().trim();
                    // /dongguanmv/613128/v1243032r2.html -> v1243032r2
                    let chapterId = chapterLink.replace(`/dongguanmv/${id}/`, "").replace(".html", "");
                    let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink, chapterTitle);
                    chapters.push(chapter);
                });
                let volume = new ItemVolume("在线观看", chapters.reverse());
                item.volumes = [volume];
                return item;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                // const response = await this.client.request(
                //     {
                //         url: url, method: "GET",
                //         headers: [
                //             { key: "Referer", value: "https://www.dgjyw.com" },
                //         ],
                //         responseCharset: "gb2312",
                //     }
                // );
                // const html = response.body;
                // const $nodes = $(html);
                // console.log(`Requesting item media from: ${html}`);
                // let title = $nodes.find("div.VR ul li.se").text().trim() || "";
                // let source = $nodes.find("video#myPlayer source").attr("src") || "";
                // let media = new VideoMedia(id, title, source, false, false);
                let media = new VideoMedia(id, "视频播放", url, true, false);
                return media;
            });
        }
    }
    (function () {
        const dgjyw = new Dgjyw();
        dgjyw.init();
    })();

    return Dgjyw;

})();
