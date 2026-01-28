import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia } from '@/core/extension';
import { bilinovel_decryption_table } from '@/utils/bilinovel-decryption';

class BiliWenku extends Rule {

    // pc website : https://www.linovelib.com
    provideExtensionInfo(): Extension {
        let site = new Extension("biliwenku", "哔哩文库", MediaType.Novel);
        site.baseUrl = "https://www.bilinovel.com";
        site.description = "哔哩轻之小说是收录最全更新最快的轻小说文库，提供轻小说在线阅读。"
        site.thumbnail = "https://www.bilinovel.com/favicon.ico";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("最近更新", site.baseUrl + "/wenku/lastupdate_0_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("日本轻小说", site.baseUrl + "/wenku/lastupdate_0_0_0_1_0_0_0_{page}_0.html"),
            new SiteUrl("华文轻小说", site.baseUrl + "/wenku/lastupdate_0_0_0_2_0_0_0_{page}_0.html"),
            new SiteUrl("Web轻小说", site.baseUrl + "/wenku/lastupdate_0_0_0_3_0_0_0_{page}_0.html"),
            new SiteUrl("韩国轻小说", site.baseUrl + "/wenku/lastupdate_0_0_0_5_0_0_0_{page}_0.html"),
            new SiteUrl("已动画化", site.baseUrl + "/wenku/lastupdate_0_0_1_0_0_0_0_{page}_0.html"),
            new SiteUrl("已经完本", site.baseUrl + "/wenku/lastupdate_0_5_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("周推荐", site.baseUrl + "/wenku/weekvote_0_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("月推荐", site.baseUrl + "/wenku/monthvote_0_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("最新入库", site.baseUrl + "/wenku/postdate_0_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("恋爱", site.baseUrl + "/wenku/lastupdate_64_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("后宫", site.baseUrl + "/wenku/lastupdate_48_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("校园", site.baseUrl + "/wenku/lastupdate_63_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("百合", site.baseUrl + "/wenku/lastupdate_27_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("转生", site.baseUrl + "/wenku/lastupdate_26_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("异世界", site.baseUrl + "/wenku/lastupdate_47_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("欢乐向", site.baseUrl + "/wenku/lastupdate_222_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("女性视角", site.baseUrl + "/wenku/lastupdate_231_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("性转", site.baseUrl + "/wenku/lastupdate_31_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("魔法", site.baseUrl + "/wenku/lastupdate_96_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("悬疑", site.baseUrl + "/wenku/lastupdate_68_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("病娇", site.baseUrl + "/wenku/lastupdate_198_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("妹妹", site.baseUrl + "/wenku/lastupdate_217_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("萝莉", site.baseUrl + "/wenku/lastupdate_185_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("大小姐", site.baseUrl + "/wenku/lastupdate_227_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("女儿", site.baseUrl + "/wenku/lastupdate_261_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("末日", site.baseUrl + "/wenku/lastupdate_221_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("惊悚", site.baseUrl + "/wenku/lastupdate_124_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("推理", site.baseUrl + "/wenku/lastupdate_97_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("治愈", site.baseUrl + "/wenku/lastupdate_98_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("游戏", site.baseUrl + "/wenku/lastupdate_248_0_0_0_0_0_0_{page}_0.html"),
            new SiteUrl("恶役", site.baseUrl + "/wenku/lastupdate_328_0_0_0_0_0_0_{page}_0.html"),

        ];
        site.searchList = [
            new SiteUrl("搜索(书名)", "https://www.bilinovel.com/search.html"),
        ];
        site.configParams = [
            { key: "chapterjs-length", value: "加密的长度(20)" },
            { key: "chapterjs-seed", value: "加密的种子1(135)" },
            { key: "chapterjs-seed2", value: "加密的种子2(234)" },
        ];

        site.useGuide = "1. 由于章节内容加密参数无法稳定获取，可能会导致章节内容段落顺序错乱。\n2. 可尝试调整配置中的加密参数以修正章节顺序问题。";
        return site;
    }

    cachedFixedLength: number | null | undefined; // 19
    cachedSeed: number | null | undefined; // 135
    cachedSeed2: number | null | undefined; // 236

    override async config(form: Map<string, string>): Promise<boolean> {
        this.cachedFixedLength = parseInt(form.get("chapterjs-length") || "20");
        this.cachedSeed = parseInt(form.get("chapterjs-seed") || "135");
        this.cachedSeed2 = parseInt(form.get("chapterjs-seed2") || "234");
        return true;
    }

    private itemListParse($nodes: JQuery<HTMLElement>): ExtensionDetail[] {
        var listNode = $nodes.find("ol.book-ol > li.book-li");
        var items: ExtensionDetail[] = [];
        listNode.each((_index, element) => {
            let ele = $(element);
            let link = ele.find("a.book-layout").attr("href");
            if (link) {
                let cover = ele.find("div.book-cover > img").attr("data-src");
                let title = ele.find("div.book-cell div.book-title-x > h4").text();
                let description = ele.find("div.book-cell > p.book-desc").text().trim();

                let author = ele.find("div.book-cell div.book-meta span.book-author").text();
                let tags = ele.find("div.book-cell div.book-meta span.tag-small-group > em:eq(0)").text();
                let status = ele.find("div.book-cell div.book-meta span.tag-small-group > em:eq(1)").text();

                let pattern = new RegExp('/novel/(.*?).html$', 'i');
                let id = pattern.exec(link)?.[1];
                let item = new ExtensionDetail(id!, this.site.baseUrl + link, title);
                item.thumbnail = cover;
                item.description = description;
                item.author = author;
                item.category = tags;
                item.status = status;
                item.hasChapter = true;
                item.type = MediaType.Novel;
                items.push(item);
            }
        });
        return items;
    }

    async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = url.replace("{page}", page.toString());
        var nextUrl = url.replace("{page}", (page + 1).toString());
        var htmlResponse = await this.client?.request({
            url: realUrl, method: "GET", headers: [
                { key: "User-Agent", value: "Dalvik/2.1.0 (Linux; U; Android 11; M2007J17C Build/RKQ1.200826.002)" },
            ]
        });
        var html = htmlResponse.body;
        let $nodes = $(html);

        let items = this.itemListParse($nodes);

        var disableNext = true;
        const lastPage = $nodes.find("div.pagelink > a.last").text();
        if (lastPage && !isNaN(Number(lastPage))) {
            if (Number(lastPage) > page) {
                disableNext = false;
            }
        } else if (items.length >= 30) {
            disableNext = false;
        }

        return new ExtensionList(items, page, disableNext ? undefined : nextUrl);

    }


    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {

        let searchGetUrl = "https://www.bilinovel.com/search/{keyword}_{page}.html"
        let headers = [
            { key: "User-Agent", value: "Dalvik/2.1.0 (Linux; U; Android 11; M2007J17C Build/RKQ1.200826.002)" },
            { key: "Accept-Language", value: "zh-CN,zh-Hans;q=0.9" },
            { key: "Cookie", value: "night=0;" },
            { key: "Accept", value: "*/*" },
            { key: "referer", value: "https://www.bilinovel.com/" },
        ];

        let requestUrl = url + "?searchkey=" + encodeURIComponent(keyword);
        let realUrl = searchGetUrl.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        var requestOption = (page == 1) ?
            { url: requestUrl, method: "GET", headers: headers } : { url: realUrl, method: "GET", headers: headers };

        var htmlResponse = await this.client?.request(requestOption);
        var html = htmlResponse.body;
        let $nodes = $(html);
        // filter metaNodes
        let metas: { property: string, content: string }[] = [];
        $nodes.each((index, element) => {
            if (element instanceof HTMLMetaElement) {
                metas.push({
                    property: element.getAttribute("property") || "",
                    content: element.getAttribute("content") || ""
                });
            }
        });

        let metaTitle = metas.find(meta => meta.property === "og:novel:book_name")?.content || "";

        // jump to novel detail page if meta is not empty
        if (metaTitle && metaTitle.length > 0) {

            let title = metaTitle;
            let cover = metas.find(meta => meta.property === "og:image")?.content || "";
            let description = metas.find(meta => meta.property === "og:description")?.content || "";
            let author = metas.find(meta => meta.property === "og:novel:author")?.content || "";

            let category = metas.find(meta => meta.property === "og:novel:category")?.content || "";
            let status = metas.find(meta => meta.property === "og:novel:status")?.content || "";
            let link = metas.find(meta => meta.property === "og:url")?.content || "";

            let pattern = new RegExp('/novel/(.*?).html$', 'i');
            let id = pattern.exec(link)?.[1];
            let item = new ExtensionDetail(id!, link, title);
            item.thumbnail = cover;
            item.description = description;
            item.author = author;
            item.status = status;
            item.category = category;
            item.hasChapter = true;
            item.type = MediaType.Novel;
            let items = [item];
            return new ExtensionList(items, page, undefined);
        }

        let items = this.itemListParse($nodes);
        var hasmore = items.length >= 30;
        if (hasmore) {
            let nextPageUrl = searchGetUrl.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
            return new ExtensionList(items, page, nextPageUrl);
        }
        return new ExtensionList(items, page, undefined);
    }

    //https://www.bilinovel.com/novel/88/catalog
    override async requestItemChapter(url: string, id?: string): Promise<ExtensionDetail> {
        var catalog = this.site.baseUrl + "/novel/{id}/catalog".replace("{id}", id ?? "");
        var htmlResponse = await this.client?.request({
            url: catalog, method: "GET", headers: [
                { key: "User-Agent", value: "Dalvik/2.1.0 (Linux; U; Android 11; M2007J17C Build/RKQ1.200826.002)" },
            ]
        });
        var html = htmlResponse.body;
        let $nodes = $(html);

        let metas: { property: string, content: string }[] = [];
        $nodes.each((index, element) => {
            if (element instanceof HTMLMetaElement) {
                metas.push({
                    property: element.getAttribute("property") || "",
                    content: element.getAttribute("content") || ""
                });
            }
        });

        let title = metas.find(meta => meta.property === "og:title")?.content || "";
        let cover = metas.find(meta => meta.property === "og:image")?.content || "";
        let description = metas.find(meta => meta.property === "og:description")?.content || "";
        let author = metas.find(meta => meta.property === "og:novel:author")?.content || "";

        let category = metas.find(meta => meta.property === "og:novel:category")?.content || "";
        let status = metas.find(meta => meta.property === "og:novel:status")?.content || "";
        let link = metas.find(meta => meta.property === "og:url")?.content || "";
        let item = new ExtensionDetail(id!, url, title!);
        item.thumbnail = cover;
        item.description = description;
        item.author = author;
        item.status = status;
        item.category = category;
        item.hasChapter = true;
        item.type = MediaType.Novel;

        let volumes = $nodes.find("div#catelogX div.catalog-volume > ul.volume-chapters");
        item.volumes = [];
        volumes.each((_index, element) => {
            let volume = $(element);
            let lastChapterId: number = 0;
            let volumeTitle = volume.find("li.chapter-bar > h3").text();
            let chapters = volume.find("li.jsChapter");
            let tempVolume: ItemVolume = new ItemVolume(volumeTitle, []);
            let volumeId = volume.find("li.volume-cover > a").attr("href");
            if (volumeId) {
                let pattern = new RegExp('/novel/(.*?)/vol_(.*?).html$', 'i');
                let match = pattern.exec(volumeId);
                if (match) {
                    lastChapterId = parseInt(match[2]);
                }
            }
            chapters.each((_index, element) => {
                let chapter = $(element);
                let link = chapter.find("a").attr("href");
                if (link == undefined) {
                    return;
                }
                let cid: string;
                if (link.startsWith("javascript:")) {
                    cid = (lastChapterId + 1).toString();
                    link = "/novel/" + id + "/" + cid + ".html";
                } else {
                    let pattern = new RegExp('/novel/(.*?)/(.*?).html$', 'i');
                    let match = pattern.exec(link);
                    cid = match ? match[2] : "";
                    lastChapterId = parseInt(cid);
                }
                let title = chapter.find("span").text();
                let item = new ItemChapter(cid!, this.site.baseUrl + link, title);
                tempVolume.chapters.push(item);
            });
            item.volumes?.push(tempVolume);
        });
        return item;
    }

    private nextUrlId(scriptContent: string): string {
        const pattern = /url_next:'(.*?)'/;
        const match = pattern.exec(scriptContent);
        if (match && match[1] && match[1].length > 0) {
            let pattern = new RegExp('/novel/(.*?)/(.*?).html$', 'i');
            let result = pattern.exec(match[1]);
            if (result && result.length > 2) {
                return result[2];
            }
        }
        return "";
    }

    private async requestChapterContent(url: string): Promise<string> {
        return this.client?.request({
            url: url, method: "GET",
            headers: [
                { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36" },
                { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja-CN;q=0.8,ja;q=0.7,en;q=0.6" },
                { key: "Accept", value: "*/*" },
                { key: "Cookie", value: "night=0;" },
            ]
        }).then(response => response.body);
    }

    chinese_punctuation = "，。！？、；：“”‘’（）《》〈〉【】『』〖〗…—～＋－＝×÷·—‘’“”『』【】（）《》〈〉「」『』〖〗〘〙〚〛〚〛〘〙〖〗〘〙〚〛〘〙〖〗〘〙"

    private decryptedText(encryptedText: string): string {
        console.log("Last paragraph found, attempting decryption:" + encryptedText);
        const decryptedText = Array.from(encryptedText)
            .map(char => {
                let replaceChar = bilinovel_decryption_table[char];
                if (replaceChar === undefined) {
                    if (this.chinese_punctuation.includes(char)) {
                        return char; // Keep Chinese punctuation as is
                    }
                    return '';
                }
                return replaceChar;
            }).join('');
        console.log("Decrypted text:", decryptedText);
        return decryptedText;
    }

    private _shuffleArr(arr: number[], seed: number): number[] {
        const a = 9302;
        const c = 49397;
        const mod = 233280;
        for (let i = arr.length - 1; i > 0; i--) {
            seed = (seed * a + c) % mod;
            const j = Math.floor(seed / mod * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    private async _getShuffleParams(chapterlog: string, chapterId: string): Promise<{ chapterId: number; fixedLength: number } | undefined> {
        try {
            const parsedChapterId = parseInt(chapterId, 10);
            if (isNaN(parsedChapterId)) {
                return;
            }

            if (this.cachedFixedLength != null && this.cachedSeed != null && this.cachedSeed2 != null) {
                return {
                    chapterId: parsedChapterId,
                    fixedLength: this.cachedFixedLength,
                };
            }

            this.cachedFixedLength = 20; // Default value if parsing fails
            this.cachedSeed = 135; // Default seed value
            this.cachedSeed2 = 234; // Default second seed value

            return {
                chapterId: parsedChapterId,
                fixedLength: this.cachedFixedLength,
            };

            // const jsContent = await this.requestChapterContent(chapterlog);
            // if (!jsContent) {
            //     console.error("Failed to load chapterlog.js content.");
            //     return;
            // }
            // const regex = /if\(!_0x[a-zA-Z0-9]*\)\s*return;var\s+([a-zA-Z0-9_]+)\s*=\s*(-?[0-9a-fx+\-*\/()\s]+);/;
            // const expressionMatch = jsContent.match(regex);
            // if (!expressionMatch ||  expressionMatch.length < 2) {
            //     console.error("Failed to find the expression in chapterlog.js");
            //     return;
            // }

            // const expression = expressionMatch[2].trim(); // Non-null assertion is safe because of the check

            // // 6. Evaluate the Expression (DANGER: SECURITY RISK!)
            // this.cachedFixedLength = eval(expression); // DANGER: SECURITY RISK!  Consider using a safer alternative.
            // console.log("Cached fixed length:", this.cachedFixedLength);

            // if (typeof this.cachedFixedLength !== 'number') {
            //     return;
            // }

            // return {
            //     chapterId: parsedChapterId,
            //     fixedLength: this.cachedFixedLength,
            // };
        } catch (e) {
            console.error("Error parsing chapterlog.js:", e);
            return;
        }

    }

    private _shuffle(content: JQuery<HTMLElement>, chapterId: number) {

        const pElements = content.find("p").filter((_i, p) => $(p).text().trim().length > 0).toArray().map(p => $(p));

        if (pElements.length === 0) {
            return;
        }

        const fixed: number[] = [];
        const shuffled: number[] = [];
        const fixedLength = this.cachedFixedLength || 20;
        let indices: number[] = [];

        for (let i = 0; i < pElements.length; i++) {
            i < fixedLength ? fixed.push(i) : shuffled.push(i);
        }

        if (pElements.length > fixedLength) {
            let seed1 = this.cachedSeed || 135;
            let seed2 = this.cachedSeed2 || 234;
            const seed = chapterId * seed1 + seed2;

            this._shuffleArr(shuffled, seed);
            indices = [...fixed, ...shuffled];
        } else {
            indices = [...fixed];
        }

        const mapped = new Array<JQuery<HTMLElement>>(pElements.length);
        for (let i = 0; i < pElements.length; i++) {
            mapped[indices[i]] = pElements[i];
        }

        let replacedIndex = 0;
        content.find("p").each((_i, p) => {
            const pNode = $(p);
            if (pNode.text().trim().length > 0 && replacedIndex < mapped.length) {
                pNode.replaceWith(mapped[replacedIndex++].clone());
            }
        });
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {

        let htmlResponse = await this.client?.request({
            url: url, method: "GET",
            headers: [
                { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36" },
                { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja-CN;q=0.8,ja;q=0.7,en;q=0.6" },
                { key: "Accept", value: "*/*" },
                { key: "Cookie", value: "night=0;" },
            ],
            afterLoad: true,
        })

        let $nodes = $(htmlResponse.body);
        console.log("Loaded chapter page:", url);
        console.log("html:", htmlResponse.body);
        let contentP = $nodes.find("div#acontent");
        if (contentP.length === 0) {
            // Fallback to another selector
            contentP = $nodes.find("div#TextContent");
        }
        contentP.find("div.cgo").remove();
        contentP.find("img").each((_index, element) => {
            let img = $(element);
            let src = img.attr("data-src");
            if (src && src.startsWith("//")) {
                src = "https:" + src; // Convert protocol-relative URLs to absolute URLs
            }

            if (src) {
                img.attr("src", src);
                img.removeAttr("data-src");
            }
        });

        let title = $nodes.find("h1#atitle").text().trim();

        let media = new NovelMedia(id, title, "<div>" + contentP.html() + "</div>", this.site.baseUrl + "/");
        return media;
    }

    async requestItemMedia3(url: string, id: string): Promise<ExtensionMedia> {

        var content = "";
        var requestUrl = url;
        var title = "";
        var chapterlogUrl = "https://www.bilinovel.com/themes/zhmb/js/chapterlog.js";
        var cachedFixedLength = this.cachedFixedLength;
        while (true) {
            let html = await this.requestChapterContent(requestUrl);
            let $nodes = $(html);
            var nextUrlId: string = "";
            var lastPEncrypted: boolean = false;
            var pShuffled: boolean = false;
            $nodes.each((index, element) => {
                if (element instanceof HTMLScriptElement) {
                    let scriptContent = element.innerHTML;
                    if (scriptContent.includes("var ReadParams=")) {
                        nextUrlId = this.nextUrlId(scriptContent);
                    }
                    if (element.src && element.src.includes("chapterlog.js?v")) {
                        pShuffled = true;
                        chapterlogUrl = element.src;
                        console.log("requesting chapterlog.js from:", chapterlogUrl);
                    }
                }

                if (element instanceof HTMLStyleElement) {
                    var styleContent = element.innerHTML;
                    if (styleContent.includes("/public/font/read.woff2")) {
                        lastPEncrypted = true;
                    }
                }
            });
            if (title.length === 0) {
                title = $nodes.find("h1").text();
            }
            let findedContent = $nodes.find("div#acontent");
            if (findedContent.length === 0) {
                // Fallback to another selector
                findedContent = $nodes.find("div#TextContent");
            }
            findedContent.find("div.cgo").remove();
            findedContent.find("div.google-auto-placed").remove();
            findedContent.find("div.dag").remove();
            findedContent.find("img").each((_index, element) => {
                let img = $(element);
                let src = img.attr("data-src");
                if (src && src.startsWith("//")) {
                    src = "https:" + src; // Convert protocol-relative URLs to absolute URLs
                }

                if (src) {
                    img.attr("src", src);
                    img.removeAttr("data-src");
                }
            });

            if (pShuffled) {
                var shuffleParams = await this._getShuffleParams(chapterlogUrl, id)
                console.log("Shuffle params:", shuffleParams);
                if (shuffleParams) {
                    this._shuffle(findedContent, shuffleParams.chapterId);
                } else {
                    console.warn("Failed to get shuffle parameters for chapter ID:", id);
                }
            }

            if (lastPEncrypted) {
                var lastP = findedContent.find("p:last").remove();
                content += findedContent.html();
                if (lastP.length > 0) {
                    let encryptedText = lastP.text().trim();
                    let decryptedText = this.decryptedText(encryptedText);
                    content += `<p>${decryptedText}</p>`;
                }
            } else {
                content += findedContent.html();
            }

            if (nextUrlId.startsWith(id)) {
                requestUrl = url.replace(id + ".html", nextUrlId + ".html");
                console.log("requestUrl:", requestUrl);
            } else {
                break;
            }
        }
        return new NovelMedia(id, title, "<div>" + content + "</div>", this.site.baseUrl + "/");

    }
}

(function () {
    const biliWenku = new BiliWenku();
    biliWenku.init();
})();

export default BiliWenku;