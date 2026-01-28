import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia } from '@/core/extension';

class Xbookcn extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension('xbookcn', '中文成人文學網', MediaType.Novel);
        site.baseUrl = "https://www.xbookcn.net";
        site.description = "中文成人文學網，提供大量免費成人小說閱讀。";
        site.thumbnail = "https://www.xbookcn.net/favicon.ico";
        site.lang = "zh-TW";
        site.categoryList = [
            new SiteUrl('短篇情色小说', 'https://blog.xbookcn.net/'),
            new SiteUrl('热门小说', "https://book.xbookcn.net/p/columnist.html"),
            new SiteUrl('通俗小说', "https://book.xbookcn.net/p/popular.html"),
            new SiteUrl('都市小说', "https://book.xbookcn.net/p/urban.html"),
            new SiteUrl('武侠小说', "https://book.xbookcn.net/p/martial.html"),
            new SiteUrl('奇幻小说', "https://book.xbookcn.net/p/fantasy.html"),
            new SiteUrl('冒险小说', "https://book.xbookcn.net/p/adventure.html"),
            new SiteUrl('穿越小说', "https://book.xbookcn.net/p/history.html"),
            new SiteUrl('黑暗小说', "https://book.xbookcn.net/p/dark.html"),
            new SiteUrl('言情小说', "https://book.xbookcn.net/p/romance.html"),
        ];

        return site;
    }

    pageKeyMap: Map<number, string> = new Map<number, string>();

    private async requestShortStoryList(url: string, page: number): Promise<ExtensionList> {
        let start = (page - 1) * 100;
        //updated-max=2022-01-02T06:00:00%2B08:00
        let shortApi = `https://blog.xbookcn.net/search?max-results=100&start=${start}&by-date=false`
        let pageKey = this.pageKeyMap.get(page);
        if (pageKey) {
            shortApi += `&updated-max=${pageKey}`;
        }
        let shortResponse = await this.client.request({ url: shortApi, method: "GET", });
        let $nodes = $(shortResponse.body);

        let postNodes = $nodes.find('div.post-outer div.post');

        let items: ExtensionDetail[] = [];

        postNodes.each((index, element) => {
            let ele = $(element);
            let title = ele.find('h3.post-title a').text().trim();
            if (title.indexOf("站内搜索") !== -1 || title.indexOf("目录索引") !== -1) {
                return;
            }

            let link = ele.find('h3.post-title a').attr('href') || "";
            // https://blog.xbookcn.net/2022/02/blog-post_19.html  ->  2022/02/blog-post_19
            let id = link.replace('https://blog.xbookcn.net/', '').replace('.html', '');

            let detail = new ExtensionDetail(id, link, title);
            detail.hasChapter = false;
            detail.type = MediaType.Novel;
            items.push(detail);
        });

        let nextPageNode = $nodes.find('a#Blog1_blog-pager-older-link');
        let href = nextPageNode.attr('href') || "";
        //match https://blog.xbookcn.net/search?updated-max=2022-01-02T06:00:00%2B08:00&max-results=100 -> 2022-01-02T06:00:00%2B08:00
        let nextPageKey = href.match(/updated-max=([^&]+)/);
        if (nextPageKey && nextPageKey.length > 1) {
            this.pageKeyMap.set(page + 1, nextPageKey[1]);
        }
        return new ExtensionList(items, page, nextPageKey != null ? href : "");
    }

    private async requestNovelList(url: string, page: number): Promise<ExtensionList> {
        let shortResponse = await this.client.request({ url: url, method: "GET", });
        let $nodes = $(shortResponse.body);

        let pNodes = $nodes.find('div.post-outer div.post div.post-body p');

        let items: ExtensionDetail[] = [];

        pNodes.each((index, element) => {
            let ele = $(element);
            let strong = ele.find('strong');
            if (strong.length > 0) {
                let aNode = ele.find('a');
                let title = aNode.text().trim();
                let link = aNode.attr('href') || "";
                // https://book.xbookcn.net/search/label/%E8%9C%9C%E6%A1%83%E8%87%80 -> 蜜桃臀
                let id = link.replace('https://book.xbookcn.net/search/label/', '').trim();
                let detail = new ExtensionDetail(id, link, title);
                detail.hasChapter = true;
                detail.type = MediaType.Novel;
                items.push(detail);
            } else {
                let lastItem = items.length > 0 ? items[items.length - 1] : null;
                if (lastItem) {
                    let text = ele.text().trim();
                    if (text.length > 0) {
                        lastItem.description = text;
                    }
                }
            }
        });
        return new ExtensionList(items, page, undefined);
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        if (url.indexOf('blog.xbookcn.net') !== -1) {
            return this.requestShortStoryList(url, page);
        } else {
            return this.requestNovelList(url, page);
        }
    }

    private async requestChapter(nodes: JQuery<HTMLElement>): Promise<ItemChapter[]> {
        let chapters: ItemChapter[] = [];

        nodes.each((index, element) => {
            let ele = $(element);
            let chapterNode = ele.find('h3.post-title a');
            let url = chapterNode.attr('href') || "";
            let title = chapterNode.text().trim();
            // https://book.xbookcn.net/2007/02/1.html -> 2007/02/1
            let id = url.replace('https://book.xbookcn.net/', '').replace('.html', '');
            let chapter = new ItemChapter(id, url, title);
            chapters.push(chapter);
        });

        return chapters;
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        // https://book.xbookcn.net/search/label/%E8%9C%9C%E6%A1%83%E8%87%80?max-results=100&start=0&by-date=false
        let pageKey: undefined | string = undefined;
        let page = 1;
        let start = (page - 1) * 100;
        let chapterUri = `https://book.xbookcn.net/search/label/${id}?max-results=100&start=${start}&by-date=false`;
        if (pageKey) {
            chapterUri += `&updated-max=${pageKey}`;
        }

        let detail = new ExtensionDetail(id, url, "");
        let chapters: ItemChapter[] = [];

        while (true) {
            let response = await this.client.request({ url: chapterUri, method: "GET", });
            let $nodes = $(response.body);
            let blogPosts = $nodes.find('div.blog-posts');
            if (page == 1) {
                let title = blogPosts.find("div.status-msg-wrap div.status-msg-body").text().trim();
                let firstPostNodes = blogPosts.find('div.date-outer div.date-posts div.post-outer div.post').first();
                let ps = firstPostNodes.find('div.post-body p');
                let description = ps[1].textContent;
                let author = ps[0].textContent?.replace('作者：', '').trim() || "";
                detail = new ExtensionDetail(id, url, title);
                detail.type = MediaType.Novel;
                detail.author = author;
                detail.description = description || "";
                firstPostNodes.remove();
            }
            let nodes = blogPosts.find('div.date-outer div.date-posts div.post-outer div.post');
            let pageChapters = await this.requestChapter(nodes);
            chapters = chapters.concat(pageChapters);

            let nextPageNode = $nodes.find('a#Blog1_blog-pager-older-link');
            let href = nextPageNode.attr('href') || "";
            //match https://book.xbookcn.net/search?updated-max=2022-01-02T06:00:00%2B08:00&max-results=100 -> 2022-01-02T06:00:00%2B08:00
            let nextPageKey = href.match(/updated-max=([^&]+)/);
            if (nextPageKey && nextPageKey.length > 1) {
                pageKey = nextPageKey[1];
                page += 1;
                start = (page - 1) * 100;
                chapterUri = `https://book.xbookcn.net/search/label/${id}?max-results=100&start=${start}&by-date=false&updated-max=${pageKey}`;
            } else {
                break;
            }
        }
        let volume = new ItemVolume("章节列表", chapters);
        detail.volumes = [volume];
        return detail;
    }

    private async requestShortStoryDetail(url: string, id: string): Promise<ExtensionMedia> {
        let response = await this.client.request({ url: url, method: "GET", });
        let $nodes = $(response.body);

        let contentNode = $nodes.find('div.blog-posts div.date-outer').first();
        let title = contentNode.find('h3.post-title').text().trim();
        let contentHtml = contentNode.find('div.post-body').html() || "";

        let media = new NovelMedia(id, title, `<html><body>${contentHtml}</body></html>`);
        return media;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {

        if (url.indexOf('blog.xbookcn.net') !== -1) {
            return this.requestShortStoryDetail(url, id);
        } else {
            //novel detail
            let response = await this.client.request({ url: url, method: "GET", });
            let $nodes = $(response.body);

            let contentNode = $nodes.find('div.post-outer').first();
            let title = contentNode.find('h3.post-title').text().trim();
            let contentHtml = contentNode.find('div.post-body').html() || "";

            let media = new NovelMedia(id, title, `<html><body>${contentHtml}</body></html>`);
            return media;
        }

    }


}

(function () {
    const xbook = new Xbookcn();
    xbook.init();
})();
export default Xbookcn