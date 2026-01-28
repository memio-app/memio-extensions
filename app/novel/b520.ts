import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia } from '@/core/extension';

class B520 extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("b520", "笔趣阁520", MediaType.Novel)
        site.baseUrl = "http://www.b520.cc"
        site.thumbnail = "http://www.b520.cc/favicon.ico"
        site.description = "笔趣阁是广大书友最值得收藏的网络小说阅读网，新笔趣阁网站收录了当前最火热的网络小说，笔趣阁5200免费提供高质量的小说最新章节，是广大网络小说爱好者必备的小说阅读网。"
        site.lang = "zh"
        site.categoryList = [
            { name: "玄幻小说", url: "/xuanhuanxiaoshuo" },
            { name: "修真小说", url: "/xiuzhenxiaoshuo" },
            { name: "都市小说", url: "/dushixiaoshuo" },
            { name: "穿越小说", url: "/chuanyuexiaoshuo" },
            { name: "网游小说", url: "/wangyouxiaoshuo" },
            { name: "科幻小说", url: "/kehuanxiaoshuo" },
            { name: "言情小说", url: "/yanqingxiaoshuo" },
            { name: "同人小说", url: "/tongrenxiaoshuo" },
        ]

        site.searchList = [
            new SiteUrl("搜索小说", site.baseUrl + "/modules/article/search.php?searchkey={keyword}"),
        ]

        return site
    }

    private parseItemNodes(itemNodes: JQuery<HTMLElement>): ExtensionDetail[] {

        let itemList: ExtensionDetail[] = []

        itemNodes.each((index, element) => {
            let itemNode = $(element);
            let link = itemNode.find("span.s2 > a").attr("href") || "";
            let id = link.replace(/\//g, "");
            let title = itemNode.find("span.s2 > a").text().trim();

            let description = itemNode.find("span.s3 > a").text().trim();
            let author = itemNode.find("span.s5").text().trim();
            let dateNode = itemNode.find("span.s3");
            dateNode.find("a").remove();
            let date = dateNode.text().trim().replace("(", "").replace(")", "");

            let detail: ExtensionDetail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.author = author;
            detail.description = description;
            detail.category = date;
            detail.author = author;
            detail.hasChapter = true;
            detail.type = MediaType.Novel;

            itemList.push(detail);
        })
        return itemList;
    }


    override async requestItemList(url: string, page: number): Promise<ExtensionList> {

        let pageUrl = this.site.baseUrl + `${url}`;
        let response = await this.client?.request(
            {
                url: pageUrl,
                method: "GET",
                responseCharset: "gb2312",
            }
        );
        let $nodes = $(response.body);

        let itemNodes = $nodes.find("div.l ul li");

        let itemList = this.parseItemNodes(itemNodes);

        return new ExtensionList(itemList, page, undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let searchUrl =url.replace("{keyword}",encodeURIComponent(keyword));
        let response = await this.client?.request(
            {
                url: searchUrl,
                method: "GET",
                responseCharset: "gb2312",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                ],
            }
        );
        let $nodes = $(response.body);

        let itemList: ExtensionDetail[] = []

        let itemNodes = $nodes.find("table tr");
        itemNodes.each((index, element) => {
            let itemNode = $(element);
            let link = itemNode.find("td a").first().attr("href") || "";
            let id = link.replace(/\//g, "");
            let title = itemNode.find("td a").first().text().trim();

            let description = itemNode.find("td a").eq(1).text().trim();
            let author = itemNode.find("td").eq(2).text().trim();
            let date = itemNode.find("td").eq(4).text().trim();
            let category = itemNode.find("td").eq(5).text().trim();

            let detail: ExtensionDetail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.author = author;
            detail.description = description;
            detail.category = category;
            detail.status = date;
            detail.author = author;
            detail.hasChapter = true;
            detail.type = MediaType.Novel;

            itemList.push(detail);
        });

        return new ExtensionList(itemList, page, undefined);

    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let api = this.site.baseUrl + "/" + id + "/";
        let response = await this.client?.request(
            {
                url: api,
                method: "GET",
                responseCharset: "gb2312",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                ],
            }
        );
        let $nodes = $(response.body);

        let infoNode = $nodes.find("div#info");
        let title = infoNode.find("h1").text().trim();
        let author = infoNode.find("p").first().text().trim();
        let category = infoNode.find("p").last().text().trim();
        let description = $nodes.find("div#intro").text().trim();
        let cover = $nodes.find("div#fmimg img").attr("src");
        let thumbnail = cover;
        if(cover && !cover.startsWith("http")){
            thumbnail = this.site.baseUrl + cover;
        }

        let detail = new ExtensionDetail(id, url, title)
        detail.author = author;
        detail.description = description;
        detail.hasChapter = true;
        detail.thumbnail = thumbnail;
        detail.category = category;
        detail.type = MediaType.Novel;

        // find dt or dd
        let chapterNodes = $nodes.find("dt,dd");
        let volumes: ItemVolume[] = [];
        let chapters: ItemChapter[] = [];
        chapterNodes.each((index, element) => {
            let chapterNode = $(element);
            if (element.tagName.toLowerCase() === "dt") {
                chapters = [];
                let existVolume = new ItemVolume(chapterNode.text().trim(), chapters);
                volumes.push(existVolume);
                return;
            }

            let chapterLink = chapterNode.find("a").attr("href") || "";
            let chapterId = chapterLink.split("/").pop()?.replace(".html", "") || "";
            let chapterTitle = chapterNode.find("a").text().trim();

            let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink, chapterTitle);
            chapters.push(chapter);
        });

        detail.volumes = volumes.reverse();

        return detail;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let response = await this.client?.request(
            {
                url: url, method: "GET", responseCharset: "gb2312",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36" },
                ],
            });
        let $nodes = $(response.body);

        let contentNode = $nodes.find("div#content");
        let title = $nodes.find("div.bookname h1").text().trim();
        // remove script
        contentNode.find("script").remove();
        let content = `<html><p>${contentNode.html()}</p></html>`;

        let media = new NovelMedia(id, title, content);

        return media;
    }

}

(function () {
    const rule = new B520();
    rule.init();
})();

export default B520;