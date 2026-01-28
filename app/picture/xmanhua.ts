import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';

class Xmanhua extends Rule {

    override provideExtensionInfo(): Extension {
        let site = new Extension("xmanhua", "X漫畫", MediaType.Picture);
        site.thumbnail = "https://www.xmanhua.com/favicon.ico";
        site.description = "日本漫畫_在線漫畫閱讀第一站(xmanhua)";
        site.baseUrl = "https://www.xmanhua.com";
        site.lang = "zh-TW";
        site.categoryList = [
            new SiteUrl("最新漫畫", "/manga-list-0-0-2-p{page}/"),
            new SiteUrl("人氣漫畫", "/manga-list-p{page}/"),

            new SiteUrl("連載中", "/manga-list-0-0-2-p{page}/"),
            new SiteUrl("已完結", "/manga-list-0-2-2-p{page}/"),

            new SiteUrl("熱血", "/manga-list-31-0-2-p{page}/"),
            new SiteUrl("戀愛", "/manga-list-26-0-2-p{page}/"),
            new SiteUrl("校園", "/manga-list-1-0-2-p{page}/"),
            new SiteUrl("冒險", "/manga-list-2-0-2-p{page}/"),
            new SiteUrl("科幻", "/manga-list-25-0-2-p{page}/"),
            new SiteUrl("生活", "/manga-list-11-0-2-p{page}/"),
            new SiteUrl("懸疑", "/manga-list-17-0-2-p{page}/"),
            new SiteUrl("運動", "/manga-list-34-0-2-p{page}/"),
        ];

        site.searchList = [
            new SiteUrl("搜索", "search?title={keyword}&page={page}"),
        ];

        return site;
    }

    private parseDetails(mhList: JQuery<HTMLElement>): ExtensionDetail[] {
        let details: ExtensionDetail[] = [];
        mhList.each((index, element) => {
            let el = $(element);

            let link = el.find("a").first().attr("href") || "";
            // /7610xm/ -> 7610xm
            let id = link.split("/")[1];
            let thumbnail = el.find("a:eq(0) img").attr("src") || "";

            let title = el.find("div.mh-item-detali h2.title a").text().trim();
            let updateInfo = el.find("p.chapter a").text().trim();

            let detailUrl = this.site.baseUrl + link;

            let detail = new ExtensionDetail(id, detailUrl, title);
            detail.thumbnail = thumbnail;
            detail.description = updateInfo;
            detail.type = MediaType.Picture;
            detail.hasChapter = true;
            details.push(detail);
        });
        return details;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + url.replace("{page}", page.toString());
        let response = await this.client?.request({ url: api, method: "GET" });
        let htmlContent = response.body;

        let $nodes = $(htmlContent);
        let mhList = $nodes.find("ul.mh-list > li div.mh-item");
        console.log("mhList length:", mhList.length);
        let details = this.parseDetails(mhList);

        let hasmore = details.length >= 12;
        let nextApi = hasmore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextApi);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let response = await this.client?.request({ url: api, method: "GET" });
        let htmlContent = response.body;

        let $nodes = $(htmlContent);
        let mhList = $nodes.find("ul.mh-list > li div.mh-item");

        let details = this.parseDetails(mhList);

