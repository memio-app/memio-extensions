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
    class Channel {
        constructor(type = 0 /* ChannelType.List */, name, value) {
            this.type = type;
            this.name = name;
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

    // parse date to "YYYY,MM/DD" format
    function formatDateToYMD(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Months are zero-based
        const day = date.getDate();
        return `${year},${month}/${day}`;
    }

    class Steno extends Rule {
        constructor() {
            super(...arguments);
            this.mediaMap = new Map();
        }
        provideExtensionInfo() {
            let site = new Extension("steno", "steno.fm", 4 /* MediaType.Audio */);
            site.baseUrl = "https://www.steno.fm";
            site.description = "We’re building the home for podcast transcripts.";
            site.thumbnail = "https://www.steno.fm/logo-192.png";
            site.lang = "en";
            site.categoryList = [];
            site.searchList = [{
                    name: "Search", url: "https://itunes.apple.com/search?term={keyword}&limit=15&media=podcast"
                }];
            site.channel = new Channel(0 /* ChannelType.List */, "播客频道ID", "podcast");
            // site.script = [
            //     new SiteUrl("jquery", ""),
            //     new SiteUrl("crypto", ""),
            // ]
            site.useGuide = `## How to find Podcast ID
1. Open the [steno.fm](https://www.steno.fm) website and search for the podcast you are interested in.
2. Click on the podcast to go to its main page.
3. Look at the URL in your browser's address bar. The URL will be in the format \`https://www.steno.fm/podcast/{podcast-id}\`.
4. The \`{podcast-id}\` part of the URL is the Podcast ID you need.
5. Copy and paste this Podcast ID into the channel ID input box of this extension to subscribe to the podcast.
`;
            return site;
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                return new ExtensionList([], page, undefined);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let searchApi = url.replace("{keyword}", encodeURIComponent(keyword));
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: searchApi, method: "GET" }));
                let json = JSON.parse(response.body);
                let results = json.results;
                let items = [];
                results.forEach((item) => {
                    var _a, _b;
                    let id = item.collectionId.toString();
                    let title = item.collectionName;
                    let thumbnail = (_b = (_a = item.artworkUrl100) !== null && _a !== void 0 ? _a : item.artworkUrl600) !== null && _b !== void 0 ? _b : item.artworkUrl60;
                    let author = item.artistName;
                    let category = item.primaryGenreName;
                    let date = item.releaseDate;
                    let dateTxt = formatDateToYMD(date);
                    let status = item.trackCount + " tracks";
                    // https://www.steno.fm/api/redirect?itunesID=1696511339
                    let link = `${this.provideExtensionInfo().baseUrl}/api/redirect?itunesID=${id}`;
                    let detail = new ExtensionDetail(id, link, title);
                    detail.thumbnail = thumbnail;
                    detail.author = author;
                    detail.category = category;
                    detail.status = status;
                    detail.description = dateTxt;
                    detail.hasChapter = true;
                    detail.type = 4 /* MediaType.Audio */;
                    items.push(detail);
                });
                return new ExtensionList(items, page, undefined);
            });
        }
        searchHtmlScriptElement(html) {
            let $nodes = $(html);
            let jsonString = "";
            $nodes.each((index, element) => {
                if (element instanceof HTMLScriptElement) {
                    if (element.id === "__NEXT_DATA__") {
                        let scriptContent = element.innerHTML;
                        jsonString = scriptContent;
                        return false; // Exit the each loop
                    }
                }
            });
            return jsonString;
        }
        requestChannelList(key, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814
                let podcastUrl = `${this.site.baseUrl}/show/${key}`;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: podcastUrl, method: "GET" }));
                let html = response.body;
                let jsonString = this.searchHtmlScriptElement(html);
                let eps = [];
                try {
                    let jsonData = JSON.parse(jsonString);
                    let podcastData = jsonData.props.pageProps;
                    let podcast = podcastData.show;
                    let podcastId = podcastData.showId;
                    let episodes = podcastData.episodes;
                    let podcastCover = (_b = podcast.image) !== null && _b !== void 0 ? _b : "";
                    let author = podcast.author;
                    this.mediaMap.clear();
                    episodes.forEach((ep) => {
                        let id = ep.guid;
                        let title = ep.title;
                        // let guid = base64Encode(id);
                        let guid = btoa(id);
                        // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl
                        let url = `${this.site.baseUrl}/show/${podcastId}/episode/${guid}`;
                        let description = ep.description || "";
                        let date = ep.datePublishedPretty;
                        let cover = ep.image.length > 0 ? ep.image : podcastCover;
                        let playUrl = ep.enclosureUrl;
                        let duration = ep.duration;
                        let episode = new ExtensionDetail(id, url, title);
                        episode.author = author;
                        episode.description = description;
                        episode.status = "";
                        episode.hasChapter = false;
                        episode.thumbnail = cover;
                        episode.type = 4 /* MediaType.Audio */;
                        episode.category = date;
                        eps.push(episode);
                        let audioMedia = new AudioMedia(id, title, playUrl, duration);
                        audioMedia.artist = author;
                        audioMedia.thumbnail = cover;
                        this.mediaMap.set(id, audioMedia);
                    });
                }
                catch (error) {
                    console.error("Failed to parse JSON data:", error);
                    return new ExtensionList([], page, undefined);
                }
                return new ExtensionList(eps, page, undefined);
            });
        }
        // enter from search
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                let html = response.body;
                let jsonString = this.searchHtmlScriptElement(html);
                try {
                    let jsonData = JSON.parse(jsonString);
                    let podcastData = jsonData.props.pageProps;
                    let podcast = podcastData.show;
                    let podcastId = podcastData.showId;
                    let episodes = podcastData.episodes;
                    let podcastCover = (_b = podcast.image) !== null && _b !== void 0 ? _b : "";
                    let author = podcast.author;
                    let podcastDetail = new ExtensionDetail(id, url, podcast.title);
                    podcastDetail.author = author;
                    podcastDetail.description = podcast.description;
                    podcastDetail.thumbnail = podcastCover;
                    podcastDetail.hasChapter = true;
                    podcastDetail.type = 4 /* MediaType.Audio */;
                    podcastDetail.status = podcast.episodeCount + " episodes";
                    let chapters = [];
                    episodes.forEach((ep) => {
                        let id = ep.guid;
                        let title = ep.title;
                        // let guid = base64Encode(id);
                        let guid = btoa(id);
                        // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl
                        let url = `${this.site.baseUrl}/show/${podcastId}/episode/${guid}`;
                        let cover = ep.image.length > 0 ? ep.image : podcastCover;
                        let playUrl = ep.enclosureUrl;
                        let duration = ep.duration;
                        let episode = new ItemChapter(id, url, title);
                        chapters.push(episode);
                        let audioMedia = new AudioMedia(id, title, playUrl, duration);
                        audioMedia.artist = author;
                        audioMedia.thumbnail = cover;
                        this.mediaMap.set(id, audioMedia);
                    });
                    let volumes = new ItemVolume("EPISODES", chapters);
                    podcastDetail.volumes = [volumes];
                    return podcastDetail;
                }
                catch (error) {
                    console.error("Failed to parse JSON data:", error);
                    return new ExtensionDetail("-1", "", "Error");
                }
            });
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let audioMedia = this.mediaMap.get(id);
                if (audioMedia) {
                    return audioMedia;
                }
                let response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: url, method: "GET" }));
                let html = response.body;
                let jsonString = this.searchHtmlScriptElement(html);
                try {
                    let jsonData = JSON.parse(jsonString);
                    let podcastData = jsonData.props.pageProps;
                    let podcast = podcastData.show;
                    let podcastCover = (_b = podcast.image) !== null && _b !== void 0 ? _b : "";
                    let author = podcast.author;
                    let ep = podcastData.episode;
                    let id = ep.guid;
                    let title = ep.title;
                    let cover = (_c = ep.image) !== null && _c !== void 0 ? _c : podcastCover;
                    let playUrl = ep.enclosureUrl;
                    let duration = ep.duration;
                    let audioMedia = new AudioMedia(id, title, playUrl, duration);
                    audioMedia.artist = author;
                    audioMedia.thumbnail = cover;
                    this.mediaMap.set(id, audioMedia);
                    return audioMedia;
                }
                catch (error) {
                    console.error("Failed to parse JSON data:", error);
                }
                return new AudioMedia("-1", "Not Found", "", 0);
            });
        }
    }
    (function () {
        const steno = new Steno();
        steno.init();
    })();

    return Steno;

})();
