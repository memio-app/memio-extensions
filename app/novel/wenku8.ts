import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia, ExtensionAuth, SiteHeader } from '@/core/extension';

class Wenku8 extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("wenku8", "轻小说文库", MediaType.Novel);
        site.baseUrl = "https://www.wenku8.cc";
        site.description = "这是一个专门的日本轻小说网站，本站只收录各类日本轻小说与ACG小说。\n需要登录后才能浏览小说内容。";
        site.thumbnail = "https://bangumi.oss-cn-hangzhou.aliyuncs.com/site/ic_novel_wenku8.jpg";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("最近更新", site.baseUrl + "/modules/article/toplist.php?sort=lastupdate&charset=utf8&page={page}"),
            new SiteUrl("热门轻小说", site.baseUrl + "/modules/article/toplist.php?sort=allvisit&charset=utf8&page={page}"),
            new SiteUrl("动画化作品", site.baseUrl + "/modules/article/toplist.php?sort=anime&charset=utf8&page={page}"),
            new SiteUrl("新书一览", site.baseUrl + "/modules/article/toplist.php?sort=postdate&charset=utf8&page={page}"),
            new SiteUrl("总收藏榜", site.baseUrl + "/modules/article/toplist.php?sort=goodnum&charset=utf8&page={page}"),
            new SiteUrl("月排行榜", site.baseUrl + "/modules/article/toplist.php?sort=monthvisit&charset=utf8&page={page}"),
            new SiteUrl("完结全本", site.baseUrl + "/modules/article/articlelist.php?fullflag=1&charset=utf8&page={page}"),
        ];
        site.searchList = [
            new SiteUrl("搜索(书名)", site.baseUrl + "/modules/article/search.php?searchtype=articlename&searchkey={keyword}&charset=utf8&page={page}"),
            new SiteUrl("搜索(作者)", site.baseUrl + "/modules/article/search.php?searchtype=author&searchkey={keyword}&charset=utf8&page={page}"),
            new SiteUrl("TAG", site.baseUrl + "/modules/article/tags.php?t={keyword}&charset=utf8&page={page}"),
            new SiteUrl("文库(1-14)", site.baseUrl + "/modules/article/articlelist.php?class={keyword}&charset=utf8&page={page}"),
        ];
        site.loginParams = [
            { key: "username", value: "用户名" },
            { key: "password", value: "密码" },
        ];
        site.forceLogin = true;

        site.useGuide = `## 轻小说文库账号注册

1. 可以访问轻小说文库网站：https://www.wenku8.cc/
2. 若没有账号，可以先进入 [注册页面](https://www.wenku8.net/register.php) 创建账号。
3. 注册成功后，使用你的账号登录网站，确保账号可以正常使用。

## 登录账号

1. 在扩展的登录界面，输入你在轻小说文库注册的用户名和密码。
2. 提交登录信息，扩展会自动处理登录过程。
3. 登录成功后，你就可以浏览和阅读轻小说内容了。

**注意事项：**
- 请确保你的账号信息正确无误，以免登录失败。
- 如果遇到登录问题，可以尝试在浏览器中登录网站，确认账号状态。
        `;

        return site;
    }

    private itemListParse($nodes: JQuery<HTMLElement>): ExtensionDetail[] {
        var listNode = $nodes.find("div#content table.grid tr > td > div");
        var items: ExtensionDetail[] = [];
        listNode.each((_index, element) => {
            let ele = $(element);
            let link = ele.find("div > b > a").attr("href");
            if (link) {
                let cover = ele.find("div > a > img").attr("src");
                let title = ele.find("div > b > a").text();
                let update = ele.find("div > p:eq(1)").text();
                let author = ele.find("div > p:eq(0)").text();
                let tags = ele.find("div > p:eq(2)").text();
                let description = ele.find("div > p:eq(3)").text();
                let pattern = new RegExp('/book/(.*?).htm$', 'i');
                let id = pattern.exec(link)?.[1];
                let item = new ExtensionDetail(id!, this.site.baseUrl + link + "?charset=utf8", title);
                item.thumbnail = cover;
                item.description = description;
                item.status = update;
                item.author = author;
                item.category = tags;
                item.hasChapter = true;
                item.type = MediaType.Novel;
                items.push(item);
            }
        });
        return items;
    }

    async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = url.replace("{page}", page.toString());
        var nextUrl = url.replace("{page}", (page + 1).toString());
        var htmlResponse = await this.client?.request({ url: realUrl, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);

        let items = this.itemListParse($nodes);

        var disableNext = true;
        const pageStats = $nodes.find("em#pagestats").text().split("/");
        if (pageStats && pageStats.length == 2) {
            disableNext = pageStats[0] === pageStats[1];
        }

        return new ExtensionList(items, page, disableNext ? undefined : nextUrl);

    }
    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());

        var htmlResponse = await this.client?.request({ url: realUrl, method: "GET"});
        var html = htmlResponse.body;
        let $nodes = $(html);

        if ($nodes.find("div#centerm").length > 0) {
            let items = this.itemListParse($nodes);

            var disableNext = true;
            const pageStats = $nodes.find("em#pagestats").text().split("/");
            if (pageStats && pageStats.length == 2) {
                disableNext = pageStats[0] === pageStats[1];
            }

            return new ExtensionList(items, page, disableNext ? undefined : nextUrl);
        } else {
            var items: ExtensionDetail[] = [];
            let mainNode = $nodes.find("div#centerl");
            if (mainNode) {

                let detailNode = mainNode.find("div#content > div");
                let cover = detailNode.find("table tr > td > img").attr("src");
                let description = detailNode.find("table tr > td[valign=top] span").last().text();
                let title = detailNode.find("table span > b").first().text();
                let author = detailNode.find("table:eq(0) > tbody > tr:eq(1) > td:eq(1)").text();
                let status = detailNode.find("table:eq(2) tr > td[valign=top] span:eq(3) > a").text();
                let category = detailNode.find("table:eq(2) tr > td[valign=top] span.hottext > b").first().text();
                let formAction = $nodes.find("form[name=frmreview]").attr("action");
                let id: string | undefined;
                if (formAction) {
                    const aidMatch = formAction.match(/aid=(\d+)/);
                    if (aidMatch && aidMatch[1]) {
                        id = aidMatch[1];
                    }
                }

                let item = new ExtensionDetail(id!, this.site.baseUrl + "/book/" + id + ".htm?charset=utf8", title);
                item.thumbnail = cover;
                item.description = description;
                item.status = status;
                item.author = author;
                item.category = category;
                item.hasChapter = true;
                item.type = MediaType.Novel;

                items.push(item);
            }

            return new ExtensionList(items, page, undefined);
        }
    }
    override async requestItemChapter(url: string, id?: string): Promise<ExtensionDetail> {
        var htmlResponse = await this.client?.request({ url: url, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);
        let detailNode = $nodes.find("div#content > div");
        let cover = detailNode.find("table tr > td > img").attr("src");
        let description = detailNode.find("table tr > td[valign=top] span").last().text();
        let title = detailNode.find("table span > b").first().text();
        let author = detailNode.find("table:eq(0) > tbody > tr:eq(1) > td:eq(1)").text();
        let status = detailNode.find("table:eq(2) tr > td[valign=top] span:eq(3) > a").text();
        let category = detailNode.find("table:eq(2) tr > td[valign=top] span.hottext > b").first().text();

        let item = new ExtensionDetail(id!, url, title);
        item.thumbnail = cover;
        item.description = description;
        item.author = author;
        item.status = status;
        item.category = category;
        item.hasChapter = true;
        item.type = MediaType.Novel;

        let bookId = "";
        if (id == undefined) {
            let pattern = new RegExp('/book/(.*?).htm$', 'i');
            bookId = pattern.exec(url)?.[1]!!;
        } else {
            bookId = id;
        }

        let indexUrl = this.site.baseUrl + "/modules/article/reader.php?aid={bookId}&charset=utf8".replace("{bookId}", bookId);
        var indexResponse = await this.client?.request({ url: indexUrl, method: "GET" });
        var indexHtml = indexResponse.body;
        let $volumns = $(indexHtml);
        let volumes = $($volumns.filter("table.css").first()).find("tr");
        item.volumes = [];
        let tempVolume: ItemVolume = new ItemVolume("", []);
        volumes.each((_index, element) => {
            let $element = $(element);
            let volume = $element.find("td.vcss");
            if (volume.length > 0) {
                tempVolume = new ItemVolume(volume.text(), []);
                item.volumes?.push(tempVolume);
                return;
            }
            let chapters = $element.find("td.ccss");
            chapters.each((_index, element) => {
                let chapter = $(element);
                let link = chapter.find("a").attr("href");
                if (link == undefined) { return; }
                let pattern: RegExp = /&cid=(.*)/gi;
                let cid = pattern.exec(link)?.[1];
                let title = chapter.find("a").text();
                let item = new ItemChapter(cid!, link + "&charset=utf8", title);
                tempVolume.chapters.push(item);
            });
        });
        return item;
    }
    async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        var htmlResponse = await this.client?.request({ url: url, method: "GET" });
        var html = htmlResponse.body;
        let $nodes = $(html);
        let title = $nodes.find("div#title").text();
        let findedContent = $nodes.find("div#content").first();
        let content = findedContent.html();
        return new NovelMedia(id, title, "<p>" + content + "</p>");
    }

    override async loginForm(form: Map<string, string>): Promise<ExtensionAuth> {
        let username = form.get("username") ?? "";
        let password = form.get("password") ?? "";
        if (username == "" || password == "") {
            return new ExtensionAuth();
        }
        let url = this.site.baseUrl + "/login.php?do=submit&jumpurl=http%3A%2F%2Fwww.wenku8.cc%2Findex.php";
        let body = 'username=' + username + '&password=' + password + '&usecookie=2592000&action=login'
        let headers = [
            { key: "Content-Type", value: "application/x-www-form-urlencoded" },
        ];
        let htmlResponse = await this.client?.request(
            {
                url: url, method: "POST", body: body, headers: headers,
                contentType: "application/x-www-form-urlencoded",
                responseHeaders: ["p3p", "set-cookie"]
            }
        )
        var extensionAuth = new ExtensionAuth();
        const resHeaders = htmlResponse?.headers;
        var containP3pHeader = false;
        var containHeader: SiteHeader[] = [];
        resHeaders.forEach((header) => {
            if (header.key.toLowerCase() == "p3p") {
                containP3pHeader = true;
            } else if (header.key.toLowerCase() == "set-cookie") {
                containHeader.push(new SiteHeader(header.key, header.value));
            }
        });
        if (containP3pHeader) {
            extensionAuth.headers.push(...containHeader);
        }
        return extensionAuth;
    }
}

(function () {
    const wenku8 = new Wenku8();
    wenku8.init();
})();

export default Wenku8;