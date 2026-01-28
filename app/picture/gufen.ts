import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType } from '@/core/extension';


class Gufen extends Rule {

    siteHost = "https://www.gfmh.app";

    provideExtensionInfo(): Extension {
        let site = new Extension("gufen", "古风漫画网", MediaType.Picture);
        site.baseUrl = "https://www.gfmh.app";
        site.description = "古风漫画网精心整理收集，最近更新漫画推荐、最近更新漫画大全."
        site.thumbnail = "";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("全部漫画", site.baseUrl + "/category/page/{page}/"),
            new SiteUrl("日本漫画", site.baseUrl + "/category/list/2/page/{page}/"),
            new SiteUrl("国产漫画", site.baseUrl + "/category/list/1/page/{page}/"),
            new SiteUrl("韩国漫画", site.baseUrl + "/category/list/3/page/{page}/"),
            new SiteUrl("欧美漫画", site.baseUrl + "/category/list/4/page/{page}/"),
        ];
        site.searchList = [
            new SiteUrl("默认", site.baseUrl + "/search/{keyword}/{page}"),
        ];
        return site;
    }

    async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = url.replace("{page}", page.toString());
        var nextUrl = url.replace("{page}", (page + 1).toString());
        var htmlResponse = await this.client?.request(
            { url: realUrl, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);
        var listNode = $nodes.find("div.store_left ul.flex li");
        if (!listNode || listNode.length == 0) {
            return new ExtensionList([], page ? page : 1, undefined);
        }
        var items: ExtensionDetail[] = [];
        listNode.each((_index, element) => {
            let ele = $(element);
            let link = ele.find("a").attr("href");
            if (link) {
                let cover = ele.find("a > img").attr("data-original");
                let title = ele.find("div.w100 h2").text();
                let description = ele.find("div.w100 p.indent").text();
                let update = ele.find("div.w100 em.blue").text();
                let author = ele.find("div.w100 div.li_bottom i.fa").text().trim();
                let pattern = new RegExp('/(.*?).html', 'i');
                let id = pattern.exec(link!)?.[1];
                let item = new ExtensionDetail(id!, this.site.baseUrl + link, title);
                item.thumbnail = cover;
                item.description = description;
                item.category = update;
                item.author = author;
                item.hasChapter = true;
                item.type = MediaType.Picture;
                items.push(item);
            }
        });
        let disableNext = items.length < 16;
        return new ExtensionList(items, page, disableNext ? undefined : nextUrl);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
        var htmlResponse = await this.client?.request({ url: realUrl, method: "GET" });
        var html = htmlResponse.body;

        let $nodes = $(html);
        var listNode = $nodes.find("div.side_commend ul.flex li.searchresult");
        if (!listNode || listNode.length == 0) {
            return new ExtensionList([], page ? page : 1, undefined);
        }
        var items: ExtensionDetail[] = [];
        listNode.each((_index, element) => {
            let ele = $(element);
            let link = ele.find("div.img_span a").attr("href");
            if (link) {
                let cover = ele.find("div.img_span a img").attr("data-original");
                let title = ele.find("div a > h3").text();
                let description = ele.find("p.searchresult_p").text();
                let update = ele.find("p > a").last().text();
                let author = ele.find("p").first().contents().filter((i, el) => el.nodeType === Node.TEXT_NODE).text().trim();
                let status = ele.find("div.img_span > a").text();
                let pattern = new RegExp('/(.*?).html', 'i');
                let id = pattern.exec(link!)?.[1];
                let item = new ExtensionDetail(id!, this.site.baseUrl + link!, title);
                item.thumbnail = cover;
                item.description = description;
                item.category = update;
                item.author = author;
                item.status = status;
                item.hasChapter = true;
                item.type = MediaType.Picture;
                items.push(item);
            }
        });
        let disableNext = items.length < 10;
        return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
    }

    override async requestItemChapter(url: string, id?: string): Promise<ExtensionDetail> {
        var htmlResponse = await this.client?.request({ url: url, method: "GET" });
        var html = htmlResponse.body;
        let comicUrl = new URL(url);
        let comicDomain = comicUrl.protocol + "//" + comicUrl.host;
        let $nodes = $(html);
        let detailNode = $nodes.find("div.novel_info_main");
        let cover = $nodes.find("div.novel_info_main img").attr("src");
        let description = $nodes.find("div#info div.intro>p").text().trim();
        let title = detailNode.find("div.novel_info_title h1").text();
        let author = detailNode.find("div.novel_info_title i").first().text();
        let update = detailNode.find("div.novel_info_title div").first().contents().filter((i, el) => el.nodeType === Node.TEXT_NODE).text().trim();

        let category = detailNode.find("div.novel_info_title p span");
        let categoryText = "";
        if (category && category.length > 0) {
            category.each((_index, element) => {
                let text = element.textContent;
                categoryText += text?.trim() + " ";
            });
        }

        let item = new ExtensionDetail(id!, url, title);
        item.thumbnail = cover;
        item.description = description;
        item.author = author;
        item.status = update;
        item.category = categoryText.trim();
        item.hasChapter = true;
        item.type = MediaType.Picture;

        let chapterNode = $nodes.find("div#catalog");
        let volumes = chapterNode.find("div.chapter_list");
        item.volumes = [];
        volumes.each((_index, element) => {
            let volume = $(element);
            let volumeName = "章节列表";
            let chapters = volume.find("ul#ul_all_chapters > li");
            let chapterList: ItemChapter[] = [];
            chapters.each((_index, element) => {
                let chapter = $(element);
                let link = chapter.find("a").attr("href");
                if (link == undefined) return;
                let title = chapter.find("a").text();
                let pattern = new RegExp('/(.*?)/(.*?).html', 'i');
                let id = pattern.exec(link)?.[2];
                let item = new ItemChapter(id!, comicDomain + link, title);
                chapterList.push(item);
            });
            item.volumes?.push({ name: volumeName, chapters: chapterList });
        });
        return item;
    }

    async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        var htmlResponse = await this.client?.request(
            { url: url, method: "GET", afterLoad: true }
        );
        var html = htmlResponse.body;
        let $nodes = $(html);

        let title = $nodes.find("div.reader-main h1").text();

        let imgList = $nodes.find("div#contents img");
        if (!imgList || imgList.length == 0) {
            return new PictureMedia(id, "pageTitle", []);
        }

        let images: string[] = [];
        imgList.each((_index, element) => {
            let img = $(element);
            if (!img) return;
            let pageImage = img.attr("data-src");
            if (!pageImage) return;
            images.push(pageImage);
        });

        let media = new PictureMedia(id, title, images);
        return media;
    }
}

(function () {
    const gufen = new Gufen();
    gufen.init();
})();

export default Gufen;
