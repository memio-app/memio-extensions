import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemVolume, ItemChapter, MediaType, NovelMedia, ExtensionAuth } from '@/core/extension';

class Shuba69 extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("69shuba", "69书吧", MediaType.Novel)
        site.baseUrl = "https://www.69shuba.com"
        site.thumbnail = "https://cdn.cdnshu.com/favicon.ico"
        site.description = "69书吧提供最新最热网络小说，无弹窗小说阅读,最新章节阅读，全文阅读，无错小说阅读"
        site.lang = "zh-HK"
        //https://www.69shuba.com/ajax_novels/class/11/6.htm
        site.categoryList = [
            { name: "全部分类", url: "/ajax_novels/class/0/{page}.htm" },
            { name: "言情小说", url: "/ajax_novels/class/3/{page}.htm" },
            { name: "玄幻魔法", url: "/ajax_novels/class/1/{page}.htm" },
            { name: "修真武侠", url: "/ajax_novels/class/2/{page}.htm" },
            { name: "穿越时空", url: "/ajax_novels/class/11/{page}.htm" },
            { name: "都市小说", url: "/ajax_novels/class/9/{page}.htm" },
            { name: "历史军事", url: "/ajax_novels/class/4/{page}.htm" },
            { name: "游戏竞技", url: "/ajax_novels/class/5/{page}.htm" },
            { name: "科幻空间", url: "/ajax_novels/class/6/{page}.htm" },
            { name: "悬疑惊悚", url: "/ajax_novels/class/7/{page}.htm" },
            { name: "同人小说", url: "/ajax_novels/class/8/{page}.htm" },
            { name: "官场职场", url: "/ajax_novels/class/10/{page}.htm" },
            { name: "青春校园", url: "/ajax_novels/class/12/{page}.htm" },
        ]

        site.searchList = [
            new SiteUrl("搜索小说", site.baseUrl + "/modules/article/search.php"),
        ]

        site.forceLogin = false;
        site.loginParams = [
            { key: "Cookie", value: "Cookie" },
        ]

        site.useGuide = `## 如何搜索书籍
1. 该网站搜索需要验证用户身份，您需要提供在网页端生成的Cookie信息。
2. 打开浏览器，访问 [69书吧-www.69shuba.com](https://www.69shuba.com/) 网站。
3. 进入搜索页面，输入任意关键词进行搜索。
4. 使用浏览器的开发者工具，找到请求头中的Cookie信息，提取关键词 **shuba_userverfiy** 及其对应的值。如 shuba_userverfiy=1765963948@173d5fb0753eb21fd27b6ba175adb751; 
5. 将提取到的Cookie信息复制并粘贴到本扩展的登录参数中。
6. 保存后，您就可以使用搜索功能查找小说了。
`;

        return site
    }

    override async loginForm(form: Map<string, string>): Promise<ExtensionAuth> {
        let auth = new ExtensionAuth();
        let cookie = form.get("Cookie") || "";
        if (cookie.indexOf("shuba_userverfiy=") < 0) {
            return auth;
        }
        auth.headers = [
            { key: "Cookie", value: cookie },
        ]
        return auth;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let pageUrl = this.site.baseUrl + url.replace("{page}", page.toString());
        let response = await this.client?.request({ url: pageUrl, method: "GET" });
        let html = response.body;

        let $nodes = $(html);
        let itemNodes = $nodes.filter("li");
        console.log(itemNodes.length);
        let items: ExtensionDetail[] = [];
        itemNodes.each((index, element) => {
            let itemNode = $(element);

            let cover = itemNode.find("img").attr("data-src") || "";

            let link = itemNode.find("h3 > a").attr("href") || "";
            let id = link.split("/").pop()?.replace(".htm", "") || "";
            link = link.replace(".htm", "/");
            let title = itemNode.find("h3 > a").text().trim();
            let labels = itemNode.find("div.labelbox label").toArray().map(x => $(x).text().trim());
            let description = itemNode.find("ol").text().trim();
            let lastUpdateNode = itemNode.find("div.zxzj")
            lastUpdateNode.find("span").remove();
            let lastUpdate = lastUpdateNode.text().trim();

            let detail: ExtensionDetail = new ExtensionDetail(id, link, title);
            detail.author = labels.join(", ");
            detail.description = description;
            detail.category = lastUpdate;
            detail.hasChapter = true;
            detail.thumbnail = cover;
            detail.type = MediaType.Novel;

            items.push(detail);
        });

        let hasMore = items.length >= 50;
        return new ExtensionList(items, page, hasMore ? url : undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let formData = "searchkey=" + encodeURIComponent(keyword) + "&searchtype=all";
        let response = await this.client?.request({
            url: url,
            contentType: "application/x-www-form-urlencoded",
            method: "POST",
            body: formData
        });

        let html = response.body;

        let $nodes = $(html);
        let itemNodes = $nodes.find("div.newbox ul li ");
        let items: ExtensionDetail[] = [];
        itemNodes.each((index, element) => {
            let itemNode = $(element);
            let cover = itemNode.find("img").attr("data-src") || "";

            let link = itemNode.find("h3 > a").attr("href") || "";
            let id = link.split("/").pop()?.replace(".htm", "") || "";
            link = link.replace(".htm", "/");
            let title = itemNode.find("h3 > a").text().trim();
            let labels = itemNode.find("div.labelbox label").toArray().map(x => $(x).text().trim());
            let description = itemNode.find("ol").text().trim();
            let lastUpdateNode = itemNode.find("div.zxzj")
            lastUpdateNode.find("span").remove();
            let lastUpdate = lastUpdateNode.text().trim();

            let detail: ExtensionDetail = new ExtensionDetail(id, link, title);
            detail.author = labels.join(", ");
            detail.description = description;
            detail.category = lastUpdate;
            detail.hasChapter = true;
            detail.thumbnail = cover;
            detail.type = MediaType.Novel;

            items.push(detail);

        });

        return new ExtensionList(items, page, undefined);

    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        //https://www.69shuba.com/book/90442/
        let pageUrl = this.site.baseUrl + "/book/" + id + "/";
        let response = await this.client?.request(
            { url: pageUrl, method: "GET", responseCharset: "gbk" }
        );
        let html = response.body;

        let $nodes = $(html);
        let catalog = $nodes.find("div#catalog");

        let title = catalog.find("h1 a").text().trim().replace("最新章节", "");
        let detail = new ExtensionDetail(id, pageUrl, title);

        let chapters: ItemChapter[] = [];
        let chapterNodes = catalog.find("ul li");
        chapterNodes.each((index, element) => {
            let chapterNode = $(element);
            let chapterLink = chapterNode.find("a").attr("href") || "";
            let chapterId = chapterLink.split("/").pop() || "";
            let chapterTitle = chapterNode.find("a").text().trim();

            let chapter = new ItemChapter(chapterId, chapterLink, chapterTitle);
            chapters.push(chapter);
        });
        let volumes = [new ItemVolume("章节列表", chapters.reverse())];
        detail.volumes = volumes;
        return detail;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {

        //https://www.69shuba.com/book/90442/305373.html
        let response = await this.client?.request(
            {
                url: url,
                method: "GET",
                responseCharset: "gbk",
                headers: [
                    { key: "Referer", value: this.site.baseUrl }
                ]
            }
        );
        let html = response.body;
        let $nodes = $(html);

        let contentNode = $nodes.find("div.txtnav");
        let title = contentNode.find("h1").text().trim();

        // remove script
        contentNode.find("script").remove();
        contentNode.find("h1").remove();
        contentNode.find("div").remove();
        
        let content = `<html><p>${contentNode.html()}</p></html>`;
        //&emsp;&emsp;墨画连忙点了点头，然后和管事行礼道谢便离开了。
        content = content.replace(/^(&emsp;)+/gm, '');

        let media = new NovelMedia(id, title, content);

        return media;
    }

}

(function () {
    const rule = new Shuba69();
    rule.init();
})();

export default Shuba69;