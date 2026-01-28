import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';
import { getDecodePic, getImageUrls } from '@/utils/laimaihua-util';

class Laimanhua extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("laimanhua", "来漫画", MediaType.Picture);
        site.baseUrl = "https://www.laimanhua88.com";
        site.thumbnail = "https://www.laimanhua88.com/template/skin4_20110501/images/logo.png";
        site.lang = "zh-HK";
        site.description = "来漫画是一个免费在线漫画阅读网站，提供海量优质漫画资源，涵盖各种类型和题材，满足不同读者的需求。用户可以方便地浏览、搜索和阅读最新的漫画作品，享受高质量的阅读体验。";
        site.categoryList = [
            new SiteUrl("日韩漫画", "/kanmanhua/zaixian_rhmh/{page}.html"),
            new SiteUrl("国产漫画", "/kanmanhua/zaixian_dlmh/{page}.html"),
            new SiteUrl("欧美漫画", "/kanmanhua/zaixian_ommh/{page}.html"),
            new SiteUrl("港台漫画", "/kanmanhua/zaixian_gtmh/{page}.html"),

            new SiteUrl("少年热血", "/kanmanhua/rexue/{page}.html"),
            new SiteUrl("武侠格斗", "/kanmanhua/gedou/{page}.html"),
            new SiteUrl("科幻魔幻", "/kanmanhua/kehuan/{page}.html"),
            new SiteUrl("竞技体育", "/kanmanhua/jingji/{page}.html"),
            new SiteUrl("爆笑喜剧", "/kanmanhua/gaoxiao/{page}.html"),
            new SiteUrl("侦探推理", "/kanmanhua/tuili/{page}.html"),
            new SiteUrl("恐怖灵异", "/kanmanhua/kongbu/{page}.html"),
            new SiteUrl("耽美人生", "/kanmanhua/danmei/{page}.html"),
            new SiteUrl("少女爱情", "/kanmanhua/shaonv/{page}.html"),
            new SiteUrl("恋爱生活", "/kanmanhua/lianai/{page}.html"),
            new SiteUrl("生活漫画", "/kanmanhua/shenghuo/{page}.html"),
        ];

        site.configParams = [
            { key: "host", value: "新域名，如（https://www.laimanhua88.com),無特殊需求勿更改" },
        ];
        site.imageRefer = "https://www.laimanhua88.com";

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

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let apiUrl = this.site.baseUrl + url.replace("{page}", page.toString());

        var htmlResponse = await this.client?.request({ url: apiUrl, method: "GET", responseCharset: "gb2312", });
        let $nodes = $(htmlResponse.body);

        let itemNodes = $nodes.find("div.dmList ul > li");
        let details: ExtensionDetail[] = [];

        itemNodes.each((index, element) => {
            let ele = $(element);
            let link = ele.find("p.cover a.pic").attr("href") ?? "";

            // /kanmanhua/zhongjidouluo/ -> zhongjidouluo
            let id = link.split("/")[2] ?? "";

            let thumb = ele.find("p.cover a.pic img").attr("src") ?? "";

            let updateInfo = ele.find("p.cover span a").text().trim();

            let title = ele.find("dl > dt > a").first().text().trim();
            let date = ele.find("dl > dd > p:eq(0) span").text().trim();
            let status = ele.find("dl > dd > p span.red").text().trim();
            let category = ele.find("dl > dd > p a").first().text().trim();
            let p = ele.find("dl > dd > p.intro").text().trim();

            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = thumb;
            detail.description = p;
            detail.author = updateInfo + "," + date;
            detail.category = category;
            detail.status = status;
            detail.type = MediaType.Picture;
            detail.hasChapter = true;

            details.push(detail);
        });

        let pagerCont = $nodes.find("div#pager > a").last().attr("href") ?? "";
        // 252.html -> 252
        let nextPage = pagerCont.match(/(\d+)\.html/)?.[1];
        let hasMore = details.length >= 30 && nextPage !== undefined && parseInt(nextPage) > page;
        let nextApi = hasMore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextApi);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {

        let apiUrl = this.site.baseUrl + `/kanmanhua/${id}/`;
        var htmlResponse = await this.client?.request({ url: apiUrl, method: "GET", responseCharset: "gb2312", });
        let $nodes = $(htmlResponse.body);

        let introNode = $nodes.find("div#intro_l");
        let title = introNode.find("div.title h1").text().trim();
        let updateInfo = introNode.find("div.title span a").text().trim();
        let author = introNode.find("div.info p:eq(1)").text().trim();
        let category = introNode.find("div.info p:eq(4) a").text().trim();

        let description = $nodes.find("div#intro1").text().trim();

        let chapters: ItemChapter[] = [];
        let chapterNodes = $nodes.find("div.plist ul li");
        chapterNodes.each((index, element) => {
            let ele = $(element);
            let chapLink = ele.find("a").attr("href") ?? "";
            // /kanmanhua/zhongjidouluo/32936.html -> 32936
            let chapId = chapLink.split("/").pop()?.replace(".html", "")?.trim();
            let chapTitle = ele.find("a").text().trim();

            let chapter = new ItemChapter(chapId ?? "", this.site.baseUrl + chapLink, chapTitle);
            chapters.push(chapter);
        });
        let volume = new ItemVolume("漫画列表", chapters.reverse());

        let detail = new ExtensionDetail(id, apiUrl, title);
        detail.type = MediaType.Picture;
        detail.volumes = [volume];
        detail.author = author;
        detail.category = category;
        detail.description = description;
        detail.status = updateInfo;
        detail.hasChapter = true;
        return detail;
    }

    private searchImageScriptElement($nodes: JQuery<HTMLElement>): string {
        let jsonString = "";

        $nodes.each((index, element) => {
            if (element instanceof HTMLScriptElement) {
                let scriptContent = element.innerHTML;
                if (scriptContent.indexOf("var picTree =") >= 0) {
                    // var nextUrlid='1777223629',preUrlid='35830038';var picTree ='...';
                    // -> '...'
                    let encodeJson = scriptContent.match(/var picTree ='(.+?)';/)?.[1] ?? "";
                    jsonString = encodeJson;
                    return false; // Exit the each loop
                }
            }
        });
        console.log("Laimanhua image jsonString:", jsonString);
        return jsonString;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // https://www.laimanhua88.com/kanmanhua/couhejiedi/51240039.html
        var htmlResponse = await this.client?.request({ url: url, method: "GET", responseCharset: "gb2312", });
        let $nodes = $(htmlResponse.body);

        let picTree = this.searchImageScriptElement($nodes);

        try {
            let ids = this.getCurrentChapterid($nodes);
            let currentChapterid = ids[0];
            let cid = ids[1];

            let encodeImages = getImageUrls(picTree);

            let urlList: string[] = [];
            encodeImages.forEach((value) => {
                let realurl = getDecodePic(value, currentChapterid, cid);
                //console.log("Laimanhua decode image url:", realurl);
                urlList.push(realurl);
            });

            let media = new PictureMedia(id, url, urlList);
            media.refer = this.site.baseUrl;
            return media;

        } catch (e) {
            console.log("Laimanhua parse image error:", e);
        }

        return new PictureMedia("-1", url, []);

    }

    private getCurrentChapterid($nodes: JQuery<HTMLElement>): string[] {
        let jsonString = "";
        let cid = "";

        $nodes.each((index, element) => {
            if (element instanceof HTMLScriptElement) {
                let scriptContent = element.innerHTML;
                if (scriptContent.indexOf("var currentChapterid") >= 0) {
                    // var currentChapterid = '1875201'; -> 1875201
                    console.log("Laimanhua currentChapterid scriptContent:", scriptContent);
                    let encodeJson = scriptContent.match(/var currentChapterid = '(.+?)';/)?.[1] ?? "";

                    jsonString = encodeJson;

                    // var cid = "47307"; -> 47307
                    let cidMatch = scriptContent.match(/var cid = "(.+?)";/);
                    if (cidMatch) {
                        cid = cidMatch[1];
                    }
                    return false; // Exit the each loop
                }
            }
        });
        console.log("currentChapterid:", jsonString, cid);
        return [jsonString, cid];
    }

}

(function () {
    const lmh = new Laimanhua();
    lmh.init();
})();

export default Laimanhua;