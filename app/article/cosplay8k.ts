import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ChannelType, Channel, ArticleMedia } from '@/core/extension';

class Cosplay8K extends Rule {
    provideExtensionInfo(): Extension {
        let site = new Extension("8kcosplay", "8k Cosplay Zone", MediaType.Article);
        site.baseUrl = "https://www.8kcosplay.com";
        site.description = "8kcosplay UltraHD Cosplay Image and video";
        site.lang = "en";
        site.thumbnail = "https://www.8kcosplay.com/wp-content/uploads/2020/11/8kcosplayicon.jpg";

        //https://www.8kcosplay.com/category/8kcosplay/page/3/
        site.categoryList = [
            new SiteUrl("8K Cosplay", "8kcosplay"),
            new SiteUrl("8K Chinese Idols", "8kchineseidol"),
            new SiteUrl("8K Asian Idols", "8kasianidol"),
            new SiteUrl("AI Deepfake", "ai-deepfake"),
            new SiteUrl("4K for Mobile", "4k-mobile-wallpaper-hd"),
            new SiteUrl("Megapack Archives", "megapack-archives"),
        ];

        site.searchList = [
            new SiteUrl("Search", "/page/{page}/?s={keyword}"),
        ];

        site.channel = new Channel(ChannelType.List, "TAG", "tag");

        return site;
    }

    private parseItemDetails(nodeList: JQuery<HTMLElement>): ExtensionDetail[] {
        let details: ExtensionDetail[] = [];

        nodeList.each((index, element) => {
            let node = $(element);
            let thumbnail = node.find("div.item-img a.item-thumb img").attr("data-original") || "";
            let author = node.find("div.item-img a.item-category").text().trim() || "";
            let title = node.find("h3.item-title a").text().trim() || "";
            let link = node.find("h3.item-title a").attr("href") || "";
            // https://www.8kcosplay.com/%e7%be%bd%e7%94%9f%e4%b8%/
            let id = link.split("/").filter(part => part.length > 0).pop() || "";
            let date = node.find("div.item-meta span.item-meta-left").text().trim() || "";

            let item = new ExtensionDetail(id, link, title);
            item.author = author;
            item.type = MediaType.Article;
            item.hasChapter = false;
            item.thumbnail = thumbnail;
            item.category = date;
            details.push(item);
        });

        return details;

    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/category/" + url + "/page/" + page + "/";
        //sec-panel-body
        let htmlResponse = await this.client?.request({ url: api, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let itemNodes = $nodes.find("div.sec-panel-body ul.post-loop-image > li.item");
        let details = this.parseItemDetails(itemNodes);

        let totalNode = $nodes.find("div.sec-panel-body ul.pagination li.disabled span");
        // 3 / 422  -> 422
        let totalText = totalNode.text().trim().split("/").pop() || "1";
        let total = parseInt(totalText.trim());

        let nextPageUrl = page < total ? url : undefined;
        return new ExtensionList(details, page, nextPageUrl);

    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/page/" + page + "/?s=" + encodeURIComponent(keyword);
        let htmlResponse = await this.client?.request({ url: api, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let itemNodes = $nodes.find("div.sec-panel-body ul.post-loop-image > li.item");
        let details = this.parseItemDetails(itemNodes);

        let totalNode = $nodes.find("div.sec-panel-body ul.pagination li.disabled span");
        // 3 / 422  -> 422
        let totalText = totalNode.text().trim().split("/").pop() || "1";
        let total = parseInt(totalText.trim());

        let nextPageUrl = page < total ? url : undefined;
        return new ExtensionList(details, page, nextPageUrl);
    }

    override async requestChannelList(key: string, page: number): Promise<ExtensionList> {
        // https://www.8kcosplay.com/tag/%e6%a1%9c%e6%a1%83%e5%96%b5/page/2/
        let api = this.site.baseUrl + "/tag/" + encodeURIComponent(key) + "/page/" + page + "/";
        let htmlResponse = await this.client?.request({ url: api, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let itemNodes = $nodes.find("div.sec-panel-body ul.post-loop-image > li.item");
        let details = this.parseItemDetails(itemNodes);

        let totalNode = $nodes.find("div.sec-panel-body ul.pagination li.disabled span");
        // 3 / 422  -> 422
        let totalText = totalNode.text().trim().split("/").pop() || "1";
        let total = parseInt(totalText.trim());

        let nextPageUrl = page < total ? key : undefined;
        return new ExtensionList(details, page, nextPageUrl);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let htmlResponse = await this.client?.request({ url: url, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let article = $nodes.find("main.main article.post");
        let title = article.find("h1.entry-title").text().trim() || "";
        let date = article.find("div.entry-info time.entry-date").text().trim() || "";
        let author = article.find("div.entry-info a").text().trim() || "";

        let content = article.find("div.entry-content");
        let aNodes = content.find("a");
        console.log("a count:", aNodes.length);
        // find img in noscript and replace noscript's parent node.
        aNodes.each((index, element) => {
            let nodeA = $(element);
            let noscript = nodeA.find("noscript");
            if (noscript.length > 0) {
                let imgNode = nodeA.find("img");
                if (imgNode.length === 0) {
                    return;
                }
                let url = imgNode.attr("data-original");
                if (url) {
                    imgNode.attr("src", url);
                }
                imgNode.insertBefore(nodeA);
                nodeA.remove();
            }
        });

        let media = new ArticleMedia(id, title, `<html>` + content.html() + `</html>`);
        media.date = date;
        media.author = author;

        return media;
    }

}

(function () {
    const cosplay = new Cosplay8K();
    cosplay.init();
})();

export default Cosplay8K