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
            this.baseUrl = "http://localhost";
            this.categoryList = [];
            this.searchList = [];
            this.hasChapter = false;
            this.configParams = [];
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
                        console.log("auth", auth);
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

    // https://binaryify.github.io/NeteaseCloudMusicApi
    class NeteasePlaylistApi extends Rule {
        constructor() {
            super(...arguments);
            this.isSendCaptcha = true;
            this.host = "http://localhost";
        }
        //host = 'https://neteasecloudmusicapi.vercel.app';
        provideExtensionInfo() {
            let site = new Extension("NeteasePlaylist", "网易云歌单", 4 /* MediaType.Audio */);
            site.baseUrl = this.host;
            site.description = "基于自建服务，跨站请求伪造 (CSRF)，伪造请求头，调用官方 API";
            site.thumbnail = "https://p3.music.126.net/tBTNafgjNnTL1KlZMt7lVA==/18885211718935735.jpg";
            site.lang = "zh";
            site.categoryList = [
                new SiteUrl("歌单(华语)", "/top/playlist?cat=华语"),
                new SiteUrl("歌单(流行)", "/top/playlist?cat=流行"),
                new SiteUrl("歌单(ACG)", "/top/playlist?cat=ACG"),
                new SiteUrl("歌单(摇滚)", "/top/playlist?cat=摇滚"),
                new SiteUrl("歌单(民谣)", "/top/playlist?cat=民谣"),
                new SiteUrl("歌单(影视原声)", "/top/playlist?cat=影视原声"),
                new SiteUrl("歌单(轻音乐)", "/top/playlist?cat=轻音乐"),
                new SiteUrl("歌单(电子)", "/top/playlist?cat=电子"),
                new SiteUrl("歌单(综艺)", "/top/playlist?cat=综艺"),
            ];
            site.searchList = [
                new SiteUrl("搜索歌单", "/cloudsearch?type=1000"),
            ];
            site.configParams = [{ key: "host", value: "服务器地址" }];
            site.loginParams = [
                { key: "username", value: "手机号" },
                { key: "captcha", value: "验证码（需要先登录获取验证码）" },
            ];
            site.hasChapter = true;
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var realUrl = this.host + url + "&limit=50" + "&offset=" + ((page - 1) * 50).toString();
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlistObj = JSON.parse(htmlResponse.body);
                let total = playlistObj.total;
                let playlists = playlistObj.playlists;
                var items = [];
                playlists.forEach((playlist) => {
                    let id = playlist.id;
                    let url = "/playlist/detail?id=" + id.toString();
                    let title = playlist.name;
                    let item = new ExtensionDetail(id, url, title);
                    item.thumbnail = playlist.coverImgUrl;
                    item.description = playlist.description;
                    item.status = playlist.updateFrequency;
                    item.author = playlist.creator.nickname;
                    item.category = playlist.tags.join(",");
                    items.push(item);
                });
                var disableNext = total <= page * 50;
                return new ExtensionList(items, page, disableNext ? undefined : url);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = this.host + url + "&keywords=" + encodeURIComponent(keyword) + "&limit=30" + "&offset=" + ((page - 1) * 30).toString();
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionList([], page, undefined);
                }
                let playlistObj = JSON.parse(htmlResponse.body);
                let total = playlistObj.result.playlistCount;
                let playlists = playlistObj.result.playlists;
                var items = [];
                playlists.forEach((playlist) => {
                    let id = playlist.id;
                    let url = "/playlist/detail?id=" + id.toString();
                    let title = playlist.name;
                    let item = new ExtensionDetail(id, url, title);
                    item.thumbnail = playlist.coverImgUrl;
                    item.description = playlist.description;
                    item.author = playlist.creator.nickname;
                    items.push(item);
                });
                var disableNext = total <= page * 30;
                return new ExtensionList(items, page, disableNext ? undefined : url);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let realUrl = this.host + url;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionDetail("-1", "", "");
                }
                let playlistObj = JSON.parse(htmlResponse.body);
                let playlist = playlistObj.playlist;
                let pid = playlist.id;
                let title = playlist.name;
                let item = new ExtensionDetail(pid, url, title);
                item.thumbnail = playlist.coverImgUrl;
                item.description = playlist.description;
                item.status = playlist.updateFrequency;
                item.author = playlist.creator.nickname;
                item.category = playlist.tags.join(",");
                let playlistId = id !== null && id !== void 0 ? id : pid;
                let songsUrl = this.host + "/playlist/track/all?id=" + playlistId;
                var indexResponse = yield ((_b = this.client) === null || _b === void 0 ? void 0 : _b.request({ url: songsUrl, method: "GET" }));
                let songsObj = JSON.parse(indexResponse.body);
                let songs = songsObj.songs;
                item.volumes = [];
                let tempVolume = new ItemVolume("歌曲列表", []);
                songs.forEach((song) => {
                    let sid = song.id;
                    let title = song.name;
                    let link = "/song/url?id=" + sid.toString();
                    let item = new ItemChapter(sid, link, title);
                    tempVolume.chapters.push(item);
                });
                item.volumes.push(tempVolume);
                return item;
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let realUrl = this.host + url;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: realUrl, method: "GET" }));
                if (htmlResponse.statusCode != 200) {
                    return new AudioMedia("-1", "", "", -1);
                }
                let songObj = JSON.parse(htmlResponse.body);
                let songs = songObj.data;
                let playlist = [];
                songs.forEach((song) => { playlist.push(song.url); });
                let media = new AudioMedia(id, "", playlist.length > 0 ? playlist[0] : "", -1);
                return media;
            });
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                this.host = (_a = form.get("host")) !== null && _a !== void 0 ? _a : "";
                this.host = this.host.endsWith("/") ? this.host.substring(0, this.host.length - 1) : this.host;
                if (this.host == "" || this.host == "http://localhost") {
                    return false;
                }
                return true;
            });
        }
        loginForm(form) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                let username = (_a = form.get("username")) !== null && _a !== void 0 ? _a : "";
                let captcha = (_b = form.get("captcha")) !== null && _b !== void 0 ? _b : "";
                if (username == "") {
                    this.isSendCaptcha = true;
                    return new ExtensionAuth();
                }
                if (this.isSendCaptcha && captcha == "") {
                    let captchaUrl = this.host + "/captcha/sent?phone=" + username;
                    yield ((_c = this.client) === null || _c === void 0 ? void 0 : _c.request({
                        url: captchaUrl, method: "GET",
                    }));
                    this.isSendCaptcha = false;
                    return new ExtensionAuth();
                }
                if (captcha == "") {
                    this.isSendCaptcha = true;
                    return new ExtensionAuth();
                }
                let url = this.host + "/login/cellphone" + "?phone=" + username + '&captcha=' + captcha + '&timestamp=' + new Date().getTime().toString();
                let htmlResponse = yield ((_d = this.client) === null || _d === void 0 ? void 0 : _d.request({
                    url: url, method: "GET", responseHeaders: ["set-cookie"]
                }));
                if (htmlResponse.statusCode != 200) {
                    return new ExtensionAuth();
                }
                var extensionAuth = new ExtensionAuth();
                const resHeaders = htmlResponse === null || htmlResponse === void 0 ? void 0 : htmlResponse.headers;
                resHeaders.forEach((header) => {
                    if (header.key.toLowerCase() == "set-cookie") {
                        extensionAuth.headers.push(new SiteHeader(header.key, header.value));
                    }
                });
                return extensionAuth;
            });
        }
    }
    (function () {
        const npl = new NeteasePlaylistApi();
        npl.init();
    })();

})();
