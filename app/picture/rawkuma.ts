import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';

class Rawkuma extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("rawkuma", "Rawkuma", MediaType.Picture);
        site.baseUrl = "https://rawkuma.net";
        site.description = "Read manga online, high quality manga, raw manga, manhua, manhwa updated daily. Join Rawkuma for the best reading experience.";
        site.thumbnail = "https://rawkuma.net/wp-content/uploads/2025/09/ラークマのサイトアイコンHEADER-300x300.png";
        site.lang = "en";
        site.categoryList = [
            new SiteUrl("Manga", "[manga]"),
            new SiteUrl("Manhua", `["manhua"]`),
            new SiteUrl("Manhwa", `["manhwa"]`),
            new SiteUrl("Novel", `["novel"]`),

            new SiteUrl("Action", `["action"]`),
            new SiteUrl("Adaptions", `["adaptions"]`),
            new SiteUrl("Adult", `["adult"]`),
            new SiteUrl("Adventure", `["adventure"]`),
            new SiteUrl("Animals", `["animals"]`),
            new SiteUrl("Comedy", `["comedy"]`),
            new SiteUrl("Crime", `["crime"]`),
            new SiteUrl("Drama", `["drama"]`),
            new SiteUrl("Ecchi", `["ecchi"]`),
            new SiteUrl("Fantasy", `["fantasy"]`),
            new SiteUrl("Game", `["game"]`),
            new SiteUrl("Gender Bender", `["gender-bender"]`),
            new SiteUrl("Girls' Love", `["girls-love"]`),
            new SiteUrl("Harem", `["harem"]`),
            new SiteUrl("Hentai", `["hentai"]`),
            new SiteUrl("Historical", `["historical"]`),
            new SiteUrl("Horror", `["horror"]`),
            new SiteUrl("Isekai", `["isekai"]`),
            new SiteUrl("Josei", `["josei"]`),
            new SiteUrl("Lolicon", `["lolicon"]`),
            new SiteUrl("magic", `["magic"]`),
            new SiteUrl("Martial Arts", `["martial-arts"]`),
            new SiteUrl("Mature", `["mature"]`),
            new SiteUrl("Mecha", `["mecha"]`),
            new SiteUrl("Mystery", `["mystery"]`),
            new SiteUrl("Philosophical", `["philosophical"]`),
            new SiteUrl("Police", `["police"]`),
            new SiteUrl("Psychological", `["psychological"]`),
            new SiteUrl("Romance", `["romance"]`),
            new SiteUrl("School Life", `["school-life"]`),
            new SiteUrl("Sci-Fi", `["sci-fi"]`),
            new SiteUrl("Seinen", `["seinen"]`),
            new SiteUrl("Shoujo", `["shoujo"]`),
            new SiteUrl("Shoujo Ai", `["shoujo-ai"]`),
            new SiteUrl("Shounen", `["shounen"]`),
            new SiteUrl("Shounen Ai", `["shounen-ai"]`),
            new SiteUrl("Slice of Life", `["slice-of-life"]`),
            new SiteUrl("Smut", `["smut"]`),
            new SiteUrl("Sports", `["sports"]`),
            new SiteUrl("Supernatural", `["supernatural"]`),
            new SiteUrl("Thriller", `["thriller"]`),
            new SiteUrl("Tragedy", `["tragedy"]`),
            new SiteUrl("Yaoi", `["yaoi"]`),
            new SiteUrl("Yuri", `["yuri"]`),
        ];

        site.searchList = [
            new SiteUrl("Search By Title", "search"),
        ];

        return site;
    }

    private parseItemDetails(itemNodes: JQuery<HTMLElement>): ExtensionDetail[] {
        let details: ExtensionDetail[] = [];

        itemNodes.each((index, element) => {
            let ele = $(element);
            // find <a color="primary" href="...">
            //let aNode = ele.find("a[color='primary']");
            let aNode = ele.find("a").first();
            let img = aNode.find("img.wp-post-image").attr("src") || "";
            let link = aNode.attr("href") || "";
            // https://rawkuma.net/manga/tensei-shitara-joban-de-shinu-naka-boss-datta-heroine-kenzokuka-de-ikinokoru/
            let id = link.split("/manga/")[1].replace("/", "");

            let title = ele.find("a.text-base").text().trim();
            let lastChapter = ele.find("div.my-2 > span:eq(0)").text().trim();
            let status = ele.find("div.my-2 > span:eq(1)").text().trim();
            let star = ele.find("span.text-yellow-400").text().trim();

            let desc = ele.find("p.line-clamp-3").text().trim();

            let detail = new ExtensionDetail(id, link, title);
            detail.type = MediaType.Picture;
            detail.hasChapter = true;
            detail.description = desc;
            detail.thumbnail = img;
            detail.category = lastChapter;
            detail.author = status;
            detail.status = star;
            details.push(detail);
        });
        return details;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `/wp-admin/admin-ajax.php?action=advanced_search`;

        let formData = `genre=${url}&order=desc&orderby=popular&page=${page}`;
        let headers = [
            { key: "Content-Type", value: "application/x-www-form-urlencoded" },
        ];
        let htmlResponse = await this.client?.request({
            url: api, method: "POST", body: formData, headers: headers,
            contentType: "application/x-www-form-urlencoded"
        });

        let $nodes = $(htmlResponse.body);

        let itemNodes = $nodes.find("div.rounded-lg");

        let details = this.parseItemDetails(itemNodes);
        let hasMore = details.length >= 24;

        let list = new ExtensionList(details, page, hasMore ? api : undefined);
        return list;
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `/wp-admin/admin-ajax.php?action=advanced_search`;

        let formData = `query=${keyword}&order=desc&orderby=popular&page=${page}`;
        let headers = [
            { key: "Content-Type", value: "application/x-www-form-urlencoded" },
        ];
        let htmlResponse = await this.client?.request({
            url: api, method: "POST", body: formData, headers: headers,
            contentType: "application/x-www-form-urlencoded"
        });

        let $nodes = $(htmlResponse.body);

        let itemNodes = $nodes.find("div.rounded-lg");

        let details = this.parseItemDetails(itemNodes);
        let hasMore = details.length >= 24;

        let list = new ExtensionList(details, page, hasMore ? api : undefined);
        return list;


    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {

        let response = await this.client.request({ url: url, method: "GET" });

        let $node = $(response.body);
        let chapterListNode = $node.find("div#chapter-list");

        // <div id=" chapter-list " hx-get=" https://rawkuma.net/wp-admin/admin-ajax.php?manga_id=83552&#038;page= 1&#038;action=chapter_list " hx-target=" this " hx-swap=" outerHTML " hx-trigger=" getChapterList " class=" w-full border-secondary/75 bg-primary/15 text-gray-100 h-64 flex items-center justify-center ">
        let mangaId = chapterListNode.attr("hx-get")?.split("manga_id=")[1].split("&")[0] || "";
        let chapterUrl = `https://rawkuma.net/wp-admin/admin-ajax.php?manga_id=${mangaId}&page=1&action=chapter_list`;

        let chapterResponse = await this.client.request({ url: chapterUrl, method: "GET" });
        let $chapterNodes = $(chapterResponse.body);

        // <div data-chapter-number="19.3" ...
        let chapterNodes = $chapterNodes.find("div[data-chapter-number]");
        let chapters: ItemChapter[] = [];

        chapterNodes.each((index, element) => {
            let ele = $(element);
            let chapterNumber = ele.attr("data-chapter-number") || "";

            let chapterLink = ele.find("a").first().attr("href") || "";
            let chapterId = chapterLink.split("/").filter(part => part.startsWith("chapter-"))[0] || "";
            let chapterTitle = ele.find("span").text().trim();

            let chapter = new ItemChapter(chapterId, chapterLink, chapterTitle);
            chapters.push(chapter);
        });

        let volume = new ItemVolume("Volume", chapters.reverse());
        let detail = new ExtensionDetail(id, url, "");
        detail.hasChapter = true;
        detail.volumes = [volume];
        return detail;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let response = await this.client.request({ url: url, method: "GET" });

        let $nodes = $(response.body);

        let sectionImgs = $nodes.find("section.items-center img");
        let images: string[] = [];

        sectionImgs.each((index, element) => {
            let ele = $(element);
            let imgSrc = ele.attr("src") || "";
            if (imgSrc.length > 0) {
                images.push(imgSrc);
            }
        });

        let media = new PictureMedia(id, "", images);
        return media;
    }

}

(function () {
    // Register extension.
    let rule = new Rawkuma();
    rule.init();
})();

export default Rawkuma;