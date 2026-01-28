import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';

class NHentai extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("nhentai", "nhentai", MediaType.Picture);
        site.baseUrl = "https://nhentai.net";
        site.description = "nhentai is a free hentai manga and doujinshi reader with over 587,000 galleries to read and download.";
        site.thumbnail = "https://nhentai.net/static/apple-touch-icon-120x120.png";
        site.lang = "en";
        site.categoryList = [
            new SiteUrl("New Uploads", "/?page={page}"),
        ];

        site.searchList = [
            new SiteUrl("Search", "/search/?q={keyword}&page={page}"),
        ];

        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `${url.replace("{page}", page.toString())}`;

        let response = await this.client.request({ url: api, method: "GET", });
        let $nodes = $(response.body);

        let gallery = $nodes.find("div.container div.gallery");

        let items: ExtensionDetail[] = [];
        gallery.each((index, element) => {
            let ele = $(element);
            let title = ele.find("div.caption").text().trim();
            let link = ele.find("a.cover").attr("href") || "";
            // /g/622501/ -> 622501
            let id = link.split("/")[2];

            let thumb = ele.find("a.cover img").attr("data-src") || "";
            if (thumb.startsWith("//")) {
                thumb = "https:" + thumb;
            }
            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = thumb;
            detail.hasChapter = false;
            detail.type = MediaType.Picture;
            items.push(detail);
        });

        let lastP = $nodes.find("section.pagination > a").last().attr("href") || "";
        // /?page=23493 -> 23493
        let lastPage = lastP.split("page=")[1] || page.toString();
        let lastPageNum = parseInt(lastPage);
        let nextApi = page < lastPageNum ? url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(items, page, nextApi);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let searchUrl = url.replace("{keyword}", encodeURIComponent(keyword));
        return this.requestItemList(searchUrl, page);
    }

    private searchScriptElement($nodes: JQuery<HTMLElement>): string {
        let jsonString = "";

        $nodes.each((index, element) => {
            if (element instanceof HTMLScriptElement) {
                let scriptContent = element.innerHTML;
                if (scriptContent.indexOf("window._gallery") >= 0) {
                    let regex = /window\._gallery\s*=\s*JSON\.parse\("([\s\S]*?)"\);/;
                    let match = scriptContent.match(regex);
                    if (match && match[1]) {
                        jsonString = match[1];
                    }
                    return false; // Exit the each loop
                }
            }
        });
        return jsonString.replace(/\\u0022/g, '"').replace(/\\\\/g, "\\");
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let api = this.site.baseUrl + "/g/" + id + "/1/";
        let response = await this.client.request({ url: api, method: "GET", });

        // find the script tag content
        let $nodes = $(response.body);
        // window._gallery = JSON.parse("..."); use regex to extract the JSON string
        let scriptContent = this.searchScriptElement($nodes);

        if (scriptContent.length == 0) {
            return new PictureMedia("-1", "", []);
        }

        // Unescape the JSON string
        let galleryData = JSON.parse(scriptContent);

        let title = galleryData.title.english || galleryData.title.japanese || galleryData.title.pretty || "Untitled";
        title = decodeURIComponent(title);
        let mediaId = galleryData.media_id;
        let pageNum = galleryData.num_pages;
        let images = galleryData.images.pages;
        let hostNum = galleryData.id % 4 + 1; // nhentai has 4 image hosts
        let host = `https://i${hostNum}.nhentai.net`;
        let imageUrls: string[] = [];
        images.forEach((img: any, index: number) => {
            let ext = img.t;
            let type = "webp";
            if (ext === "j") ext = "jpg";
            else if (ext === "p") ext = "png";
            else if (ext === "g") ext = "gif";
            else if (ext === "w") ext = "webp";
            else if (ext === "a") ext = "avif";

            let imageUrl = `${host}/galleries/${mediaId}/${index + 1}.${type}`;
            imageUrls.push(imageUrl);
        });
        let media = new PictureMedia(id, title, imageUrls);
        return media;
    }
}


(function () {
    // Register extension.
    let rule = new NHentai();
    rule.init();
})();

export default NHentai;