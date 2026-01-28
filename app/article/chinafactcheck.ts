import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ArticleMedia } from '@/core/extension';

class ChinaFactCheck extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("chinafactcheck", "国际新闻事实核查", MediaType.Article);
        site.baseUrl = "https://www.chinafactcheck.com";
        site.description = "事实核查（China Fact Check）是由中国社会科学院新闻与传播研究所主办的专业性事实核查平台，致力于揭示和纠正网络谣言、虚假信息和误导性报道，促进信息透明和公共信任。";
        site.thumbnail = "https://chinafactcheck.com/wp-content/uploads/2025/04/WechatIMG153的副本.jpeg";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("核查报告", "cat=11"),
        ];
        return site;
    }

    private parseArticleNodes(articleNodes: JQuery<HTMLElement>) {
        let items: ExtensionDetail[] = [];
        articleNodes.each((index, element) => {
            let ele = $(element);
            let thumbnail = ele.find("div.post-thumb img").attr("src") || "";

            let title = ele.find("div.post-info a h2").text().trim();
            let link = ele.find("div.post-info a").attr("href") || "";
            //https://chinafactcheck.com/?p=15345 => 15345
            let id = link.match(/chinafactcheck\.com\/\?p=(\d+)/)?.[1] || "";
            let desc = ele.find("p.post-digest").text().trim();

            let item = new ExtensionDetail(id, link, title);
            item.thumbnail = thumbnail;
            item.description = desc;
            item.type = MediaType.Article;
            items.push(item);
        });
        return items;
    }


    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        //https://chinafactcheck.com/?cat=11&paged=4
        let pageUrl = this.site.baseUrl + "/?" + url + "&paged=" + page;
        let nextPageUrl = this.site.baseUrl + "/?" + url + "&paged=" + (page + 1);

        const htmlResponse = await this.client.request({
            url: pageUrl,
            method: "GET",
        });

        const html = htmlResponse.body;
        let $nodes = $(html);
        let articleNodes = $nodes.find("div.post-item");

        let items = this.parseArticleNodes(articleNodes);

        let moreNode = $nodes.find("div#pagination a");
        let href = moreNode.attr("href") || "";
        let hasMore = href.indexOf("paged=" + (page + 1)) != -1;

        let extensionList = new ExtensionList(items, page, hasMore ? nextPageUrl : undefined);
        return extensionList;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        const htmlResponse = await this.client.request({
            url: url,
            method: "GET",
        });

        const html = htmlResponse.body;
        let $nodes = $(html);
        let contentNode = $nodes.find("div.content-list-box");

        let author = $nodes.find("div.content-persons p").text().trim();
        let date = $nodes.find("div.content-head p").text().trim();
        let title = $nodes.find("div.content-head h2").text().trim();

        let media = new ArticleMedia(id, title, `<html>${contentNode.html()}</html>`);
        media.author = author;
        media.date = date;
        return media;
    }

}

(function () {
    const chinaFactCheck = new ChinaFactCheck();
    chinaFactCheck.init();
})();

export default ChinaFactCheck;