import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia } from '@/core/extension';

class Uuubqq extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("uuubqq", "顶点小说网", MediaType.Novel)
        site.baseUrl = "https://www.uuubqq.cc"
        site.thumbnail = "https://www.uuubqq.cc/favicon.ico"
        site.description = "顶点小说网是一个免费在线小说阅读网站，小说免费在线阅读和下载。页面干净简洁，无弹窗无广告。看小说阅读小说，就到顶点小说网。"
        site.lang = "zh"
        site.categoryList = [
            { name: "首页", url: "/" },
            { name: "玄幻魔法", url: "/class/1_1" },
            { name: "武侠修真", url: "/class/2_1" },
            { name: "都市言情", url: "/class/3_1" },
            { name: "历史军事", url: "/class/4_1" },
            { name: "侦探推理", url: "/class/5_1" },
            { name: "网游动漫", url: "/class/6_1" },
            { name: "科幻小说", url: "/class/7_1" },
            { name: "恐怖灵异", url: "/class/8_1" },
            { name: "其他类型", url: "/class/10_1" },
            { name: "全本小说", url: "/full" },
        ]

        return site
    }

    private parseItemNodes(itemNodes: JQuery<HTMLElement>): ExtensionDetail[] {

        let itemList: ExtensionDetail[] = []

        itemNodes.each((index, element) => {
            let itemNode = $(element);
            let link = itemNode.find("span.s2 > a").attr("href") || "";
            // replace all / with empty string
            let id = link.replace(/\//g, "");
            let title = itemNode.find("span.s2 > a").text().trim();

            let category = itemNode.find("span.s1").text().trim();
            let description = itemNode.find("span.s3 > a").text().trim();
            let author = itemNode.find("span.s4").text().trim();
            let date = itemNode.find("span.s5").text().trim();

            let detail: ExtensionDetail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.author = author;
            detail.category = category;
            detail.description = description;
            detail.status = date;
            detail.author = author;
            detail.hasChapter = true;

            itemList.push(detail);
        })
        return itemList;
    }


    override async requestItemList(url: string, page: number): Promise<ExtensionList> {

        let pageUrl = this.site.baseUrl + `${url}.html`;
        if (url === "/") {
            pageUrl = this.site.baseUrl;
        }

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

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let api = this.site.baseUrl + "/" + id + "/";
        let response = await this.client?.request(
            {
                url: api,
                method: "GET",
                responseCharset: "gb2312",
            }
        );
        let $nodes = $(response.body);

        let infoNode = $nodes.find("div#info");
        let title = infoNode.find("h1").text().trim();
        let author = infoNode.find("p").first().text().trim();
        let statusNode = infoNode.find("p").eq(1);
        let category = infoNode.find("p").last().text().trim();
        statusNode.find("a").remove();
        let status = statusNode.text().trim();
        let description = $nodes.find("div#intro").text().trim();
        let cover = $nodes.find("div#fmimg img").attr("src");
        let thumbnail = cover;
        if(cover && !cover.startsWith("http")){
            thumbnail = this.site.baseUrl + cover;
        }

        let detail = new ExtensionDetail(id, url, title)
        detail.author = author;
        detail.description = description;
        detail.status = status;
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
        let response = await this.client?.request({ url: url, method: "GET", responseCharset: "gb2312", });
        let $nodes = $(response.body);

        let contentNode = $nodes.find("div#content");
        let title = $nodes.find("div.content h1").text().trim();
        // remove script
        contentNode.find("script").remove();
        let content = `<html><p>${contentNode.html()}</p></html>`;

        let media = new NovelMedia(id, title, content);

        return media;
    }

}

(function () {
    const rule = new Uuubqq();
    rule.init();
})();

export default Uuubqq;