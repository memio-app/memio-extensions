import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, VideoMedia, ItemVolume, ItemChapter, ExtensionAuth, SiteHeader } from '@/core/extension';

class Dgjyw extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("dgjyw", "东莞影视网", MediaType.Video);
        site.baseUrl = "https://www.dgjyw.com";
        site.description = "东莞影视网为您提供了丰富多样的电影和电视剧免费在线观看,影片资源齐全，有动作片喜剧片爱情片科幻片恐怖片剧情片等等";
        site.thumbnail = "https://www.dgjyw.com/favicon.ico";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("电影", "1-0-0-0-0-{page}"),
            new SiteUrl("电视剧", "14-0-0-0-0-{page}"),
            new SiteUrl("综艺", "23-0-0-0-0-{page}"),
            new SiteUrl("动漫", "28-0-0-0-0-{page}"),
            new SiteUrl("短剧", "34-0-0-0-0-{page}"),
            new SiteUrl("体育赛事", "42-0-0-0-0-{page}"),
            new SiteUrl("纪录片", "9-0-0-0-0-{page}"),
            new SiteUrl("演唱会", "47-0-0-0-0-{page}"),
        ];
        site.forceLogin = true;
        site.loginParams = [
            { key: "Cookie", value: "请填写网站的Cookie值" },
        ];

        site.useGuide = `## 如何获取东莞影视网的Cookie值
        
1. 打开浏览器，访问东莞影视网（https://www.dgjyw.com）后并显示成功后；
2. 使用浏览器的开发者工具（通常可以通过按F12键或右键点击页面并选择“检查”来打开）。
3. 在开发者工具中，找到“应用程序”或“存储”选项卡，然后选择“Cookie”。
4. 在Cookie列表中，找到与东莞影视网相关的Cookie项，通常需要 **qnzbcnmcb=****; nxgmnmry=xxxxxx;** 即可。
5. 复制需要的Cookie键值对，并将其粘贴到扩展的登录参数中的“Cookie”字段中。
6. 保存设置后，重新启动扩展以确保更改生效。

        `;
        return site;
    }

    override async loginForm(form: Map<string, string>): Promise<ExtensionAuth> {
        let auth = new ExtensionAuth();
        let cookie = form.get("Cookie") || "";
        auth.headers.push(new SiteHeader("Cookie", cookie));
        return auth;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + `/dongguanmb/` + url.replace("{page}", page.toString()) + `.html`;
        let nextApi = this.site.baseUrl + `/dongguanmb/` + url.replace("{page}", (page + 1).toString()) + `.html`;

        console.log(`Requesting item list from: ${api}`);

        const response = await this.client.request({
            url: api,
            method: "GET",
            headers: [
                { key: "Referer", value: "https://www.dgjyw.com" },
            ],
            responseCharset: "gb2312",
        });
        const html = response.body;

        const $nodes = $(html);
        let items: ExtensionDetail[] = [];
        let itemListNodes = $nodes.find("dl.B");

        itemListNodes.each((index, element) => {
            let ele = $(element);
            let linkNode = ele.find("dt a");
            let link = linkNode.attr("href") || "";
            let title = ele.find("dt a").text().trim();

            let coverNode = ele.find("dd.imgHomeList a img");
            let cover = coverNode.attr("data-src") || coverNode.attr("src") || "";

            let category = ele.find("span.ysj").text().trim();
            let status = ele.find("span.bott").text().trim();
            let act = ele.find("dd.act").text().trim();

            // /dongguanmv/348507/ -> 348507
            let id = link.replace("/dongguanmv/", "").replace("/", "");

            let item = new ExtensionDetail(id, this.site.baseUrl + link, title);
            item.thumbnail = this.site.baseUrl + cover;
            item.status = status;
            item.category = category;
            item.description = act;
            item.hasChapter = true;
            item.type = MediaType.Video;
            items.push(item);
        });

        let hasMore = items.length >= 60;
        return new ExtensionList(items, page, hasMore ? nextApi : undefined);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {

        const response = await this.client.request(
            {
                url: url,
                method: "GET",
                headers: [
                    { key: "Referer", value: "https://www.dgjyw.com" },
                ],
                responseCharset: "gb2312",

            });
        const html = response.body;
        const $nodes = $(html);

        let detailNode = $nodes.find("div.DinfoLeft");
        let cover = detailNode.find("div.Dimg img").attr("src") || "";

        let dinfoNode = detailNode.find("div.Dinfo");
        let title = dinfoNode.find("h1").text().trim();
        let description = dinfoNode.find("dd.xz").text().trim();
        let category = dinfoNode.find("dd").first().text().trim();
        let status = dinfoNode.find("dd.scut").text().trim();
        let author = dinfoNode.find("dd.s").text().trim();

        let item = new ExtensionDetail(id, url, title);
        item.thumbnail = this.site.baseUrl + cover;
        item.description = description;
        item.category = category;
        item.status = status;
        item.author = author;
        item.hasChapter = true;
        item.type = MediaType.Video;

        let volumeNode = $nodes.find("div.DinfoVolume").first();
        let chapterNodes = volumeNode.next().find("li");
        let chapters: ItemChapter[] = [];

        chapterNodes.each((index, element) => {
            let ele = $(element);
            let chapterLinkNode = ele.find("a");
            let chapterLink = chapterLinkNode.attr("href") || "";
            let chapterTitle = chapterLinkNode.text().trim();

            // /dongguanmv/613128/v1243032r2.html -> v1243032r2
            let chapterId = chapterLink.replace(`/dongguanmv/${id}/`, "").replace(".html", "");

            let chapter = new ItemChapter(chapterId, this.site.baseUrl + chapterLink, chapterTitle);
            chapters.push(chapter);
        });

        let volume = new ItemVolume("在线观看", chapters.reverse());

        item.volumes = [volume];

        return item;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // const response = await this.client.request(
        //     {
        //         url: url, method: "GET",
        //         headers: [
        //             { key: "Referer", value: "https://www.dgjyw.com" },
        //         ],
        //         responseCharset: "gb2312",

        //     }
        // );
        // const html = response.body;
        // const $nodes = $(html);

        // console.log(`Requesting item media from: ${html}`);

        // let title = $nodes.find("div.VR ul li.se").text().trim() || "";

        // let source = $nodes.find("video#myPlayer source").attr("src") || "";
        // let media = new VideoMedia(id, title, source, false, false);
        let media = new VideoMedia(id, "视频播放", url, true, false);
        return media;
    }

}

(function () {
    const dgjyw = new Dgjyw();
    dgjyw.init();
})();

export default Dgjyw;