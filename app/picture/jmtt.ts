import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';
import { md5 } from '@/utils/crypto';

class Jmtt extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("18comic", "禁漫天堂", MediaType.Picture);
        site.baseUrl = "https://18comic.vip";
        site.description = "禁漫天堂（18comic）是一個提供大量免費漫畫資源的網站，涵蓋各種類型的漫畫，包括成人漫畫、同人誌等。用戶可以在此平台上輕鬆瀏覽和下載漫畫，享受高質量的閱讀體驗。";
        site.thumbnail = "https://cdn-msp3.18comic.vip/templates/frontend/airav/img/title-png/more-ms-jm.webp?v=2";
        site.lang = "zh-HK";
        site.categoryList = [
            new SiteUrl("最新", "albums?o=mr&page={page}"),
            new SiteUrl("本周最新", "albums?t=w&o=mr&page={page}"),
            new SiteUrl("本月最新", "albums?o=mr&t=m&page={page}"),

            new SiteUrl("周排行", "albums?o=mv&t=w&page={page}"),
            new SiteUrl("月排行", "albums?t=m&o=mv&page={page}"),
            new SiteUrl("總排行", "albums?o=mv&page={page}"),

            new SiteUrl("單本", "albums/single?page={page}"),
            new SiteUrl("短篇", "albums/short?page={page}"),
            new SiteUrl("同人", "albums/doujin?page={page}"),
            new SiteUrl("English Manga", "albums/meiman?page={page}"),
            new SiteUrl("韓漫", "albums/hanman?page={page}"),
            new SiteUrl("其他類", "albums/another?page={page}"),

            new SiteUrl("無修正", "search/photos?search_query=無修正&page={page}"),
            new SiteUrl("劇情向", "search/photos?search_query=劇情向&page={page}"),
            new SiteUrl("青年漫", "search/photos?search_query=青年漫&page={page}"),
            new SiteUrl("校服", "search/photos?search_query=校服&page={page}"),
            new SiteUrl("純愛", "search/photos?search_query=純愛&page={page}"),
            new SiteUrl("人妻", "search/photos?search_query=人妻&page={page}"),
            new SiteUrl("教師", "search/photos?search_query=教師&page={page}"),
            new SiteUrl("百合", "search/photos?search_query=百合&page={page}"),
            new SiteUrl("Yaoi", "search/photos?search_query=Yaoi&page={page}"),
            new SiteUrl("性轉", "search/photos?search_query=性轉&page={page}"),
            new SiteUrl("NTR", "search/photos?search_query=NTR&page={page}"),
            new SiteUrl("女裝", "search/photos?search_query=女裝&page={page}"),
            new SiteUrl("癡女", "search/photos?search_query=癡女&page={page}"),
            new SiteUrl("全彩", "search/photos?search_query=全彩&page={page}"),
            new SiteUrl("女性向", "search/photos?search_query=女性向&page={page}"),
            new SiteUrl("完結", "search/photos?search_query=完結&page={page}"),
            new SiteUrl("純愛", "search/photos?search_query=純愛&page={page}"),
            new SiteUrl("禁漫漢化組", "search/photos?search_query=禁漫漢化組&page={page}"),
            new SiteUrl("御姐", "search/photos?search_query=御姐&page={page}"),
            new SiteUrl("熟女", "search/photos?search_query=熟女&page={page}"),
            new SiteUrl("巨乳", "search/photos?search_query=巨乳&page={page}"),
            new SiteUrl("貧乳", "search/photos?search_query=貧乳&page={page}"),
            new SiteUrl("女性支配", "search/photos?search_query=女性支配&page={page}"),
            new SiteUrl("教師", "search/photos?search_query=教師&page={page}"),
            new SiteUrl("女僕", "search/photos?search_query=女僕&page={page}"),
            new SiteUrl("護士", "search/photos?search_query=護士&page={page}"),
            new SiteUrl("泳裝", "search/photos?search_query=泳裝&page={page}"),
            new SiteUrl("眼鏡", "search/photos?search_query=眼鏡&page={page}"),
            new SiteUrl("連褲襪", "search/photos?search_query=連褲襪&page={page}"),
            new SiteUrl("其他制服", "search/photos?search_query=其他制服&page={page}"),
            new SiteUrl("兔女郎", "search/photos?search_query=兔女郎&page={page}"),
            new SiteUrl("群交", "search/photos?search_query=群交&page={page}"),
            new SiteUrl("足交", "search/photos?search_query=足交&page={page}"),
            new SiteUrl("束縛", "search/photos?search_query=束縛&page={page}"),
            new SiteUrl("肛交", "search/photos?search_query=肛交&page={page}"),
            new SiteUrl("阿黑顏", "search/photos?search_query=阿黑顏&page={page}"),
            new SiteUrl("藥物", "search/photos?search_query=藥物&page={page}"),
            new SiteUrl("扶他", "search/photos?search_query=扶他&page={page}"),
            new SiteUrl("調教", "search/photos?search_query=調教&page={page}"),
            new SiteUrl("野外露出", "search/photos?search_query=野外露出&page={page}"),
            new SiteUrl("催眠", "search/photos?search_query=催眠&page={page}"),
            new SiteUrl("自慰", "search/photos?search_query=自慰&page={page}"),
            new SiteUrl("觸手", "search/photos?search_query=觸手&page={page}"),
            new SiteUrl("獸交", "search/photos?search_query=獸交&page={page}"),
            new SiteUrl("亞人", "search/photos?search_query=亞人&page={page}"),
            new SiteUrl("怪物女孩", "search/photos?search_query=怪物女孩&page={page}"),
            new SiteUrl("皮物", "search/photos?search_query=皮物&page={page}"),
            new SiteUrl("ryona", "search/photos?search_query=ryona&page={page}"),
            new SiteUrl("騎大車", "search/photos?search_query=騎大車&page={page}"),
            new SiteUrl("CG", "search/photos?search_query=CG&page={page}"),
            new SiteUrl("重口", "search/photos?search_query=重口&page={page}"),
            new SiteUrl("獵奇", "search/photos?search_query=獵奇&page={page}"),
            new SiteUrl("非H", "search/photos?search_query=非H&page={page}"),
            new SiteUrl("血腥暴力", "search/photos?search_query=血腥暴力&page={page}"),
            new SiteUrl("站長推薦", "search/photos?search_query=站長推薦&page={page}"),
        ];

        site.searchList = [
            new SiteUrl("搜尋結果", "search/photos?search_query={keyword}&page={page}"),
        ];

        site.configParams = [
            { key: "host", value: "新域名，如（https://18comic.vip）無特殊需求請勿更改" },
        ];

        site.useGuide = `## 如何设置新域名
1. 打开禁漫天堂（18comic）官方网站，查看当前可用的域名。
2. 复制当前可用的域名（例如：https://jm18c-jjd.club）。
3. 打开Moment应用，进入扩展管理页面。
4. 找到“禁漫天堂”扩展，点击“设置”按钮。
5. 在“host”字段中，粘贴刚才复制的域名。
6. 保存设置并重启扩展，即可使用新的域名访问禁漫天堂。
        `;


        return site;
    }

    override config(form: Map<string, string>): Promise<boolean> {
        let host = form.get("host");
        if (host && host.length > 0) {
            if (!host.startsWith("http")) {
                host = "https://" + host;
            }
            if (host.endsWith("/")) {
                host = host.slice(0, -1);
            }
            this.site.baseUrl = host;
        }
        return Promise.resolve(true);
    }

    private parseItemDetails(itemNodes: JQuery<HTMLElement>): ExtensionDetail[] {
        let details: ExtensionDetail[] = [];
        itemNodes.each((index, element) => {
            let ele = $(element);
            let albumNode = ele.find("div.thumb-overlay-albums");
            if (albumNode.length === 0) {
                albumNode = ele.find("div.thumb-overlay");
            }

            let thumbnail = albumNode.find("a > img").attr("data-original") || "";
            if (thumbnail.length === 0) {
                thumbnail = albumNode.find("a > img").attr("src") || "";
            }
            let link = albumNode.find("a").attr("href") || "";
            // /album/1242983/夺命五头 -> 1242983
            let id = link.split("/")[2];
            let statusNodes = albumNode.find("div.category-icon > div");
            let status = statusNodes.map((i, statusEle) => {
                let s = $(statusEle);
                return s.text().trim();
            }).get().join(", ");

            let title = ele.find("span.video-title").text().trim();
            let author = ele.find("div.title-truncate a").first().text().trim();
            let categoryNodes = ele.find("div.tags a");
            let category = categoryNodes.map((i, catEle) => {
                let c = $(catEle);
                return c.text().trim();
            }).get().join(", ");


            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.type = MediaType.Picture;
            detail.hasChapter = true;
            detail.thumbnail = thumbnail;
            detail.author = author;
            detail.category = category;
            detail.status = status;
            details.push(detail);

        });
        return details;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `/${url.replace("{page}", page.toString())}`;

        let response = await this.client.request(
            {
                url: api, method: "POST",
                contentType: "application/x-www-form-urlencoded",
                body: `holder=empty`,
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,zh-TW;q=0.6" },
                    { key: "Accept-Encoding", value: "*/*" },
                    { key: "Accept", value: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7" },
                ]
            }
        );

        let $nodes = $(response.body);

        let details = this.parseItemDetails($nodes.find("div.container div.row div.p-b-15"));

        let lastPageUrl = $nodes.find("ul.pagination li > a").last().attr("href") || "";
        // https://18comic.vip/albums/short?page=386 -> 386
        let lastPage = parseInt(lastPageUrl.split("page=")[1] || "1");
        let hasMore = page < lastPage;
        let nextApi = this.site.baseUrl + `/${url.replace("{page}", (page + 1).toString())}`;

        let list = new ExtensionList(details, page, hasMore ? nextApi : undefined);
        return list;
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `/${url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString())}`;

        console.log("Requesting item list api:", api);

        let response = await this.client.request(
            {
                url: api, method: "POST",
                contentType: "application/x-www-form-urlencoded",
                body: `holder=empty`,
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                    { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,zh-TW;q=0.6" },
                    { key: "Accept-Encoding", value: "*/*" },
                    { key: "Accept", value: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7" },
                ]
            }
        );

        let $nodes = $(response.body);

        let panel = $nodes.find("div.panel-body");
        if (panel.length > 0) {
            let detail = this.parseChapterDetailNodes($nodes);
            let list = new ExtensionList([detail], page, undefined);
            return list;
        }

        let details = this.parseItemDetails($nodes.find("div.container div.row div.p-b-15"));
        let lastPageUrl = $nodes.find("ul.pagination li > a").last().attr("href") || "";
        // https://18comic.vip/albums/short?page=386 -> 386
        let lastPage = parseInt(lastPageUrl.split("page=")[1] || "1");
        let hasMore = page < lastPage;
        let nextApi = this.site.baseUrl + `/${url.replace("{page}", (page + 1).toString())}`;

        let list = new ExtensionList(details, page, hasMore ? nextApi : undefined);
        return list;

    }

    private parseChapterDetailNodes($nodes: JQuery<HTMLElement>, id?: string, url?: string): ExtensionDetail {
        let panel = $nodes.find("div.panel-body");
        let thumbnail = panel.find("div#album_photo_cover div.show_zoom > img").first().attr("src") || "";
        let author = panel.find("span[itemprop=author] a").text().trim();
        let categoryNodes = panel.find("span[itemprop=genre] a");
        let category = categoryNodes.map((i, catEle) => {
            let c = $(catEle);
            return c.text().trim();
        }).get().join(", ");

        let description = panel.find("h2.p-t-5").first().text().trim();
        if (description === "叙述：") {
            description = "";
        }

        let title = $nodes.find("h1#book-name").text().trim();

        let episodeNodes = $nodes.find("div#episode-block div.episode > ul > a");
        let chapters: ItemChapter[] = [];

        if (episodeNodes.length > 0) {
            episodeNodes.each((index, element) => {
                let ele = $(element);

                let link = ele.attr("href") || "";
                let id = ele.attr("data-album") || "";
                let titleTxt = ele.find("h3").text().trim();
                let title = titleTxt.split("\n")[0];
                let url = this.site.baseUrl + link;

                let chapter = new ItemChapter(id, url, title.trim());
                chapters.push(chapter);
            });
        } else {
            // 單一章節
            let photoLink = panel.find("div.read-block").last().find("a").first().attr("href") || "";
            // /photo/364522 -> 364522
            let photoId = photoLink.split("/")[2] || "";
            let chapter = new ItemChapter(photoId, this.site.baseUrl + photoLink, "1话");
            chapters.push(chapter);
        }

        let volumes = [new ItemVolume("章節列表", chapters)];

        let firstChapter = chapters[0];
        let realId = id;
        let realUrl = url;

        if (!realId && firstChapter) {
            realId = firstChapter.id;
            realUrl = this.site.baseUrl + "/album/" + realId;
        }

        let detail = new ExtensionDetail(realId ?? "", realUrl ?? "", title);
        detail.type = MediaType.Picture;
        detail.hasChapter = true;
        detail.thumbnail = thumbnail;
        detail.author = author;
        detail.category = category;
        detail.volumes = volumes;
        return detail;
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        // https://18comic.vip/album/799/
        let api = this.site.baseUrl + "/album/" + id + "/";
        let response = await this.client.request({
            url: api, method: "POST",
            contentType: "application/x-www-form-urlencoded",
            body: `holder=empty`,
            headers: [
                { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,zh-TW;q=0.6" },
                { key: "Accept-Encoding", value: "*/*" },
                { key: "Accept", value: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7" },
            ]
        });

        let $nodes = $(response.body);

        let detail = this.parseChapterDetailNodes($nodes, id, api);
        return detail;

    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // https://18comic.vip/photo/364522
        let api = this.site.baseUrl + "/photo/" + id;
        let response = await this.client.request({
            url: api, method: "POST",
            contentType: "application/x-www-form-urlencoded",
            body: `holder=empty`,
            headers: [
                { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                { key: "Accept-Language", value: "zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,zh-TW;q=0.6" },
                { key: "Accept-Encoding", value: "*/*" },
                { key: "Accept", value: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7" },
            ]
        });

        let html = response.body;

        //match reg var scramble_id = 220980; -> 220980
        let scrambleIdMatch = html.match(/var scramble_id\s*=\s*(\d+);/);
        if (!scrambleIdMatch) {
            console.error("Failed to find scramble_id");
            return new ExtensionMedia(MediaType.Picture, "-1", "无法找到 scramble_id");
        }
        let scrambleId = scrambleIdMatch[1];

        // var aid = 364522; -> 364522
        let aidMatch = html.match(/var aid\s*=\s*(\d+);/);
        if (!aidMatch) {
            console.error("Failed to find aid");
            return new ExtensionMedia(MediaType.Picture, "-1", "无法找到 aid");
        }
        let aid = aidMatch[1];

        let $nodes = $(html);
        let images = $nodes.find("div.scramble-page");
        let imageUrls: string[] = [];
        let endcodeKeys: string[] = [];
        let chapterId = images.first().attr("data-chapter-id") ?? aid;
        let encodeMethod = 'scramble';
        let isScramble = parseInt(aid) < parseInt(scrambleId);
        images.each((index, element) => {
            let ele = $(element);
            let photoUrl = ele.find("img").attr("data-original") || "";
            if (photoUrl.length === 0) {
                return;
            }
            imageUrls.push(photoUrl);
            if (photoUrl.indexOf(".gif") >= 0 || isScramble) {
                endcodeKeys.push("");
            } else {
                let imgIdName = ele.attr("id") || ele.find("img").attr("id") || "";
                let imgId = imgIdName.split(".")[0] || "00000";
                if (imgId.includes("_")) {
                    imgId = imgId.split("_").pop() ?? "00000";
                }
                let numSegments = this.getNum(chapterId, imgId);
                endcodeKeys.push(numSegments.toString());
            }
            console.log(`Image URL: ${photoUrl}, Encode Key: ${endcodeKeys[endcodeKeys.length - 1]}`);
        });

        let media = new PictureMedia(id, "", imageUrls);
        media.encodeMethod = encodeMethod;
        media.encodeKeys = endcodeKeys;
        return media;
    }

    private getNum(albumId: string, imageId: string): number {
        let numSegments = 10;

        let combinedId = md5(albumId.toString() + imageId.toString());

        // 取哈希值的最后一位
        let lastChar = combinedId.charAt(combinedId.length - 1);
        let charCode = lastChar.charCodeAt(0);
        // 根据特定的相册ID范围，对字符编码进行取模
        if (parseInt(albumId) >= 268850 && parseInt(albumId) <= 421925) {
            charCode %= 10;
        } else if (parseInt(albumId) >= 421926) {
            charCode %= 8;
        } else {
            charCode %= 10;
        }

        // 根据取模结果返回分割块数
        switch (charCode) {
            case 0: numSegments = 2; break;
            case 1: numSegments = 4; break;
            case 2: numSegments = 6; break;
            case 3: numSegments = 8; break;
            case 4: numSegments = 10; break;
            case 5: numSegments = 12; break;
            case 6: numSegments = 14; break;
            case 7: numSegments = 16; break;
            case 8: numSegments = 18; break;
            case 9: numSegments = 20; break;
        }
        return numSegments;
    }

}

(function () {
    // Register extension.
    let rule = new Jmtt();
    rule.init();
})();

export default Jmtt;