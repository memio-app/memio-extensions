import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ArticleMedia } from '@/core/extension';

class Koyso extends Rule {

    siteLanguage: string = "schinese";

    provideExtensionInfo(): Extension {
        let site = new Extension("koyso", "Koyso", MediaType.Article);
        site.baseUrl = "https://koyso.to";
        site.description = "Free pre-installed PC games for direct download. Simply download & play.";
        site.thumbnail = "https://koyso.to/static/picture/logo_u.ico";
        site.lang = "en";
        site.categoryList = [
            new SiteUrl("All", "/"),
            new SiteUrl("Action", "/category/action"),
            new SiteUrl("Adventure", "/category/adventure"),
            new SiteUrl("R18+", "/category/r18"),
            new SiteUrl("Shooting", "/category/shooting"),
            new SiteUrl("Casual", "/category/casual"),
            new SiteUrl("Sports / Racing", "/category/sports_racing"),
            new SiteUrl("Simulation", "/category/simulation"),
            new SiteUrl("RPG", "/category/rpg"),
            new SiteUrl("Strategy", "/category/strategy"),
            new SiteUrl("Fighting", "/category/fighting"),
            new SiteUrl("Horror", "/category/horror"),
            new SiteUrl("RTS", "/category/rts"),
            new SiteUrl("Card", "/category/card"),
            new SiteUrl("Indie", "/category/indie"),
            new SiteUrl("Lan", "/category/lan"),
        ];
        site.searchList = [
            // https://koyso.to/?keywords=%E4%B8%9C%E6%96%B9&sort=latest
            new SiteUrl("Search", "keywords={keyword}"),
        ];
        site.configParams = [
            { key: "language", value: "Language(english/schinese)" },
        ];

        return site;
    }

    override async config(form: Map<string, string>): Promise<boolean> {
        let language = form.get("language") || "english";
        if (language === "schinese" || language === "english") {
            this.siteLanguage = language;
        } else {
            this.siteLanguage = "english";
        }

        return true;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        //https://koyso.to/category/action?page=2&sort=latest
        let api = `${this.site.baseUrl}${url}?sort=latest&page=${page}`;
        let htmlResponse = await this.client.request(
            {
                url: api, method: "GET",
                headers: [
                    { key: "Cookie", value: `language=${this.siteLanguage};` }
                ],
            }
        );

        let $nodes = $(htmlResponse.body);
        let details: ExtensionDetail[] = [];

        let articleNodes = $nodes.find("div.games_content a.game_item");
        articleNodes.each((index, element) => {
            let ele = $(element);
            let thumbnail = ele.find("div.game_media img").attr("data-src") || "";
            // add https if missing
            if (thumbnail && thumbnail.startsWith("//")) {
                thumbnail = "https:" + thumbnail;
            }

            let link = ele.attr("href") || "";
            // /game/1234-> 1234
            let id = link.split("/").pop() || link;

            let title = ele.find("div.game_info span").text().trim();

            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = thumbnail;
            detail.type = MediaType.Article;

            details.push(detail);
        });

        let pager = $nodes.find("div.pagination a").first().text().trim();
        // 46/70 -> 70
        let totalPage = parseInt(pager.split("/").pop() || "1");
        let hasMore = page < totalPage;
        let nextApi = `${this.site.baseUrl}${url}?sort=latest&page=${page + 1}`;
        return new ExtensionList(details, page, hasMore ? nextApi : undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        //https://koyso.to/?keywords=keyword&sort=latest
        let api = `${this.site.baseUrl}/?keywords=${encodeURIComponent(keyword)}&sort=latest`;
        let htmlResponse = await this.client.request(
            {
                url: api, method: "GET",
                headers: [
                    { key: "Cookie", value: `language=${this.siteLanguage};` }
                ],
            }
        );

        let $nodes = $(htmlResponse.body);
        let details: ExtensionDetail[] = [];

        let articleNodes = $nodes.find("div.games_content a.game_item");
        articleNodes.each((index, element) => {
            let ele = $(element);
            let thumbnail = ele.find("div.game_media img").attr("data-src") || "";
            // add https if missing
            if (thumbnail && thumbnail.startsWith("//")) {
                thumbnail = "https:" + thumbnail;
            }

            let link = ele.attr("href") || "";
            // /game/1234-> 1234
            let id = link.split("/").pop() || link;

            let title = ele.find("div.game_info span").text().trim();

            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = thumbnail;
            detail.type = MediaType.Article;
            details.push(detail);
        });

        let list = new ExtensionList(details, page, undefined);
        return list;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
    
        let htmlResponse = await this.client.request(
            {
                url: url, method: "GET",
                headers: [
                    { key: "Cookie", value: `language=${this.siteLanguage};` }
                ],
            }
        );
        let $nodes = $(htmlResponse.body);

        let postDiv = $nodes.find("div.game_content");
        let title = postDiv.find("h1.content_title").text().trim();
        let content = postDiv.find("div.content_body");
        let cover = postDiv.find("div.capsule_div img").attr("src") || "";

        //https://koyso.to/download/599
        let frame = `<iframe src="https://koyso.to/download/${id}" title="Download" poster="${cover}"></iframe>`;

        let media = new ArticleMedia(id, title, `<html>${content.html()}</br>${frame}</html>`);
        return media;

    }
}

(function () {
    const koyso = new Koyso();
    koyso.init();
})();

export default Koyso;