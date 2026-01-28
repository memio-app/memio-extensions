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

    var lzString = {exports: {}};

    var hasRequiredLzString;

    function requireLzString () {
    	if (hasRequiredLzString) return lzString.exports;
    	hasRequiredLzString = 1;
    	(function (module) {
    		// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
    		// This work is free. You can redistribute it and/or modify it
    		// under the terms of the WTFPL, Version 2
    		// For more information see LICENSE.txt or http://www.wtfpl.net/
    		//
    		// For more information, the home page:
    		// http://pieroxy.net/blog/pages/lz-string/testing.html
    		//
    		// LZ-based compression algorithm, version 1.4.5
    		var LZString = (function() {

    		// private property
    		var f = String.fromCharCode;
    		var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    		var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
    		var baseReverseDic = {};

    		function getBaseValue(alphabet, character) {
    		  if (!baseReverseDic[alphabet]) {
    		    baseReverseDic[alphabet] = {};
    		    for (var i=0 ; i<alphabet.length ; i++) {
    		      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    		    }
    		  }
    		  return baseReverseDic[alphabet][character];
    		}

    		var LZString = {
    		  compressToBase64 : function (input) {
    		    if (input == null) return "";
    		    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    		    switch (res.length % 4) { // To produce valid Base64
    		    default: // When could this happen ?
    		    case 0 : return res;
    		    case 1 : return res+"===";
    		    case 2 : return res+"==";
    		    case 3 : return res+"=";
    		    }
    		  },

    		  decompressFromBase64 : function (input) {
    		    if (input == null) return "";
    		    if (input == "") return null;
    		    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
    		  },

    		  compressToUTF16 : function (input) {
    		    if (input == null) return "";
    		    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
    		  },

    		  decompressFromUTF16: function (compressed) {
    		    if (compressed == null) return "";
    		    if (compressed == "") return null;
    		    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
    		  },

    		  //compress into uint8array (UCS-2 big endian format)
    		  compressToUint8Array: function (uncompressed) {
    		    var compressed = LZString.compress(uncompressed);
    		    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    		    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
    		      var current_value = compressed.charCodeAt(i);
    		      buf[i*2] = current_value >>> 8;
    		      buf[i*2+1] = current_value % 256;
    		    }
    		    return buf;
    		  },

    		  //decompress from uint8array (UCS-2 big endian format)
    		  decompressFromUint8Array:function (compressed) {
    		    if (compressed===null || compressed===undefined){
    		        return LZString.decompress(compressed);
    		    } else {
    		        var buf=new Array(compressed.length/2); // 2 bytes per character
    		        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
    		          buf[i]=compressed[i*2]*256+compressed[i*2+1];
    		        }

    		        var result = [];
    		        buf.forEach(function (c) {
    		          result.push(f(c));
    		        });
    		        return LZString.decompress(result.join(''));

    		    }

    		  },


    		  //compress into a string that is already URI encoded
    		  compressToEncodedURIComponent: function (input) {
    		    if (input == null) return "";
    		    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
    		  },

    		  //decompress from an output of compressToEncodedURIComponent
    		  decompressFromEncodedURIComponent:function (input) {
    		    if (input == null) return "";
    		    if (input == "") return null;
    		    input = input.replace(/ /g, "+");
    		    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
    		  },

    		  compress: function (uncompressed) {
    		    return LZString._compress(uncompressed, 16, function(a){return f(a);});
    		  },
    		  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    		    if (uncompressed == null) return "";
    		    var i, value,
    		        context_dictionary= {},
    		        context_dictionaryToCreate= {},
    		        context_c="",
    		        context_wc="",
    		        context_w="",
    		        context_enlargeIn= 2, // Compensate for the first entry which should not count
    		        context_dictSize= 3,
    		        context_numBits= 2,
    		        context_data=[],
    		        context_data_val=0,
    		        context_data_position=0,
    		        ii;

    		    for (ii = 0; ii < uncompressed.length; ii += 1) {
    		      context_c = uncompressed.charAt(ii);
    		      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
    		        context_dictionary[context_c] = context_dictSize++;
    		        context_dictionaryToCreate[context_c] = true;
    		      }

    		      context_wc = context_w + context_c;
    		      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
    		        context_w = context_wc;
    		      } else {
    		        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
    		          if (context_w.charCodeAt(0)<256) {
    		            for (i=0 ; i<context_numBits ; i++) {
    		              context_data_val = (context_data_val << 1);
    		              if (context_data_position == bitsPerChar-1) {
    		                context_data_position = 0;
    		                context_data.push(getCharFromInt(context_data_val));
    		                context_data_val = 0;
    		              } else {
    		                context_data_position++;
    		              }
    		            }
    		            value = context_w.charCodeAt(0);
    		            for (i=0 ; i<8 ; i++) {
    		              context_data_val = (context_data_val << 1) | (value&1);
    		              if (context_data_position == bitsPerChar-1) {
    		                context_data_position = 0;
    		                context_data.push(getCharFromInt(context_data_val));
    		                context_data_val = 0;
    		              } else {
    		                context_data_position++;
    		              }
    		              value = value >> 1;
    		            }
    		          } else {
    		            value = 1;
    		            for (i=0 ; i<context_numBits ; i++) {
    		              context_data_val = (context_data_val << 1) | value;
    		              if (context_data_position ==bitsPerChar-1) {
    		                context_data_position = 0;
    		                context_data.push(getCharFromInt(context_data_val));
    		                context_data_val = 0;
    		              } else {
    		                context_data_position++;
    		              }
    		              value = 0;
    		            }
    		            value = context_w.charCodeAt(0);
    		            for (i=0 ; i<16 ; i++) {
    		              context_data_val = (context_data_val << 1) | (value&1);
    		              if (context_data_position == bitsPerChar-1) {
    		                context_data_position = 0;
    		                context_data.push(getCharFromInt(context_data_val));
    		                context_data_val = 0;
    		              } else {
    		                context_data_position++;
    		              }
    		              value = value >> 1;
    		            }
    		          }
    		          context_enlargeIn--;
    		          if (context_enlargeIn == 0) {
    		            context_enlargeIn = Math.pow(2, context_numBits);
    		            context_numBits++;
    		          }
    		          delete context_dictionaryToCreate[context_w];
    		        } else {
    		          value = context_dictionary[context_w];
    		          for (i=0 ; i<context_numBits ; i++) {
    		            context_data_val = (context_data_val << 1) | (value&1);
    		            if (context_data_position == bitsPerChar-1) {
    		              context_data_position = 0;
    		              context_data.push(getCharFromInt(context_data_val));
    		              context_data_val = 0;
    		            } else {
    		              context_data_position++;
    		            }
    		            value = value >> 1;
    		          }


    		        }
    		        context_enlargeIn--;
    		        if (context_enlargeIn == 0) {
    		          context_enlargeIn = Math.pow(2, context_numBits);
    		          context_numBits++;
    		        }
    		        // Add wc to the dictionary.
    		        context_dictionary[context_wc] = context_dictSize++;
    		        context_w = String(context_c);
    		      }
    		    }

    		    // Output the code for w.
    		    if (context_w !== "") {
    		      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
    		        if (context_w.charCodeAt(0)<256) {
    		          for (i=0 ; i<context_numBits ; i++) {
    		            context_data_val = (context_data_val << 1);
    		            if (context_data_position == bitsPerChar-1) {
    		              context_data_position = 0;
    		              context_data.push(getCharFromInt(context_data_val));
    		              context_data_val = 0;
    		            } else {
    		              context_data_position++;
    		            }
    		          }
    		          value = context_w.charCodeAt(0);
    		          for (i=0 ; i<8 ; i++) {
    		            context_data_val = (context_data_val << 1) | (value&1);
    		            if (context_data_position == bitsPerChar-1) {
    		              context_data_position = 0;
    		              context_data.push(getCharFromInt(context_data_val));
    		              context_data_val = 0;
    		            } else {
    		              context_data_position++;
    		            }
    		            value = value >> 1;
    		          }
    		        } else {
    		          value = 1;
    		          for (i=0 ; i<context_numBits ; i++) {
    		            context_data_val = (context_data_val << 1) | value;
    		            if (context_data_position == bitsPerChar-1) {
    		              context_data_position = 0;
    		              context_data.push(getCharFromInt(context_data_val));
    		              context_data_val = 0;
    		            } else {
    		              context_data_position++;
    		            }
    		            value = 0;
    		          }
    		          value = context_w.charCodeAt(0);
    		          for (i=0 ; i<16 ; i++) {
    		            context_data_val = (context_data_val << 1) | (value&1);
    		            if (context_data_position == bitsPerChar-1) {
    		              context_data_position = 0;
    		              context_data.push(getCharFromInt(context_data_val));
    		              context_data_val = 0;
    		            } else {
    		              context_data_position++;
    		            }
    		            value = value >> 1;
    		          }
    		        }
    		        context_enlargeIn--;
    		        if (context_enlargeIn == 0) {
    		          context_enlargeIn = Math.pow(2, context_numBits);
    		          context_numBits++;
    		        }
    		        delete context_dictionaryToCreate[context_w];
    		      } else {
    		        value = context_dictionary[context_w];
    		        for (i=0 ; i<context_numBits ; i++) {
    		          context_data_val = (context_data_val << 1) | (value&1);
    		          if (context_data_position == bitsPerChar-1) {
    		            context_data_position = 0;
    		            context_data.push(getCharFromInt(context_data_val));
    		            context_data_val = 0;
    		          } else {
    		            context_data_position++;
    		          }
    		          value = value >> 1;
    		        }


    		      }
    		      context_enlargeIn--;
    		      if (context_enlargeIn == 0) {
    		        context_enlargeIn = Math.pow(2, context_numBits);
    		        context_numBits++;
    		      }
    		    }

    		    // Mark the end of the stream
    		    value = 2;
    		    for (i=0 ; i<context_numBits ; i++) {
    		      context_data_val = (context_data_val << 1) | (value&1);
    		      if (context_data_position == bitsPerChar-1) {
    		        context_data_position = 0;
    		        context_data.push(getCharFromInt(context_data_val));
    		        context_data_val = 0;
    		      } else {
    		        context_data_position++;
    		      }
    		      value = value >> 1;
    		    }

    		    // Flush the last char
    		    while (true) {
    		      context_data_val = (context_data_val << 1);
    		      if (context_data_position == bitsPerChar-1) {
    		        context_data.push(getCharFromInt(context_data_val));
    		        break;
    		      }
    		      else context_data_position++;
    		    }
    		    return context_data.join('');
    		  },

    		  decompress: function (compressed) {
    		    if (compressed == null) return "";
    		    if (compressed == "") return null;
    		    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
    		  },

    		  _decompress: function (length, resetValue, getNextValue) {
    		    var dictionary = [],
    		        enlargeIn = 4,
    		        dictSize = 4,
    		        numBits = 3,
    		        entry = "",
    		        result = [],
    		        i,
    		        w,
    		        bits, resb, maxpower, power,
    		        c,
    		        data = {val:getNextValue(0), position:resetValue, index:1};

    		    for (i = 0; i < 3; i += 1) {
    		      dictionary[i] = i;
    		    }

    		    bits = 0;
    		    maxpower = Math.pow(2,2);
    		    power=1;
    		    while (power!=maxpower) {
    		      resb = data.val & data.position;
    		      data.position >>= 1;
    		      if (data.position == 0) {
    		        data.position = resetValue;
    		        data.val = getNextValue(data.index++);
    		      }
    		      bits |= (resb>0 ? 1 : 0) * power;
    		      power <<= 1;
    		    }

    		    switch (bits) {
    		      case 0:
    		          bits = 0;
    		          maxpower = Math.pow(2,8);
    		          power=1;
    		          while (power!=maxpower) {
    		            resb = data.val & data.position;
    		            data.position >>= 1;
    		            if (data.position == 0) {
    		              data.position = resetValue;
    		              data.val = getNextValue(data.index++);
    		            }
    		            bits |= (resb>0 ? 1 : 0) * power;
    		            power <<= 1;
    		          }
    		        c = f(bits);
    		        break;
    		      case 1:
    		          bits = 0;
    		          maxpower = Math.pow(2,16);
    		          power=1;
    		          while (power!=maxpower) {
    		            resb = data.val & data.position;
    		            data.position >>= 1;
    		            if (data.position == 0) {
    		              data.position = resetValue;
    		              data.val = getNextValue(data.index++);
    		            }
    		            bits |= (resb>0 ? 1 : 0) * power;
    		            power <<= 1;
    		          }
    		        c = f(bits);
    		        break;
    		      case 2:
    		        return "";
    		    }
    		    dictionary[3] = c;
    		    w = c;
    		    result.push(c);
    		    while (true) {
    		      if (data.index > length) {
    		        return "";
    		      }

    		      bits = 0;
    		      maxpower = Math.pow(2,numBits);
    		      power=1;
    		      while (power!=maxpower) {
    		        resb = data.val & data.position;
    		        data.position >>= 1;
    		        if (data.position == 0) {
    		          data.position = resetValue;
    		          data.val = getNextValue(data.index++);
    		        }
    		        bits |= (resb>0 ? 1 : 0) * power;
    		        power <<= 1;
    		      }

    		      switch (c = bits) {
    		        case 0:
    		          bits = 0;
    		          maxpower = Math.pow(2,8);
    		          power=1;
    		          while (power!=maxpower) {
    		            resb = data.val & data.position;
    		            data.position >>= 1;
    		            if (data.position == 0) {
    		              data.position = resetValue;
    		              data.val = getNextValue(data.index++);
    		            }
    		            bits |= (resb>0 ? 1 : 0) * power;
    		            power <<= 1;
    		          }

    		          dictionary[dictSize++] = f(bits);
    		          c = dictSize-1;
    		          enlargeIn--;
    		          break;
    		        case 1:
    		          bits = 0;
    		          maxpower = Math.pow(2,16);
    		          power=1;
    		          while (power!=maxpower) {
    		            resb = data.val & data.position;
    		            data.position >>= 1;
    		            if (data.position == 0) {
    		              data.position = resetValue;
    		              data.val = getNextValue(data.index++);
    		            }
    		            bits |= (resb>0 ? 1 : 0) * power;
    		            power <<= 1;
    		          }
    		          dictionary[dictSize++] = f(bits);
    		          c = dictSize-1;
    		          enlargeIn--;
    		          break;
    		        case 2:
    		          return result.join('');
    		      }

    		      if (enlargeIn == 0) {
    		        enlargeIn = Math.pow(2, numBits);
    		        numBits++;
    		      }

    		      if (dictionary[c]) {
    		        entry = dictionary[c];
    		      } else {
    		        if (c === dictSize) {
    		          entry = w + w.charAt(0);
    		        } else {
    		          return null;
    		        }
    		      }
    		      result.push(entry);

    		      // Add w+entry[0] to the dictionary.
    		      dictionary[dictSize++] = w + entry.charAt(0);
    		      enlargeIn--;

    		      w = entry;

    		      if (enlargeIn == 0) {
    		        enlargeIn = Math.pow(2, numBits);
    		        numBits++;
    		      }

    		    }
    		  }
    		};
    		  return LZString;
    		})();

    		if( module != null ) {
    		  module.exports = LZString;
    		} else if( typeof angular !== 'undefined' && angular != null ) {
    		  angular.module('LZString', [])
    		  .factory('LZString', function () {
    		    return LZString;
    		  });
    		} 
    	} (lzString));
    	return lzString.exports;
    }

    var lzStringExports = requireLzString();

    String.prototype.splic = function (f) {
        return (lzStringExports.decompressFromBase64(String(this)) || "").split(f);
    };
    class ManhuaGui extends Rule {
        constructor() {
            super(...arguments);
            this.imageHost = "https://eu.hamreus.com";
        }
        provideExtensionInfo() {
            let site = new Extension("manhuagui", "漫畫櫃", 2 /* MediaType.Picture */);
            site.baseUrl = "https://www.manhuagui.com";
            site.thumbnail = "https://www.manhuagui.com/favicon.ico";
            site.lang = "zh-HK";
            site.description = "看漫画网站拥有海量的国产漫画、日韩漫画、欧美漫画等丰富漫画资源，免费为漫画迷提供及时的更新、清新的界面和舒适的体验,努力打造属于漫画迷的漫画乐园。";
            site.categoryList = [
                new SiteUrl("最近更新", "/list/update_p{page}.html"),
                new SiteUrl("人气最旺", "/list/view_p{page}.html"),
                new SiteUrl("评分最高", "/list/rate_p{page}.html"),
                new SiteUrl("连载中", "/list/lianzai/update_p{page}.html"),
                new SiteUrl("已完结", "/list/wanjie/update_p{page}.html"),
                new SiteUrl("日本", "/list/japan/update_p{page}.html"),
                new SiteUrl("港台", "/list/hongkong/update_p{page}.html"),
                new SiteUrl("其它", "/list/other/update_p{page}.html"),
                new SiteUrl("欧美", "/list/europe/update_p{page}.html"),
                new SiteUrl("内地", "/list/china/update_p{page}.html"),
                new SiteUrl("韩国", "/list/korea/update_p{page}.html"),
                new SiteUrl("热血", "/list/rexue/update_p{page}.html"),
                new SiteUrl("冒险", "/list/maoxian/update_p{page}.html"),
                new SiteUrl("魔幻", "/list/mohuan/update_p{page}.html"),
                new SiteUrl("神鬼", "/list/shengui/update_p{page}.html"),
                new SiteUrl("搞笑", "/list/gaoxiao/update_p{page}.html"),
                new SiteUrl("萌系", "/list/mengxi/update_p{page}.html"),
                new SiteUrl("爱情", "/list/aiqing/update_p{page}.html"),
                new SiteUrl("科幻", "/list/kehuan/update_p{page}.html"),
                new SiteUrl("魔法", "/list/mofa/update_p{page}.html"),
                new SiteUrl("格斗", "/list/gedou/update_p{page}.html"),
                new SiteUrl("武侠", "/list/wuxia/update_p{page}.html"),
                new SiteUrl("机战", "/list/jizhan/update_p{page}.html"),
                new SiteUrl("战争", "/list/zhanzheng/update_p{page}.html"),
                new SiteUrl("竞技", "/list/jingji/update_p{page}.html"),
                new SiteUrl("体育", "/list/tiyu/update_p{page}.html"),
                new SiteUrl("校园", "/list/xiaoyuan/update_p{page}.html"),
                new SiteUrl("生活", "/list/shenghuo/update_p{page}.html"),
                new SiteUrl("励志", "/list/lizhi/update_p{page}.html"),
                new SiteUrl("历史", "/list/lishi/update_p{page}.html"),
                new SiteUrl("伪娘", "/list/weiniang/update_p{page}.html"),
                new SiteUrl("宅男", "/list/zhainan/update_p{page}.html"),
                new SiteUrl("腐女", "/list/funv/update_p{page}.html"),
                new SiteUrl("耽美", "/list/danmei/update_p{page}.html"),
                new SiteUrl("百合", "/list/baihe/update_p{page}.html"),
                new SiteUrl("后宫", "/list/hougong/update_p{page}.html"),
                new SiteUrl("治愈", "/list/zhiyu/update_p{page}.html"),
                new SiteUrl("美食", "/list/meishi/update_p{page}.html"),
                new SiteUrl("推理", "/list/tuili/update_p{page}.html"),
                new SiteUrl("悬疑", "/list/xuanyi/update_p{page}.html"),
                new SiteUrl("恐怖", "/list/kongbu/update_p{page}.html"),
                new SiteUrl("四格", "/list/sige/update_p{page}.html"),
                new SiteUrl("职场", "/list/zhichang/update_p{page}.html"),
                new SiteUrl("侦探", "/list/zhentan/update_p{page}.html"),
                new SiteUrl("社会", "/list/shehui/update_p{page}.html"),
                new SiteUrl("音乐", "/list/yinyue/update_p{page}.html"),
                new SiteUrl("舞蹈", "/list/wudao/update_p{page}.html"),
                new SiteUrl("杂志", "/list/zazhi/update_p{page}.html"),
                new SiteUrl("黑道", "/list/heidao/update_p{page}.html"),
            ];
            site.searchList = [
                new SiteUrl("搜索", "/s/{keyword}_p{page}.html"),
            ];
            site.configParams = [
                { key: "imageHost", value: "漫画图片域名，如：https://i.hamreus.com" },
            ];
            return site;
        }
        config(form) {
            return __awaiter(this, void 0, void 0, function* () {
                if (form.has("imageHost")) {
                    if (this.imageHost.startsWith("http://") || this.imageHost.startsWith("https://")) {
                        this.imageHost = form.get("imageHost") || this.imageHost;
                    }
                    if (this.imageHost.endsWith("/")) {
                        this.imageHost = this.imageHost.slice(0, -1);
                    }
                    return true;
                }
                return false;
            });
        }
        requestItemList(url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let listUrl = this.site.baseUrl + url.replace("{page}", page.toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: listUrl, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let itemNodes = $nodes.find("div.book-list ul#contList > li");
                let details = [];
                itemNodes.each((_i, el) => {
                    var _a, _b, _c, _d, _e;
                    let item = $(el);
                    let link = (_a = item.find("a.bcover").attr("href")) !== null && _a !== void 0 ? _a : "";
                    // /comic/55430/ -> 55430
                    let id = (_c = (_b = link.match(/\/comic\/(\d+)\//)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : "";
                    let thumbnail = (_d = item.find("a.bcover img").attr("src")) !== null && _d !== void 0 ? _d : "";
                    if (thumbnail.length == 0) {
                        thumbnail = (_e = item.find("a.bcover img").attr("data-src")) !== null && _e !== void 0 ? _e : "";
                    }
                    if (thumbnail.startsWith("//")) {
                        thumbnail = "https:" + thumbnail;
                    }
                    let category = item.find("a.bcover span.tt").text().trim();
                    let title = item.find("p.ell a").text().trim();
                    let author = item.find("span.updateon").text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.author = author;
                    detail.category = category;
                    detail.thumbnail = thumbnail;
                    detail.hasChapter = true;
                    detail.type = 2 /* MediaType.Picture */;
                    details.push(detail);
                });
                let pagerCont = (_b = $nodes.find("div#AspNetPager1 > a").last().attr("href")) !== null && _b !== void 0 ? _b : "";
                // /list/rexue/update_p43.html -> 43
                let nextPage = (_c = pagerCont.match(/_p(\d+)\.html/)) === null || _c === void 0 ? void 0 : _c[1];
                console.log("ManhuaGui search nextPage:", nextPage);
                let hasMore = details.length >= 42 && nextPage !== undefined && parseInt(nextPage) > page;
                let nextApi = hasMore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
                return new ExtensionList(details, page, nextApi);
            });
        }
        searchItemList(keyword, url, page) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let searchUrl = this.site.baseUrl + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: searchUrl, method: "GET" }));
                let $nodes = $(htmlResponse.body);
                let itemNodes = $nodes.find("div.book-result ul > li");
                let details = [];
                itemNodes.each((_i, el) => {
                    var _a, _b, _c, _d, _e;
                    let item = $(el);
                    let link = (_a = item.find("a.bcover").attr("href")) !== null && _a !== void 0 ? _a : "";
                    // /comic/55430/ -> 55430
                    let id = (_c = (_b = link.match(/\/comic\/(\d+)\//)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : "";
                    let thumbnail = (_d = item.find("a.bcover img").attr("src")) !== null && _d !== void 0 ? _d : "";
                    if (thumbnail.length == 0) {
                        thumbnail = (_e = item.find("a.bcover img").attr("data-src")) !== null && _e !== void 0 ? _e : "";
                    }
                    if (thumbnail.startsWith("//")) {
                        thumbnail = "https:" + thumbnail;
                    }
                    let title = item.find("div.book-detail dl dt:eq(0) a").text().trim();
                    let category = item.find("div.book-detail dl dt.tags span").first().text().trim();
                    let author = item.find("div.book-detail dl dt.tags:eq(1) span").text().trim();
                    let p = item.find("div.book-detail dl dd.intro").text().trim();
                    let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
                    detail.author = author;
                    detail.category = category;
                    detail.thumbnail = thumbnail;
                    detail.hasChapter = true;
                    detail.description = p;
                    detail.type = 2 /* MediaType.Picture */;
                    details.push(detail);
                });
                let pagerCont = (_b = $nodes.find("div#AspNetPagerResult > a").last().attr("href")) !== null && _b !== void 0 ? _b : "";
                // /list/rexue/update_p43.html -> 43
                let nextPage = (_c = pagerCont.match(/_p(\d+)\.html/)) === null || _c === void 0 ? void 0 : _c[1];
                let hasMore = details.length >= 10 && nextPage !== undefined && parseInt(nextPage) > page;
                let nextApi = hasMore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
                return new ExtensionList(details, page, nextApi);
            });
        }
        requestItemChapter(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let api = this.site.baseUrl + `/comic/${id}/`;
                var htmlResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.request({ url: api, method: "GET" }));
                var html = htmlResponse.body;
                let $nodes = $(html);
                let bookCover = $nodes.find("div.book-cover");
                let thumbnail = (_b = bookCover.find("img").attr("src")) !== null && _b !== void 0 ? _b : "";
                if (thumbnail.startsWith("//")) {
                    thumbnail = "https:" + thumbnail;
                }
                bookCover.find("p.text").text().trim();
                let bookDetail = $nodes.find("div.book-detail");
                let title = bookDetail.find("div.book-title").text().trim();
                let category = bookDetail.find("ul.detail-list > li:eq(1) > span:eq(0)").text().trim();
                let author = bookDetail.find("ul.detail-list > li:eq(1) > span:eq(1)").text().trim();
                let status = bookDetail.find("ul.detail-list li.status span.dgreen").text().trim();
                let p = $nodes.find("div#intro-all").text().trim();
                if (p.length == 0) {
                    p = $nodes.find("div#intro-cut").text().trim();
                }
                let chapterNode = $nodes.find("div.chapter");
                let chapterNodes = chapterNode.find("h4,div.chapter-list");
                let volumes = [];
                let volume;
                chapterNodes.each((_i, el) => {
                    let node = $(el);
                    if (el.tagName.toLowerCase() === "h4") {
                        let volumeTitle = node.text().trim();
                        volume = new ItemVolume(volumeTitle, []);
                        volumes.push(volume);
                    }
                    else {
                        let chapterLists = node.find("ul");
                        chapterLists.each((_j, elc) => {
                            let volumePart = $(elc);
                            let chapterNodes = volumePart.find("li");
                            let partChapters = [];
                            chapterNodes.each((_k, elch) => {
                                var _a, _b, _c, _d;
                                let chapter = $(elch);
                                let link = (_a = chapter.find("a").attr("href")) !== null && _a !== void 0 ? _a : "";
                                let title = (_b = chapter.find("a").attr("title")) !== null && _b !== void 0 ? _b : "";
                                // /comic/19430/585115.html -> 585115
                                let chapterId = (_d = (_c = link.match(/\/comic\/\d+\/(\d+)\.html/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : "";
                                let itemChapter = new ItemChapter(chapterId, this.site.baseUrl + link, title);
                                partChapters.push(itemChapter);
                            });
                            volume === null || volume === void 0 ? void 0 : volume.chapters.push(...(partChapters.reverse()));
                        });
                    }
                });
                let detail = new ExtensionDetail(id, url, title);
                detail.author = author;
                detail.category = category;
                detail.thumbnail = thumbnail;
                detail.status = status;
                detail.description = p;
                detail.volumes = volumes;
                detail.hasChapter = true;
                detail.type = 2 /* MediaType.Picture */;
                return detail;
            });
        }
        searchImageScriptElement(html) {
            let $nodes = $(html);
            let jsonString = "";
            $nodes.each((index, element) => {
                if (element instanceof HTMLScriptElement) {
                    let scriptContent = element.innerHTML;
                    if (scriptContent.includes("window[")) {
                        // window["\x65\x76\x61\x6c"](function(p){...}) -> (function(p){...})
                        let scriptCode = scriptContent.replace(/window\[".+?"\]\(/, "(");
                        let jsonContent = eval(scriptCode);
                        let cleanJson = jsonContent.replace("SMH.imgData(", "").replace(").preInit();", "");
                        jsonString = cleanJson;
                        return false; // Exit the each loop
                    }
                }
            });
            console.log("ManhuaGui image jsonString:", jsonString);
            return jsonString;
        }
        requestItemMedia(url, id) {
            return __awaiter(this, void 0, void 0, function* () {
                let htmlResponse = yield this.client.request({ url: url, method: "GET" });
                let html = htmlResponse.body;
                let imageScript = this.searchImageScriptElement(html);
                let imageUrls = [];
                try {
                    let imageData = JSON.parse(imageScript);
                    let files = imageData["files"];
                    let path = imageData["path"];
                    let cname = imageData["cname"];
                    for (let file of files) {
                        let imageUrl = `${this.imageHost}${path}${file}`;
                        imageUrls.push(imageUrl);
                    }
                    let media = new PictureMedia(id, cname, imageUrls);
                    media.refer = this.site.baseUrl;
                    return media;
                }
                catch (e) {
                    console.error("Failed to parse image data:", e);
                }
                return new PictureMedia("-1", "未知", []);
            });
        }
    }
    (function () {
        const manhuagui = new ManhuaGui();
        manhuagui.init();
    })();

    return ManhuaGui;

})();
