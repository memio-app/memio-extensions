import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType } from '@/core/extension';

class BaoziMH extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("baozimh", "包子漫画", MediaType.Picture);
        site.baseUrl = "https://www.baozimh.com";
        site.description = "包子漫畫爲您提供優質的漫畫閱讀體驗。連載漫畫，免費漫畫，玄幻漫畫，言情漫畫，穿越漫畫，都市漫畫，仙俠漫畫，武俠漫畫，現代言情漫畫，古代言情漫畫，靈異漫畫，遊戲漫畫，歷史漫畫，懸疑漫畫，科幻漫畫，競技體育漫畫，軍事漫畫，青春漫畫，耽美漫畫，日漫，國漫，看不完的漫畫，漫畫閱讀網站，就在包子漫畫";
        site.thumbnail = "https://www.baozimh.com/favicon.ico";
        site.lang = "zh-TW";
        site.categoryList = [
            new SiteUrl("全部", "region=all&type=all"),
            new SiteUrl("國漫", "region=cn&type=all"),
            new SiteUrl("日本", "region=jp&type=all"),
            new SiteUrl("韓國", "region=kr&type=all"),
            new SiteUrl("歐美", "region=en&type=all"),

            new SiteUrl("連載中", "region=all&type=all&state=serial"),
            new SiteUrl("已完結", "region=all&type=all&state=pub"),

            new SiteUrl("戀愛", "region=all&type=lianai"),
            new SiteUrl("純愛", "region=all&type=xiaoyuan"),
            new SiteUrl("古風", "region=all&type=gufeng"),
            new SiteUrl("異能", "region=all&type=yineng"),
            new SiteUrl("懸疑", "region=all&type=xuanyi"),
            new SiteUrl("劇情", "region=all&type=juqing"),
            new SiteUrl("科幻", "region=all&type=kehuan"),
            new SiteUrl("奇幻", "region=all&type=qihuan"),
            new SiteUrl("玄幻", "region=all&type=xuanhuan"),
            new SiteUrl("穿越", "region=all&type=chuanyue"),
            new SiteUrl("冒險", "region=all&type=mouxian"),
            new SiteUrl("推理", "region=all&type=tuili"),
            new SiteUrl("武俠", "region=all&type=wuxia"),
            new SiteUrl("格鬥", "region=all&type=gedou"),
            new SiteUrl("戰爭", "region=all&type=zhanzheng"),
            new SiteUrl("熱血", "region=all&type=rexie"),
            new SiteUrl("搞笑", "region=all&type=gaoxiao"),
            new SiteUrl("大女主", "region=all&type=danuzhu"),
            new SiteUrl("都市", "region=all&type=dushi"),
            new SiteUrl("總裁", "region=all&type=zongcai"),
            new SiteUrl("後宮", "region=all&type=hougong"),
            new SiteUrl("日常", "region=all&type=richang"),
            new SiteUrl("韓漫", "region=all&type=hanman"),
            new SiteUrl("少年", "region=all&type=shaonian"),
            new SiteUrl("其它", "region=all&type=qita"),
        ];

        site.searchList = [
            new SiteUrl("檢索", "search?q={keyword}"),
        ];

        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/api/bzmhq/amp_comic_list?" + url + `&page=${page}&limit=36`;

        var htmlResponse = await this.client?.request(
            { url: api, method: "GET" });

        try {
            var json = JSON.parse(htmlResponse.body);
            let items = json.items;
            let details: ExtensionDetail[] = [];
            items.forEach((item: any) => {
                let id = item.comic_id;
                let category = item.type_names.join(", ");
                let author = item.author;
                let title = item.name;
                let thumbnail = "https://static-tw.baozimh.com/cover/" + item.topic_img;
                let state = item.region_name;
                let link = this.site.baseUrl + "/comic/" + id;

                let detail = new ExtensionDetail(id, link, title);
                detail.thumbnail = thumbnail;
                detail.category = category;
                detail.author = author;
                detail.status = state;
                detail.hasChapter = true;
                detail.type = MediaType.Picture;
                details.push(detail);
            });
            let nextApi = details.length >= 36 ? this.site.baseUrl + "/api/bzmhq/amp_comic_list?" + url + `&page=${page + 1}&limit=36` : undefined;
            return new ExtensionList(details, page, nextApi);
        } catch (e) {
            console.log(e);
        }
        return new ExtensionList([], page, undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/" + url.replace("{keyword}", encodeURIComponent(keyword));

        var htmlResponse = await this.client?.request({ url: api, method: "GET" });
        let $nodes = $(htmlResponse.body);

        let details: ExtensionDetail[] = [];
        let listNodes = $nodes.find("div.classify-items > div.comics-card");
        listNodes.each((_i, el) => {
            let item = $(el);
            let link = item.find("a.comics-card__poster").attr("href");
            if (link == undefined) return;

            let id = link.match(/\/comic\/(.*?)$/)?.[1] ?? "";

            let thumbnail = item.find("a.comics-card__poster amp-img").first().attr("src");

            let title = item.find("a.comics-card__info div.comics-card__title h3").text().trim();
            let author = item.find("a.comics-card__info small").text().trim();
            let category = item.find("a.comics-card__poster div.tabs span").first().text().trim();

            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = thumbnail;
            detail.author = author;
            detail.category = category;
            detail.hasChapter = true;
            detail.type = MediaType.Picture;
            details.push(detail);
        });
        return new ExtensionList(details, page, undefined);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        var htmlResponse = await this.client?.request(
            { url: url, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);

        let detail = $nodes.find("div.comics-detail");
        let thumbnail = detail.find("div.de-info__bg").attr("style")?.match(/url\('(.*?)'\)/)?.[1];
        let title = detail.find("h1.comics-detail__title").text().trim();
        let author = detail.find("h2.comics-detail__author").text().trim();
        let tagList = detail.find("div.tag-list span.tag");
        let tags = tagList.map((_i, el) => {
            return $(el).text().trim();
        }).get().join(", ");

        let description = detail.find("p.comics-detail__desc").text().trim();

        let chapterNodes = $nodes.find("div#chapters_other_list > div, div#chapter-items > div");
        console.log("chapterNodes length:", chapterNodes.length);
        if (chapterNodes.length == 0) {
            chapterNodes = $nodes.find("div.l-box > div.pure-g > div.comics-chapters");
        }
        let chapters: ItemChapter[] = [];

        chapterNodes.each((_i, el) => {
            let chapter = $(el);
            let link = chapter.find("a").attr("href");
            if (link == undefined) return;

            // /user/page_direct?comic_id=modujingbingdenuli-zhucunyangping&section_slot=0&chapter_slot=26 -> 26
            let id = link.match(/chapter_slot=(\d+)/)?.[1] ?? "";
            let chapterTitle = chapter.find("a span").text().trim();

            let chapterItem = new ItemChapter(id, this.site.baseUrl + link, chapterTitle);
            chapters.push(chapterItem);
        });

        let item = new ExtensionDetail(id, url, title);
        item.thumbnail = thumbnail;
        item.author = author;
        item.category = tags;
        item.description = description;
        item.hasChapter = true;
        item.type = MediaType.Picture;
        item.volumes = [
            {
                name: "章节列表",
                chapters: chapters
            }
        ];
        return item;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let hasMoreImage = true;
        let images: string[] = [];
        let title = "";
        let api = url;
        let page = 1;

        while (hasMoreImage) {
            var htmlResponse = await this.client?.request({ url: api, method: "GET" });
            var html = htmlResponse.body;
            let $nodes = $(html);
            if (title == "") {
                title = $nodes.find("div.l-content span.title").first().text().trim();
                // 第26卷(1/4) -> 第26卷
                title = title.replace(/\((\d+)\/(\d+)\)/, "").trim();
            }
            let imageNodes = $nodes.find("ul.comic-contain amp-img");
            imageNodes.each((_i, el) => {
                let img = $(el).attr("data-src");
                if (img) {
                    images.push(img);
                }
            });
            let pageA = $nodes.find("a#next-chapter").attr("href");
            // https://www.twmanga.com/comic/chapter/yiquanchaoren-one/0_354_2.html -> 0_354_2
            let pageId = pageA?.split("/").pop()?.split(".").shift();
            let sections = pageId?.split("_");
            if (pageA != undefined && sections && sections.length == 3) {
                let pageNum = parseInt(sections[2]);
                if (pageNum != undefined && pageNum === page + 1) {
                    api = pageA;
                    page = pageNum
                    hasMoreImage = true;
                } else {
                    hasMoreImage = false;
                }
            } else {
                hasMoreImage = false;
            }
        }

        let media = new PictureMedia(id, title, images);
        return media;
    }

}

(function () {
    const baozimh = new BaoziMH();
    baozimh.init();
})();

export default BaoziMH;