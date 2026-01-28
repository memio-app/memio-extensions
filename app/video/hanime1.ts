import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, MediaType, VideoMedia } from '@/core/extension';

class HAnime1 extends Rule {

    provideExtensionInfo(): Extension {

        let site = new Extension("hanime1", "H動漫/裏番/線上看", MediaType.Video);
        site.thumbnail = "https://vdownload.hembed.com/image/icon/nav_logo.png?secure=HxkFdqiVxMMXXjau9riwGg==,4855471889";

        site.baseUrl = "https://hanime1.me";
        site.description = "Hanime1.me 帶給你最完美的H動漫、H動畫、裏番、里番、成人色情卡通片的線上看體驗，絕對沒有天殺的片頭廣告！";
        site.lang = "zh-TW";

        site.categoryList = [
            new SiteUrl("全部", "/search?genre=%E5%85%A8%E9%83%A8&page={page}"),
            new SiteUrl("裏番", "/search?genre=%E8%A3%8F%E7%95%AA&page={page}"),
            new SiteUrl("泡麵番", "/search?genre=%E6%B3%A1%E9%BA%B5%E7%95%AA&page={page}"),
            new SiteUrl("Motion Anime", "/search?genre=Motion+Anime&page={page}"),
            new SiteUrl("3DCG", "/search?genre=3DCG&page={page}"),
            new SiteUrl("2.5D", "/search?genre=2.5D&page={page}"),
            new SiteUrl("2D動畫", " /search?genre=2D%E5%8B%95%E7%95%AB&page={page}"),
            new SiteUrl("AI生成", " /search?genre=AI%E7%94%9F%E6%88%90&page={page}"),
            new SiteUrl("MMD", " /search?genre=MMD&page={page}"),
            new SiteUrl("Cosplay", " /search?genre=Cosplay&page={page}"),
        ];

        site.searchList = [
            new SiteUrl("搜尋", "/search?genre=%E8%A3%8F%E7%95%AA&query={keyword}&page={page}"),
        ]


        return site;
    }

    private parseVerVideo(nodeList: JQuery<HTMLElement>): ExtensionDetail[] {
        let items: ExtensionDetail[] = [];

        nodeList.each((index, element) => {
            const ele = $(element);
            let link = ele.attr("href") || "";
            if (!link.startsWith(this.site.baseUrl)) {
                return;
            }
            // https://hanime1.me/watch?v=166451 -> 166451
            let id = link.split("v=")[1];
            let title = ele.find("div.home-rows-videos-title").text().trim();
            let thumbnail = ele.find("img").attr("src") || "";

            let detail = new ExtensionDetail(id, link, title);
            detail.thumbnail = thumbnail;
            detail.hasChapter = false;
            detail.type = MediaType.Video;
            items.push(detail);
        });
        return items;
    }

    private parseHorVideo(nodeList: JQuery<HTMLElement>): ExtensionDetail[] {
        let items: ExtensionDetail[] = [];
        nodeList.each((index, element) => {
            const ele = $(element);

            let link = ele.find("a").attr("href") || "";
            if (!link.startsWith(this.site.baseUrl)) {
                return;
            }
            // https://hanime1.me/watch?v=166451 -> 166451
            let id = link.split("v=")[1];
            let thumbnail = ele.find("img").last().attr("src") || "";
            let title = ele.find("div.card-mobile-title").text().trim();
            let status = ele.find("div.card-mobile-duration").first().text().trim();
            let author = ele.find("a.card-mobile-user").text().trim();

            status = status.replace(/\n/g, "").replace(/\s/g, "");

            let detail = new ExtensionDetail(id, link, title);
            detail.thumbnail = thumbnail;
            detail.hasChapter = false;
            detail.status = status;
            detail.author = author;
            detail.type = MediaType.Video;
            if (!this.dupliteDetail(detail, items)) {
                items.push(detail);
            }
        });

        return items;
    }

    private dupliteDetail(detail: ExtensionDetail, items: ExtensionDetail[]): boolean {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === detail.id) {
                return true;
            }
        }
        return false;
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let searchUrl = url.replace("{keyword}", encodeURIComponent(keyword));
        return this.requestItemList(searchUrl, page);
    }


    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = this.site.baseUrl + url.replace("{page}", page.toString());
        var nextUrl = this.site.baseUrl + url.replace("{page}", (page + 1).toString());
        const response = await this.client.request({ url: realUrl, method: "GET" });

        const html = response.body;

        const $nodes = $(html);
        let items: ExtensionDetail[] = [];

        let nodeList = $nodes.find("div.home-rows-videos-wrapper > a");
        if (nodeList.length == 0) {
            nodeList = $nodes.find("div#home-rows-wrapper div.content-padding-new div.row > div");
            items = this.parseHorVideo(nodeList);
        } else {
            items = this.parseVerVideo(nodeList);
        }

        let pagination = $nodes.find("ul.pagination:eq(0) li.page-item").last();
        let nextA = pagination.find("a")?.attr("href") || "";
        let hasMore = nextA.length > 0;
        return new ExtensionList(items, page, hasMore ? nextUrl : undefined);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // https://hanime1.me/watch?v=400589
        let api = this.site.baseUrl + `/watch?v=` + id;
        const response = await this.client.request({ url: api, method: "GET" });

        const html = response.body;
        const $nodes = $(html);
        let title = $nodes.find("h3.shareBtn-title").text().trim();

        let playerSource = $nodes.find("video#player source");
        if (playerSource.length == 0) {
            let media = new VideoMedia(id, "", url, true, false);
            return media;
        }

        let maxSource = "480";
        let playUrl = "";
        playerSource.each((index, element) => {
            const ele = $(element);
            let sourceLink = ele.attr("src") || "";
            let size = ele.attr("size") || "480";
            if (size >= maxSource) {
                playUrl = sourceLink;
                maxSource = size;
            }
        });
        if (playUrl.length == 0) {
            let media = new VideoMedia(id, "", url, true, false);
            return media;
        }

        let media = new VideoMedia(id, title, playUrl, false, false);
        return media;
    }

}

(function () {
    const hanime1 = new HAnime1();
    hanime1.init();
})();

export default HAnime1;