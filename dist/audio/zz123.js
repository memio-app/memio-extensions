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
    class ExtensionMedia {
        constructor(mediaType, id, title) {
            this.mediaType = mediaType;
            this.id = id;
            this.title = title;
        }
    }
    class AudioMedia extends ExtensionMedia {
        constructor(id, title, playUrl, duration = -1, artist, thumbnail) {
            super(4 /* MediaType.Audio */, id, title);
            this.playUrl = playUrl;
            this.duration = duration;
            this.artist = artist;
            this.thumbnail = thumbnail;
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

    class Zz123 extends Rule {
        provideExtensionInfo() {
            let site = new Extension("Zz123", "ZZ123", 4 /* MediaType.Audio */);
            site.baseUrl = "https://zz123.com/ajax/";
            site.description = "热歌榜歌曲推荐音乐免费听-热歌榜500首免费在线播放-推荐下载收藏";
            site.thumbnail = "https://zz123.com/logo.png";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("热歌榜", "mxuxuu"),
                new SiteUrl("新歌榜", "mxuxzv"),
                new SiteUrl("抖音歌曲榜", "mxuxkm"),
                new SiteUrl("DJ嗨歌榜", "mxuxds"),
                new SiteUrl("极品电音榜", "mxuxkd"),
                new SiteUrl("流行趋势榜", "mxuxkz"),
                new SiteUrl("彩铃榜", "mxuass"),
                new SiteUrl("尖叫热歌榜", "mxuask"),
                new SiteUrl("飙升榜", "mxuxvd"),
                new SiteUrl("台湾地区榜", "mxuxqk"),
                new SiteUrl("欧美榜", "mxuxqq"),
                new SiteUrl("韩国榜", "mxuaxv"),
                new SiteUrl("香港地区榜", "mxuaxd"),
                new SiteUrl("日本榜", "mxuaaa"),
                new SiteUrl("内地榜", "mxuaak"),
                new SiteUrl("港台榜", "mxuasv"),
                new SiteUrl("越南语榜", "mxuxux"),
                new SiteUrl("Beatport全球电子舞曲榜", "mxuxuk"),
                new SiteUrl("日本Oricon榜", "mxuxuq"),
                new SiteUrl("美国BillBoard榜", "mxuamx"),
                new SiteUrl("美国iTunes榜", "mxuavu"),
                new SiteUrl("听歌识曲榜", "mxuxda"),
                new SiteUrl("睡前放松榜", "mxuxdd"),
                new SiteUrl("禅心佛乐榜", "mxuxku"),
                new SiteUrl("酷我铃声榜", "mxuxdz"),
                new SiteUrl("酷我热评榜", "mxuxdk"),
                new SiteUrl("酷我综艺榜", "mxuxkx"),
                new SiteUrl("酷我新歌榜", "mxuasq"),
                new SiteUrl("酷我飙升榜", "mxuavx"),
                new SiteUrl("酷我热歌榜", "mxuava"),
                new SiteUrl("酷狗音乐人原创榜", "mxuaxm"),
                new SiteUrl("酷狗分享榜", "mxuaad"),
                new SiteUrl("酷狗飙升榜", "mxuams"),
                new SiteUrl("云音乐韩语榜", "mxuxud"),
                new SiteUrl("云音乐古典榜", "mxuxzx"),
                new SiteUrl("云音乐ACG VOCALOID榜", "mxuxza"),
                new SiteUrl("云音乐ACG动画榜", "mxuxzk"),
                new SiteUrl("云音乐国电榜", "mxuxvk"),
                new SiteUrl("云音乐欧美热歌榜", "mxuxvq"),
                new SiteUrl("云音乐欧美新歌榜", "mxuxum"),
                new SiteUrl("云音乐ACG游戏榜", "mxuxus"),
                new SiteUrl("原创榜", "mxuxuz"),
                new SiteUrl("潜力爆款榜", "mxuxzm"),
                new SiteUrl("最强翻唱榜", "mxuxdv"),
                new SiteUrl("通勤路上榜", "mxuxdu"),
                new SiteUrl("网红新歌榜", "mxuxdq"),
                new SiteUrl("会员畅听榜", "mxuxka"),
                new SiteUrl("冬日恋曲榜", "mxuxks"),
                new SiteUrl("宝宝哄睡榜", "mxuxkv"),
                new SiteUrl("经典怀旧榜", "mxuxkk"),
                new SiteUrl("跑步健身榜", "mxuxkq"),
                new SiteUrl("古风音乐榜", "mxuxqx"),
                new SiteUrl("KTV点唱榜", "mxuxqa"),
                new SiteUrl("车载嗨曲榜", "mxuxqm"),
                new SiteUrl("熬夜修仙榜", "mxuxqs"),
                new SiteUrl("Vlog必备榜", "mxuxqv"),
                new SiteUrl("爆笑相声榜", "mxuxqu"),
                new SiteUrl("DJ热歌榜", "mxuaax"),
                new SiteUrl("快手热歌榜", "mxuaas"),
                new SiteUrl("尖叫新歌榜", "mxuaav"),
                new SiteUrl("影视金曲榜", "mxuaau"),
                new SiteUrl("俄语榜", "mxuavm"),
                new SiteUrl("KTV榜", "mxuavz"),
                new SiteUrl("尖叫原创榜", "mxuavd"),
                new SiteUrl("法国 NRJ Vos Hits 周榜", "mxuxua"),
            ];
            site.searchList = [
                new SiteUrl("搜索", "search"),
            ];
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = this.site.baseUrl;
                let formData = "act=tag_music&type=tuijian&tid={tid}&lang=&page={page}".replace("{tid}", url).replace("{page}", page.toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl, method: "POST",
                    contentType: "application/x-www-form-urlencoded",
                    headers: [
                        { key: "accept", value: "application/json" },
                        { key: "Content-Type", value: "application/x-www-form-urlencoded" }
                    ],
                    body: formData,
                }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlistObj = JSON.parse(htmlResponse.body);
                if (playlistObj.status != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlists = playlistObj.data;
                var items = [];
                playlists.forEach((playlist) => {
                    let id = playlist.id;
                    let url = id.toString();
                    let title = playlist.mname;
                    let item = new ExtensionDetail(id, url, title);
                    item.thumbnail = playlist.pic;
                    item.status = playlist.play_time;
                    item.author = playlist.sname;
                    item.type = 4 /* MediaType.Audio */;
                    items.push(item);
                });
                var disableNext = items.length < 50;
                return new ExtensionList(items, page, disableNext ? undefined : url);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = this.site.baseUrl;
                let formData = "act=search&key={keyword}&lang=&page={page}".replace("{keyword}", keyword).replace("{page}", page.toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl, method: "POST",
                    contentType: "application/x-www-form-urlencoded",
                    headers: [
                        { key: "accept", value: "application/json" },
                        { key: "Content-Type", value: "application/x-www-form-urlencoded" }
                    ],
                    body: formData,
                }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlistObj = JSON.parse(htmlResponse.body);
                if (playlistObj.status != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlists = playlistObj.data;
                var items = [];
                playlists.forEach((playlist) => {
                    let id = playlist.id;
                    let url = id.toString();
                    let title = playlist.mname;
                    let item = new ExtensionDetail(id, url, title);
                    item.thumbnail = playlist.pic;
                    item.status = playlist.play_time;
                    item.author = playlist.sname;
                    item.type = 4 /* MediaType.Audio */;
                    items.push(item);
                });
                var disableNext = items.length < 50;
                return new ExtensionList(items, page, disableNext ? undefined : url);
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = this.site.baseUrl;
                let formData = "act=songinfo&id={id}&lang=".replace("{id}", id);
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({
                    url: realUrl, method: "POST",
                    contentType: "application/x-www-form-urlencoded",
                    headers: [
                        { key: "accept", value: "application/json" },
                        { key: "Content-Type", value: "application/x-www-form-urlencoded" }
                    ],
                    body: formData,
                }));
                if (htmlResponse.statusCode != 200) {
                    return new AudioMedia("-1", "", "", -1);
                }
                let songObj = JSON.parse(htmlResponse.body);
                if (songObj.status != 200) {
                    return new AudioMedia("-1", "", "", -1);
                }
                let song = songObj.data;
                let name = song.mname;
                let artist = song.artist;
                let playUrl = song.mp3;
                let thumbnail = song.pic;
                let duration = this.timeStringToSeconds(song.playtime);
                let media = new AudioMedia(id, name, playUrl, duration, artist, thumbnail);
                return media;
            });
        }
        timeStringToSeconds(timeString) {
            if (timeString === undefined) {
                return -1;
            }
            const parts = timeString.split(':').map(Number);
            if (parts.length == 3) {
                const [hours, minutes, seconds] = parts;
                return hours * 3600 + minutes * 60 + seconds;
            }
            else if (parts.length == 2) {
                const [minutes, seconds] = parts;
                return minutes * 60 + seconds;
            }
            else if (parts.length == 1) {
                const [seconds] = parts;
                return seconds;
            }
            else {
                return 0;
            }
        }
    }
    (function () {
        const zz = new Zz123();
        zz.init();
    })();

    return Zz123;

})();
