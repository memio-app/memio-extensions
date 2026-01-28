import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia } from '@/core/extension';

class Shukuge extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("shukuge", "365Book", MediaType.Novel)
        site.baseUrl = "http://www.shukuge.com"
        site.thumbnail = "http://www.shukuge.com/favicon.ico"
        site.description = "免费全本小说下载_TXT免费小说_免费小说下载 - 365小说网"
        site.lang = "zh"
        site.categoryList = [
            { name: "最新收录", url: site.baseUrl + "/new/" },
            { name: "最新短篇小说", url: site.baseUrl + "/l-duanpian/" },
            { name: "最新中篇小说", url: site.baseUrl + "/l-zhongpian/" },
            { name: "最新长篇小说", url: site.baseUrl + "/l-changpian/" },
            { name: "玄幻小说", url: site.baseUrl + "/i-xuanhuan/" },
            { name: "言情小说", url: site.baseUrl + "/i-yanqing/" },
            { name: "穿越小说", url: site.baseUrl + "/i-chuanyue/" },
            { name: "重生小说", url: site.baseUrl + "/i-chongsheng/" },
            { name: "架空小说", url: site.baseUrl + "/i-jiakong/" },
            { name: "总裁小说", url: site.baseUrl + "/i-zongcai/" },
            { name: "仙侠小说", url: site.baseUrl + "/i-xianxia/" },
            { name: "武侠小说", url: site.baseUrl + "/i-wuxia/" },
            { name: "耽美小说", url: site.baseUrl + "/i-danmei/" },
            { name: "都市小说", url: site.baseUrl + "/i-dushi/" },
            { name: "军事小说", url: site.baseUrl + "/i-junshi/" },
            { name: "网游小说", url: site.baseUrl + "/i-wangyou/" },
            { name: "悬疑小说", url: site.baseUrl + "/i-xuanyi/" },
            { name: "文学小说", url: site.baseUrl + "/i-wenxue/" },
            { name: "科幻小说", url: site.baseUrl + "/i-kehuan/" },
            { name: "修真小说", url: site.baseUrl + "/i-xiuzhen/" },
            { name: "历史小说", url: site.baseUrl + "/i-lishi/" },
            { name: "其他小说", url: site.baseUrl + "/i-qita/" }
        ]

        site.searchList = [
            new SiteUrl("作者/小说名", site.baseUrl + "/Search?wd=")
        ]

        return site
    }

    private parseItemNodes(itemNodes: JQuery<HTMLElement>): ExtensionDetail[] {

        let itemList: ExtensionDetail[] = []

        itemNodes.each((index, element) => {
            let itemNode = $(element);
            let link = itemNode.find("div.bookdesc > a").attr("href") || "";
            // /book/160349/ -> 160349
            let id = link.match(/\/book\/(\d+)\//)?.[1] || "";
            let title = itemNode.find("div.bookdesc h2").text().trim();
            let cover = itemNode.find("a.cover img").attr("src") || "";

            let detailNodes = itemNode.find("p.sp span");
            let author = detailNodes.eq(0).text().trim();
            let category = detailNodes.text().replace(author, "").trim();
            let description = itemNode.find("div.bookdesc p.desc").first().text().trim();

            let detail: ExtensionDetail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.author = author;
            detail.thumbnail = this.site.baseUrl + cover;
            detail.category = category;
            detail.description = description;
            detail.hasChapter = true;

            itemList.push(detail);
        })
        return itemList;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {

        let pageUrl = url + page
        let nextPageUrl = url + (page + 1)
        let response = await this.client?.request({ url: pageUrl, method: "GET" });

        let $nodes = $(response.body);
        let itemNodes = $nodes.find("div.panel-body div.listitem");

        let itemList = this.parseItemNodes(itemNodes);

        let hasNextPage = false;
        let nextPageLi = $nodes.find("ul.pagination li.active").next();
        if (nextPageLi.hasClass("disabled")) {
            hasNextPage = false;
        } else {
            hasNextPage = true;
        }
        return new ExtensionList(itemList, page, hasNextPage ? nextPageUrl : undefined)
    }


    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let pageUrl = url + encodeURIComponent(keyword);

        let response = await this.client?.request({ url: pageUrl, method: "GET" });
        let $nodes = $(response.body);
        let itemNodes = $nodes.find("div.panel-body div.listitem");

        let itemList = this.parseItemNodes(itemNodes);

        return new ExtensionList(itemList, page, undefined);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let response = await this.client?.request({ url: url, method: "GET" });
        let $nodes = $(response.body);

        let itemNode = $nodes.find("div.bookd");
        let title = itemNode.find("div.bookd-title h1").text().replace("TXT全集","").trim();
        let cover = itemNode.find("div.bookdcover img").attr("src") || "";

        let detailNodes = itemNode.find("div.bookdmore p");
        let author = detailNodes.eq(2).text().trim();
        let category = detailNodes.eq(1).text().trim();
        let description = itemNode.find("div.bookdtext p").first().text().trim();
        let date = detailNodes.last().text().trim();

        let detail: ExtensionDetail = new ExtensionDetail(id, url, title);
        detail.author = author;
        detail.thumbnail = this.site.baseUrl + cover;
        detail.category = category;
        detail.description = description;
        detail.hasChapter = true;
        detail.status = date;

        let chapterUrl = `http://www.shukuge.com/book/${id}/index.html`
        let chapterResponse = await this.client?.request({ url: chapterUrl, method: "GET" });
        let $chapterNodes = $(chapterResponse.body);
        let chapterNodes = $chapterNodes.find("div#list dd");

        let chapterList: ItemChapter[] = [];
        chapterNodes.each((index, element) => {
            let chapterNode = $(element);
            let chapterLink = chapterNode.find("a").attr("href") || "";
            let chapterTitle = chapterNode.find("a").text().trim();

            //// /book/143932/45477921.html  -> 45477921
            let chapterId = chapterLink.match(/\/book\/\d+\/(\d+)\.html/)?.[1] || "";

            let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink,chapterTitle);
            chapterList.push(chapter);
        });

        let volume = new ItemVolume("目录", chapterList);
        detail.volumes = [volume];

        return detail;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let response = await this.client?.request({ url: url, method: "GET" });
        let $nodes = $(response.body);

        let title = $nodes.find("div.bookd-title h1").text().trim();
        
        let contentNodes = $nodes.find("div#content").last();
        contentNodes.remove("div.bottem1")
        let contentText = ("<html><p>"+contentNodes.html()+"</p></html>") || "";

        let media = new NovelMedia(id,title,contentText);

        return media;
    }
}

(function () {
   const rule = new Shukuge();
   rule.init();
})();

export default Shukuge;