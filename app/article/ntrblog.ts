import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ArticleMedia } from '@/core/extension';

class NtrBlog extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("ntrblog", "NTR BLOG(寝取られブログ)", MediaType.Article);
        site.baseUrl = "https://ntrblog.com";
        site.lang = "ja";
        site.description = "寝取られブログ。速報性の無い情報サイト。リンクフリー。";
        site.thumbnail = "https://livedoor.blogimg.jp/ntrblog2/imgs/d/b/dbea7150.jpg";
        site.categoryList = [
            new SiteUrl("寝取られブログ", "/?p={page}"),
        ];
        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        //https://ntrblog.com/?p=2
        let pageUrl = this.site.baseUrl + url.replace("{page}", page.toString());
        let nextPageUrl = this.site.baseUrl + url.replace("{page}", (page + 1).toString());

        const htmlResponse = await this.client.request({
            url: pageUrl,
            method: "GET",
        });

        const html = htmlResponse.body;
        let $nodes = $(html);
        let articleNodes = $nodes.find("article.article");

        let items: ExtensionDetail[] = [];
        articleNodes.each((index, element) => {
            let ele = $(element);
            let title = ele.find("header.article-header h1.article-title a").text().trim();
            let dateTxt = ele.find("header.article-header p.article-date time").text().trim();
            let link = ele.find("header.article-header h1.article-title a").attr("href") || "";
            let thumbnail = ele.find("div.article-body img.pict").attr("src") || "";
            // https://ntrblog.com/archives/1083914128.html -> 1083914128
            let id = link.match(/ntrblog\.com\/archives\/(\d+)\.html/)?.[1] || "";

            let description = ele.find("div.article-body div.blockquote").text().trim();

            let item = new ExtensionDetail(id, link, title);
            item.description = description;
            item.type = MediaType.Article;
            item.thumbnail = thumbnail;
            item.category = dateTxt;

            items.push(item);
        });

        let lastPage = $nodes.find("div.pager ul.index-navigator li").last().attr("href") || "";
        // https://ntrblog.com/?p=332 => 332
        let lastPageNum = parseInt(lastPage.match(/ntrblog\.com\/\?p=(\d+)/)?.[1] || "0");
        let hasMore = page < lastPageNum;

        return new ExtensionList(items, page, hasMore ? nextPageUrl : undefined);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        const htmlResponse = await this.client.request({
            url: url,
            method: "GET",
        });

        const html = htmlResponse.body;
        let $nodes = $(html);

        let title = $nodes.find("article.article header.article-header h1.article-title").text().trim();
        let contentNode = $nodes.find("div.article-body");

        // remove ad
        contentNode.find("div#ad, div#ad2").remove();
        contentNode.find("a").each((index, element) => {
            let ele = $(element);
            let img = ele.find("img");
            if (img.length === 1) {
                img.insertAfter(ele);
                ele.remove();
                return;
            }
        });

        let contentHtml = contentNode.html() || "";
        let articleMedia = new ArticleMedia(id, title, `<html>${contentHtml}</html>`);
        return articleMedia;
    }

}



(function () {
    const ntrBlog = new NtrBlog();
    ntrBlog.init();
})();

export default NtrBlog;
