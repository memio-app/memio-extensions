import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, PictureMedia, MediaType, ChannelType, Channel } from '@/core/extension';

class Gelbooru extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("gelbooru", "Gelbooru", MediaType.Picture);
        site.baseUrl = "https://gelbooru.com";
        site.description = "Browse millions of anime, manga, videos, and video game themed images on Gelbooru. Discover art with detailed tags. Contains explicit hentai content.";
        site.thumbnail = "https://gelbooru.com/favicon.png";
        site.lang = "en";
        site.categoryList = [
            new SiteUrl("ALL", "page=post&s=list&tags=all"),
        ];

        site.searchList = [
            // https://gelbooru.com/index.php?page=post&s=list&tags=+nintendo+pokemon
            new SiteUrl("Tags", "page=post&s=list&tags={keyword}"),
        ];

        site.channel = new Channel(ChannelType.List, "Tags", "tags");


        site.useGuide = `## How to use Tags search
1. Enter keywords separated by spaces to search for images with multiple tags.
2. For example, to search for images tagged with "nintendo" and "pokemon", enter "nintendo pokemon" in the search field.
3. You can find tags in [gelbooru tags](https://gelbooru.com/index.php?page=tags&s=list).

## How to set up Tags channel
1. Go to the Gelbooru Tags List page: https://gelbooru.com/index.php?page=tags&s=list
2. Select the tag you want to browse, for example: https://gelbooru.com/index.php?page=post&s=list&tags=nintendo
3. Copy the tag parameter value "nintendo" from the URL.
4. In the channel settings, select "Tags" and enter the parameter value "nintendo". Save to view all works with that tag.
        `;

        return site;

    }

    private parseItemDetails(nodeList: JQuery<HTMLElement>): ExtensionDetail[] {
        let itemList: ExtensionDetail[] = [];
        nodeList.each((index, element) => {
            let ele = $(element);
            let link = ele.find("a").attr("href") || "";
            let id = ele.find("a").attr("id") || "";
            // p13306614 -> 13306614
            id = id.replace("p", "");

            let title = ele.find("a img").attr("title") || "";
            if(title.length > 100) {
                title = title.substring(0, 100) + "...";
            }
            let thumb = ele.find("a img").attr("src") || "";
            let detail = new ExtensionDetail(id, link,title);
            detail.type = MediaType.Picture;
            detail.thumbnail = thumb;
            detail.hasChapter = false;
            itemList.push(detail);
        });
        return itemList;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        // https://gelbooru.com/index.php?page=post&s=list&tags=all&pid=42
        let pid = (page - 1) * 42;
        let api = this.site.baseUrl + "/index.php?" + url + `&pid=${pid}`;

        let htmlResponse = await this.client?.request({ url: api, method: "GET"});
        let $nodes = $(htmlResponse.body);
        let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
        let itemList = this.parseItemDetails(imageNodes);
        
        let paginator = $nodes.find("div#paginator");
        let lastA = paginator.find("a").last();
        // ?page=post&s=list&tags=all&pid=11629800 -> 11629800
        let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
        let hasmore = maxPid > (pid + 42);
        let nextPage = hasmore ? this.site.baseUrl + "/index.php?" + url + `&pid=${pid + 42}` : undefined;
        return new ExtensionList(itemList, page, nextPage);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        // https://gelbooru.com/index.php?page=post&s=list&tags=nintendo+pokemon&pid=42
        let pid = (page - 1) * 42;
        let searchUrl = this.site.baseUrl + "/index.php?" + url.replace("{keyword}", encodeURIComponent(keyword)) + `&pid=${pid}`;

        let htmlResponse = await this.client?.request({ url: searchUrl, method: "GET"});
        let $nodes = $(htmlResponse.body);
        let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
        let itemList = this.parseItemDetails(imageNodes);
        
        let paginator = $nodes.find("div#paginator");
        let lastA = paginator.find("a").last();
        // ?page=post&s=list&tags=nintendo+pokemon&pid=11629800 -> 11629800
        let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
        let hasmore = maxPid > (pid + 42);
        let nextPage = hasmore ? this.site.baseUrl + "/index.php?" + url.replace("{keyword}", encodeURIComponent(keyword)) + `&pid=${pid + 42}` : undefined;
        return new ExtensionList(itemList, page, nextPage);
    }

    override async requestChannelList(key: string, page: number): Promise<ExtensionList> {
        // https://gelbooru.com/index.php?page=post&s=list&tags=nintendo&pid=42
        let pid = (page - 1) * 42;
        let api = this.site.baseUrl + "/index.php?page=post&s=list&tags=" + encodeURIComponent(key) + `&pid=${pid}`;

        let htmlResponse = await this.client?.request({ url: api, method: "GET"});
        let $nodes = $(htmlResponse.body);
        let imageNodes = $nodes.find("div.thumbnail-container article.thumbnail-preview");
        let itemList = this.parseItemDetails(imageNodes);
        
        let paginator = $nodes.find("div#paginator");
        let lastA = paginator.find("a").last();
        // ?page=post&s=list&tags=all&pid=11629800 -> 11629800
        let maxPid = parseInt((lastA.attr("href") || "").split("pid=").pop() || "0");
        let hasmore = maxPid > (pid + 42);
        let nextPage = hasmore ? this.site.baseUrl + "/index.php?page=post&s=list&tags=" + encodeURIComponent(key) + `&pid=${pid + 42}` : undefined;
        return new ExtensionList(itemList, page, nextPage);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // https://gelbooru.com/index.php?page=post&s=view&id=13306575
        let htmlResponse = await this.client?.request({ url: url, method: "GET"});
        let $nodes = $(htmlResponse.body);

        let picture = $nodes.find("section.image-container picture img").attr("src") || "";
        let imaUrl = picture.replace("/samples", "images").replace("sample_","");
        let media = new PictureMedia(id,id,[imaUrl]);
        return media;
    }
}

(function () {
    const gelbooru = new Gelbooru();
    gelbooru.init();
})();

export default Gelbooru;