        let hasmore = details.length >= 12;
        let nextApi = hasmore ? this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextApi);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {

        var htmlResponse = await this.client?.request(
            { url: url, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);

        let detailNode = $nodes.find("div.container div.detail-info");
        let thumbanail = detailNode.find("img.detail-info-cover").attr("src") || "";
        let title = detailNode.find("p.detail-info-title").text().trim();

        let author = detailNode.find("p.detail-info-tip span:eq(0) a").text().trim();
        let status = detailNode.find("p.detail-info-tip span:eq(1) span").text().trim();
        let category = detailNode.find("p.detail-info-tip span:eq(2) span").text().trim();

        let description = detailNode.find("p.detail-info-content").text().trim();

        let chapters: ItemChapter[] = [];
        let chapterNodes = $nodes.find("div#chapterlistload a");
        chapterNodes.each((_i, el) => {
            let item = $(el);
            let link = item.attr("href") || "";
            ///m102367/ -> m102367
            let chapterId = link.split("/")[1];

            let p = item.find("span").text().trim();
            item.find("span").remove();
            let chapterName = item.text().trim() + p;

            let chapter = new ItemChapter(chapterId, this.site.baseUrl + link, chapterName);
            chapters.push(chapter);
        });

        let detail = new ExtensionDetail(id || "", url, title);
        detail.author = author;
        detail.status = status;
        detail.category = category;
        detail.description = description;
        detail.thumbnail = thumbanail;
        detail.type = MediaType.Picture;
        detail.hasChapter = true;
        detail.volumes = [new ItemVolume("章節", chapters.reverse())];

        return detail;
    }

    private loadScriptContent(html: string): string[] {
        let $nodes = $(html);
        let result: string[] = [];
        $nodes.each((index, element) => {
            if (element instanceof HTMLScriptElement) {
                let scriptContent = element.innerHTML;
                if (scriptContent.includes("XMANHUA_CURL")) {
                    // var XMANHUA_CID = 134056;  -> 134056
                    let cid = scriptContent.match(/var\s+XMANHUA_CID\s*=\s*(\d+);/)?.[1] || "";
                    // var XMANHUA_IMAGE_COUNT = 30;
                    let imageCount = scriptContent.match(/var\s+XMANHUA_IMAGE_COUNT\s*=\s*(\d+);/)?.[1] || "";
                    // var XMANHUA_CTITLE = "黑貓篇43話";
                    let title = scriptContent.match(/var\s+XMANHUA_CTITLE\s*=\s*"([^"]+)";/)?.[1] || "";

                    // var XMANHUA_VIEWSIGN = "c3d6f6ee15048ab2d87f71bc3c1b389e";
                    let sign = scriptContent.match(/var\s+XMANHUA_VIEWSIGN\s*=\s*"([^"]+)";/)?.[1] || "";

                    // var XMANHUA_VIEWSIGN_DT = "2026-01-08 15:17:18";
                    let dt = scriptContent.match(/var\s+XMANHUA_VIEWSIGN_DT\s*=\s*"([^"]+)";/)?.[1] || "";

                    // var XMANHUA_COMIC_MID = 11505;
                    let mid = scriptContent.match(/var\s+XMANHUA_COMIC_MID\s*=\s*(\d+);/)?.[1] || "";

                    result = [cid, imageCount, title, sign, dt, mid]; // Exit the each loop
                    console.log("Xmanhua loadScriptContent:", result);
                    return false;
                }
            }
        });
        return result;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        //https://www.xmanhua.com/m134056/
        var htmlResponse = await this.client?.request({ url: url, method: "GET" });
        var html = htmlResponse.body;
        let results = this.loadScriptContent(html);
        if (results.length < 2) {
            return new PictureMedia("-1", "", []);
        }
        let cid = results[0];
        let imageCount = parseInt(results[1] || "0");
        let title = results[2] || "";
        let sign = results[3] || "";
        let dt = results[4] || "";
        let mid = results[5] || "";
        let param = `_cid=${cid}&_mid=${mid}&_dt=${encodeURIComponent(dt)}&_sign=${sign}`;

        let images: string[] = [];
        let page = 1;
        // https://www.xmanhua.com/m134056/chapterimage.ashx?cid=134056&page=31
        while (page < imageCount) {
            let api = this.site.baseUrl + `/${id}/chapterimage.ashx?cid=${cid}&page=${page}&${param}`;
            let response = await this.client.request({ url: api, method: "GET", headers: [{ key: "Referer", value: this.site.baseUrl }] });
            let scriptContent = response.body;
            if (scriptContent.length < 10) {
                break;
            }
            try {
                // [`image1.jpg`, `image2.jpg`, ...]
                let array: string[] = [];
                let result = eval(scriptContent);
                console.log("result:", result);
                if (result && Array.isArray(result) == false) {
                    array = eval(result);
                } else {
                    array = result;
                }
                let imagesJson: string[] = array;

                images.push(...imagesJson);
                page = images.length + 1;
            } catch (err) {
                console.error("Xmanhua parse image error:", err);
                break;
            }
        }

        let media = new PictureMedia(id, title, images);
        media.refer = this.site.baseUrl;
        return media;
    }
}

(function () {
    const xmanhua = new Xmanhua();
    xmanhua.init();
})();

export default Xmanhua;