import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';
import { decompressFromBase64 } from 'lz-string';

declare global {
    interface String {
        splic(f: string): string[];
    }
}

String.prototype.splic = function (f) {
    return (decompressFromBase64(String(this)) || "").split(f)
};

class ManhuaGui extends Rule {

    imageHost: string = "https://eu.hamreus.com";

    provideExtensionInfo(): Extension {
        let site = new Extension("manhuagui", "漫畫櫃", MediaType.Picture);
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

    override async config(form: Map<string, string>): Promise<boolean> {
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
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let listUrl = this.site.baseUrl + url.replace("{page}", page.toString());

        var htmlResponse = await this.client?.request(
            { url: listUrl, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let itemNodes = $nodes.find("div.book-list ul#contList > li");
        let details: ExtensionDetail[] = [];
        itemNodes.each((_i, el) => {
            let item = $(el);
            let link = item.find("a.bcover").attr("href") ?? "";
            // /comic/55430/ -> 55430
            let id = link.match(/\/comic\/(\d+)\//)?.[1] ?? "";

            let thumbnail = item.find("a.bcover img").attr("src") ?? "";
            if (thumbnail.length == 0) {
                thumbnail = item.find("a.bcover img").attr("data-src") ?? "";
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
            detail.type = MediaType.Picture;
            details.push(detail);
        });

        let pagerCont = $nodes.find("div#AspNetPager1 > a").last().attr("href") ?? "";
        // /list/rexue/update_p43.html -> 43
        let nextPage = pagerCont.match(/_p(\d+)\.html/)?.[1];
        console.log("ManhuaGui search nextPage:", nextPage);
        let hasMore = details.length >= 42 && nextPage !== undefined && parseInt(nextPage) > page;
        let nextApi = hasMore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextApi);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let searchUrl = this.site.baseUrl + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());

        var htmlResponse = await this.client?.request({ url: searchUrl, method: "GET" });
        let $nodes = $(htmlResponse.body);
        let itemNodes = $nodes.find("div.book-result ul > li");
        let details: ExtensionDetail[] = [];
        itemNodes.each((_i, el) => {
            let item = $(el);
            let link = item.find("a.bcover").attr("href") ?? "";
            // /comic/55430/ -> 55430
            let id = link.match(/\/comic\/(\d+)\//)?.[1] ?? "";

            let thumbnail = item.find("a.bcover img").attr("src") ?? "";
            if (thumbnail.length == 0) {
                thumbnail = item.find("a.bcover img").attr("data-src") ?? "";
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
            detail.type = MediaType.Picture;
            details.push(detail);
        });

        let pagerCont = $nodes.find("div#AspNetPagerResult > a").last().attr("href") ?? "";
        // /list/rexue/update_p43.html -> 43
        let nextPage = pagerCont.match(/_p(\d+)\.html/)?.[1];
        let hasMore = details.length >= 10 && nextPage !== undefined && parseInt(nextPage) > page;
        let nextApi = hasMore ? this.site.baseUrl + url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextApi);

    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let api = this.site.baseUrl + `/comic/${id}/`;
        var htmlResponse = await this.client?.request({ url: api, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);
        let bookCover = $nodes.find("div.book-cover");
        let thumbnail = bookCover.find("img").attr("src") ?? "";
        if (thumbnail.startsWith("//")) {
            thumbnail = "https:" + thumbnail;
        }
        let updated = bookCover.find("p.text").text().trim();
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
        let volumes: ItemVolume[] = [];
        let volume: ItemVolume | undefined;

        chapterNodes.each((_i, el) => {
            let node = $(el);
            if (el.tagName.toLowerCase() === "h4") {
                let volumeTitle = node.text().trim();
                volume = new ItemVolume(volumeTitle, []);
                volumes.push(volume);
            } else {
                let chapterLists = node.find("ul");

                chapterLists.each((_j, elc) => {
                    let volumePart = $(elc);
                    let chapterNodes = volumePart.find("li");
                    let partChapters: ItemChapter[] = [];
                    chapterNodes.each((_k, elch) => {
                        let chapter = $(elch);
                        let link = chapter.find("a").attr("href") ?? "";
                        let title = chapter.find("a").attr("title") ?? "";
                        // /comic/19430/585115.html -> 585115
                        let chapterId = link.match(/\/comic\/\d+\/(\d+)\.html/)?.[1] ?? "";
                        let itemChapter = new ItemChapter(chapterId, this.site.baseUrl + link, title);
                        partChapters.push(itemChapter);
                    });
                    volume?.chapters.push(...(partChapters.reverse()));
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
        detail.type = MediaType.Picture;
        return detail;
    }

    private searchImageScriptElement(html: string): string {
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

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let htmlResponse = await this.client.request({ url: url, method: "GET" });
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
        } catch (e) {
            console.error("Failed to parse image data:", e);
        }
        return new PictureMedia("-1", "未知", []);
    }

}

(function () {
    const manhuagui = new ManhuaGui();
    manhuagui.init();
})();

export default ManhuaGui;