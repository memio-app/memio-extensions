import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, PictureMedia, MediaType, ChannelType, Channel } from '@/core/extension';

class Everia extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("everia", "EVERIA.CLUB", MediaType.Picture);
        site.baseUrl = "https://everia.club";
        site.thumbnail = "https://bunny-wp-pullzone-cay6hixg3i.b-cdn.net/wp-content/uploads/2025/04/Everiaicon.jpg";
        site.lang = "en";
        site.description = "Everia is a community-driven platform dedicated to sharing high-quality anime and game-themed artwork. Explore a vast collection of images, connect with fellow enthusiasts, and contribute your own creations to the Everia community.";
        site.categoryList = [
            //https://everia.club/category/japan/
            new SiteUrl("LATEST", "/"),
            new SiteUrl("JAPAN", "/category/japan/"),
            new SiteUrl("KOREA", "/category/korea/"),
            new SiteUrl("CHINA", "/category/chinese/"),
            new SiteUrl("COSPLAY", "/category/cosplay/"),
            new SiteUrl("THAILAND", "/category/thailand/"),
        ];

        site.searchList = [
            new SiteUrl("search", "/page/{page}/?s={keyword}"),
        ];

        site.channel = new Channel(ChannelType.List, "Tag", "tag");
        site.useGuide = `## How to set Tag channel
        
1. Generally, tags can be found in the tag list below the detail page. Clicking on a tag will take you to the tag page, where the URL contains the tag information.
2. For example, clicking on the tag "digital-photobook" will lead to the URL: https://everia.club/tag/digital-photobook/, where the tag parameter value is "digital-photobook".
3. In the channel settings, select the "Tag" type and enter the parameter value "digital-photobook". Save it to view all works under that tag.
        `;

        return site;
    }

    private parseItemDetails(nodeList: JQuery<HTMLElement>): ExtensionDetail[] {
        let items: ExtensionDetail[] = [];
        nodeList.each((index, element) => {
            let ele = $(element);
            let thumbnail = ele.find("a.thumbnail-link img").attr("data-lazy-src") || "";
            let title = ele.find("h2.entry-title a").text().trim() || "";
            let link = ele.find("h2.entry-title a").attr("href") || "";
            let id = ele.attr("id") || "";
            // post-12345 -> 12345
            id = id.replace("post-", "");

            let item = new ExtensionDetail(id, link, title);
            item.type = MediaType.Picture;
            item.thumbnail = thumbnail;
            item.hasChapter = false;
            items.push(item);
        });
        return items;
    }

    override async requestChannelList(key: string, page: number): Promise<ExtensionList> {
        // https://everia.club/tag/digital-photobook/page/2/
        let url = `/tag/${encodeURIComponent(key)}/`;
        return this.requestItemList(url, page);
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        // https://everia.club/page/2/
        // https://everia.club/category/japan/page/2/
        let api = this.site.baseUrl + url + `page/${page}/`;
        let htmlResponse = await this.client?.request({ url: api, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let bolgs = $nodes.find("div#blog-entries > article.blog-entry");
        let items = this.parseItemDetails(bolgs);

        let pageNodeUrl = $nodes.find("ul.page-numbers li a.page-numbers").last().attr("href") || "";
        let nextPage = 0;
        if (pageNodeUrl.length > 0) {
            let parts = pageNodeUrl.split("/");
            let pageStr = parts[parts.length - 2];
            nextPage = parseInt(pageStr);
        }
        let hasmore = page < nextPage;
        return new ExtensionList(items, page, hasmore ? url : undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        // https://everia.club/page/2/?s=keyword
        let api = this.site.baseUrl + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let htmlResponse = await this.client?.request({ url: api, method: "GET" });

        let $nodes = $(htmlResponse.body);
        let bolgs = $nodes.find("div#content > article.post");
        let items = this.parseItemDetails(bolgs);

        let pageNodeUrl = $nodes.find("ul.page-numbers li a.page-numbers").last().attr("href") || "";
        let nextPage = 0;
        if (pageNodeUrl.length > 0) {
            let parts = pageNodeUrl.split("/");
            let pageStr = parts[parts.length - 2];
            nextPage = parseInt(pageStr);
        }
        let hasmore = page < nextPage;
        return new ExtensionList(items, page, hasmore ? url : undefined);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let htmlResponse = await this.client?.request({ url: url, method: "GET" });

        let $nodes = $(htmlResponse.body);

        let article = $nodes.find("div#content > article").first();
        let title = article.find("header.entry-header h2.entry-title").text().trim() || "";
        let figureImgs = article.find("div.entry-content figure.wp-block-image img");
        let imageList: string[] = [];
        figureImgs.each((index, element) => {
            let img = $(element);
            let imgUrl = img.attr("data-lazy-src") || "";
            if (imgUrl.length > 0) {
                imageList.push(imgUrl);
            }
        });
        let media = new PictureMedia(id, title, imageList);
        return media;
    }

}

(function () {
    const everia = new Everia();
    everia.init();
})();

export default Everia;