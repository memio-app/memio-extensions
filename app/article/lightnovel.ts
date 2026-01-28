import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, MediaType, ArticleMedia } from '@/core/extension';

class LightNovel extends Rule {

    provideExtensionInfo(): Extension {

        let site = new Extension("lightnovel", "轻之国度", MediaType.Article)
        site.baseUrl = "https://www.lightnovel.fun"
        site.thumbnail = "https://www.lightnovel.fun/_nuxt/img/57c2c3d.svg"
        site.description = "轻之国度是专注于分享的NACG社群，这里有用户分享的最新的NACG资源，有很好的社群与创作氛围"
        site.lang = "zh"
        site.categoryList = [
            { name: "资讯", url: `parent_gid=1&gid=0` },
            { name: "资讯-轻小说", url: `parent_gid=1&gid=100` },
            { name: "资讯-漫画", url: `parent_gid=1&gid=101` },
            { name: "资讯-动画", url: `parent_gid=1&gid=102` },
            { name: "资讯-游戏", url: `parent_gid=1&gid=103` },
            { name: "资讯-手办模型", url: `parent_gid=1&gid=104` },
            { name: "资讯-其它", url: `parent_gid=1&gid=105` },
            { name: "轻小说-最新", url: `parent_gid=3&gid=106` },
            { name: "轻小说-整卷", url: `parent_gid=3&gid=107` },
            { name: "轻小说-下载", url: `parent_gid=3&gid=108` },
            { name: "轻小说-epub", url: `parent_gid=3&gid=110` },
            { name: "轻小说-原创", url: `parent_gid=3&gid=111` },
            { name: "漫画", url: `parent_gid=33&gid=0` },
            { name: "动画", url: `parent_gid=34&gid=0` },
            { name: "素材", url: `parent_gid=36&gid=0` },
            { name: "图坊", url: `parent_gid=37&gid=0` },
            { name: "其它资源", url: `parent_gid=40&gid=0` },
        ]


        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let requestApi = `https://www.lightnovel.fun/proxy/api/category/get-article-by-cate`;
        let parentGid = url.split("&")[0].split("=")[1] || "0";
        let gid = url.split("&")[1].split("=")[1] || "0";

        let body = `{"is_encrypted":0,"platform":"pc","client":"web","sign":"","gz":0,"d":{"parent_gid":${parentGid},"gid":${gid},"page":${page}}}`
        console.log("request body", body);

        let response = await this.client?.request(
            {
                url: requestApi,
                method: "POST",
                contentType: "application/json",
                headers: [
                    { key: 'Referer', value: this.site.baseUrl },
                    { key: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' }
                ],
                body: body
            }
        );

        console.log("response body", response.body);

        let json = JSON.parse(response.body);
        let code = json['code'];
        if (code != 0) {
            return new ExtensionList([], page, undefined);
        }

        let itemList: ExtensionDetail[] = []

        let list = json['data']['list'];
        for (let item of list) {
            let id = item['aid'].toString();
            let title = item['title'];
            // https://www.lightnovel.fun/cn/detail/1142038
            let link = this.site.baseUrl + `/cn/detail/${id}`;
            let author = item['author'];
            let cover = item['banner'];
            let category = item['series_name'] ?? item['group_name'] ?? "";
            let status = item['last_time'];

            let detail: ExtensionDetail = new ExtensionDetail(id, link, title);
            detail.author = author;
            detail.thumbnail = cover;
            detail.category = category;
            detail.status = status;
            detail.hasChapter = false;

            itemList.push(detail);
        }

        let pageInfo = json['data']['page_info'];
        let pageSize = pageInfo['size'];
        let totalCount = pageInfo['total'];
        let hasNextPage = (page * pageSize >= totalCount) ? false : true;

        return new ExtensionList(itemList, page, hasNextPage ? url : undefined);
    }


    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let response = await this.client?.request({ url: url, method: "GET" });
        let $nodes = $(response.body);

        let title = $nodes.find("h2.article-title").text().trim();
        let date = $nodes.find("div.article-infos span").first().text().trim();
        let article =$nodes.find("article#article-main-contents")
        let content = `<html><p>${article.html()}</p></html>`
        let media  = new ArticleMedia(id, title, content);
        media.date = date;
        return media;
    }

}

(function () {
    let rule = new LightNovel();
    rule.init();
})();

export default LightNovel;