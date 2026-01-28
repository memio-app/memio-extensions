import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, MediaType, VideoMedia, ItemVolume } from '@/core/extension';

class Ntdm extends Rule {

    siteHost = "https://www.ntdm8.com";

    provideExtensionInfo(): Extension {
        let site = new Extension("ntdm", "NT动漫", MediaType.Video);
        site.baseUrl = "https://www.ntdm8.com";
        site.description = "NT动漫专业的在线动漫网站，动漫免费在线观看，高品质画质，实时更新，追番利器!"
        site.thumbnail = "https://cdn.yinghuazy.xyz/webjs/ntdm8/image/favicon.ico";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("日本", "type/riben-{page}.html"),
            new SiteUrl("中国", "type/zhongguo-{page}.html"),
            new SiteUrl("欧美", "type/oumei-{page}.html"),
        ];
        site.searchList = [
            new SiteUrl("默认", "search/-------------.html?wd={keyword}&page={page}"),
        ];

        site.configParams = [
            { key: "host", value: "网站地址，可查看发布页（www.ntdm.fans）" },
        ]
        this.siteHost = site.baseUrl;
        return site;
    }

    override async config(form: Map<string, string>): Promise<boolean> {
        const host = form.get("host");
        if (host && host.length > 0) {
            if (host.endsWith("/")) {
                this.siteHost = host.substring(0, host.length - 1);
            } else {
                this.siteHost = host;
            }
            return true;
        }
        return false;
    }

    private async parseVideoItemList(items: JQuery<HTMLElement>): Promise<ExtensionDetail[]> {
        var details: ExtensionDetail[] = [];

        items.each((index, element) => {
            const ele = $(element);
            const aNode = ele.find("a.cell_poster");
            const link = aNode.attr("href") || "";
            // /video/7006.html -> 7006
            const id = link ? link.replace("/video/", "").replace(".html", "") : "";

            const cover = aNode.find("img").attr("src") || "";
            const status = aNode.find("span.newname").text().trim();

            let categorys = ele.find("div.cell_imform_kvs span.cell_imform_value");
            let category = "";
            let author = "";
            // get category at 0-3
            if (categorys.length >= 3) {
                category = $(categorys[1]).text().trim();
                author = $(categorys[0]).text().trim() + " / " + $(categorys[3]).text().trim();
            }

            const title = ele.find("a.cell_imform_name").text().trim();
            const description = ele.find("div.cell_imform_kvs div.cell_imform_kv").last().find("div.cell_imform_desc").text().trim();

            let item = new ExtensionDetail(id, this.siteHost + link, title);
            item.thumbnail = cover;
            item.description = description;
            item.status = status;
            item.category = category;
            item.author = author;
            item.hasChapter = true;
            item.type = MediaType.Video;

            details.push(item);
        });

        return details;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = this.siteHost + "/" + url.replace("{page}", page.toString());
        var httpResponse = await this.client?.request(
            {
                url: realUrl,
                method: "GET",
            });

        let $nodes = $(httpResponse.body);
        let items = $nodes.find("div.baseblock > div.blockcontent1 > div.cell");
        let details = await this.parseVideoItemList(items);

        let hasMore = details.length >= 15;
        let nextUrl = hasMore ? this.siteHost + "/" + url.replace("{page}", (page + 1).toString()) : undefined;
        return new ExtensionList(details, page, nextUrl);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        var realUrl = this.siteHost + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        var nextUrl = this.siteHost + "/" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());

        var httpResponse = await this.client?.request(
            {
                url: realUrl,
                method: "GET",
            });

        let $nodes = $(httpResponse.body);
        let items = $nodes.find("div.baseblock > div.blockcontent1 > div.cell");
        let details = await this.parseVideoItemList(items);

        let hasMore = details.length >= 10;
        return new ExtensionList(details, page, hasMore ? nextUrl : undefined);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        var httpResponse = await this.client?.request(
            {
                url: url,
                method: "GET",
            });

        let $nodes = $(httpResponse.body);

        let cover = $nodes.find("div.blockcontent > img.poster").attr("src") || "";
        let categoryNodes = $nodes.find("div.blockcontent ul.blockcontent li.detail_imform_kv span.detail_imform_value");
        let category = "";
        let author = "";
        let status = "";
        // get category at 0-3
        if (categoryNodes.length >= 3) {
            status = $(categoryNodes[0]).text().trim();
            category = categoryNodes.last().text().trim();
            author = $(categoryNodes[1]).text().trim() + " / " + $(categoryNodes[2]).text().trim();
        }
        let title = $nodes.find("div.blockcontent h4.detail_imform_name").text().trim();
        let description = $nodes.find("div.blockcontent div.detail_imform_desc_pre p").text().trim();

        let volumeNames = $nodes.find("ul#menu0 li");

        let volumeNodes = $nodes.find("div#content div#main0 div.movurl ul");
        let volumes: ItemVolume[] = [];
        volumeNodes.each((vIndex, vElement) => {
            const vEle = $(vElement);
            const chapterNodes = vEle.find("li");
            let volumeName = volumeNames.eq(vIndex).text().trim();
            let chapters: ItemChapter[] = [];
            chapterNodes.each((cIndex, cElement) => {
                const cEle = $(cElement);
                const aNode = cEle.find("a");
                const chapterTitle = aNode.text().trim();
                const chapterLink = aNode.attr("href") || "";
                // /play/7006-1-1.html -> 7006-1-1
                const chapterId = chapterLink.replace("/play/", "").replace(".html", "");

                let chapter = new ItemChapter(chapterId, this.siteHost + chapterLink, chapterTitle);
                chapters.push(chapter);
            });
            let volume = new ItemVolume(volumeName || "默认", chapters);
            volumes.push(volume);
        });

        let item = new ExtensionDetail(id, url, title);
        item.thumbnail = cover;
        item.description = description;
        item.status = status;
        item.category = category;
        item.author = author;
        item.hasChapter = true;
        item.type = MediaType.Video;
        item.volumes = volumes;

        return item;
    }

    playerConfigJson: any = undefined;

    private async findPlayerConfigPath(key: string, html: string): Promise<string> {
        // parse <script type="text/javascript" src="/static/js/playerconfig.js?t=20251226">
        const scriptRegex = /<script type="text\/javascript" src="(\/static\/js\/playerconfig\.js\?t=\d+)"><\/script>/;
        const match = html.match(scriptRegex);
        if (!match || match.length < 2) {
            throw new Error("playerconfig.js not found");
        }
        const scriptPath = match[1];
        const scriptUrl = this.siteHost + scriptPath;

        var httpResponse = await this.client?.request({ url: scriptUrl, method: "GET", });
        let jsContent = httpResponse.body;
        // parse MacPlayerConfig.player_list={...};
        const configRegex = /MacPlayerConfig\.player_list=({.+?}),MacPlayerConfig.downer_list/;
        const configMatch = jsContent.match(configRegex);
        if (!configMatch || configMatch.length < 2) {
            console.error("player_list config not found");
            return "";
        }
        let json = JSON.parse(configMatch[1]);
        this.playerConfigJson = json;
        let urlPath = json[key];
        return urlPath.parse;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        var httpResponse = await this.client?.request({ url: url, method: "GET", });
        let html = httpResponse.body;

        // parse<div>sasad <script type="text/javascript">var player_aaaa={"flag":"play","encrypt":0,"trysee":0,"points":0,"link":"\/play\/7077-1-1.html","link_next":"\/play\/7077-2-3.html","link_pre":"\/play\/7077-2-1.html","url":"o%2FOVeQuRw71F8Rl%2F1KvXYEri6RXwurJMS4M677Jqse6eECBfrz0yVNud0xg1%2FkJ9s4P4kPO%2FzcZ2ejzDeLLNxQ%3D%3D","url_next":"o%2FOVeQuRw71F8Rl%2F1KvXYEri6RXwurJMS4M677Jqse566%2FkaWR6z%2FSc3%2BI0%2F0RGReSt3g89xZp5D9WAQm7XSHg%3D%3D","from":"dyttm3u8","server":"no","note":"","id":"7077","sid":2,"nid":2}</script>
        const scriptRegex = /<script type="text\/javascript">var player_aaaa=({.+?})<\/script>/;
        const match = html.match(scriptRegex);
        if (!match || match.length < 2) {
            console.error("player_aaaa not found");
            return new VideoMedia(id, "", url, true);
        }
        const playerJson = match[1];

        const playerObj = JSON.parse(playerJson);
        const encodedUrl = playerObj.url;
        const from = playerObj.from || "unknown";
        let watchUrl = "";

        if (!this.playerConfigJson) {
            let playPath = await this.findPlayerConfigPath(from, html);
            if (playPath.length == 0) {
                return new VideoMedia(id, "", url, true);
            }
            watchUrl = playPath + encodedUrl;
        } else {
            let playPath = this.playerConfigJson[from].parse;
            if (playPath.length == 0) {
                return new VideoMedia(id, "", url, true);
            }
            watchUrl = playPath + encodedUrl;
        }
        return new VideoMedia(id, "", watchUrl, false, true);
    }
}

(function () {
    const ntdm = new Ntdm();
    ntdm.init();
})();
export default Ntdm;