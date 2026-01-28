import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ArticleMedia, Channel, ChannelType } from '@/core/extension';

class Sobooks extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension('sobooks', 'SOBooks', MediaType.Article);
        site.baseUrl = "https://sobooks.cc";
        site.description = "SoBooks - 一起分享阅读的乐趣~ 电子书下载, 免费电子书, 电子书免费下载, 电子书资源分享平台.";
        site.thumbnail = "https://sobooks.cc/favicon.ico";
        site.categoryList = [
            new SiteUrl('最新发布', '/'),
            new SiteUrl('小说文学', '/xiaoshuowenxue/'),
            new SiteUrl('历史传记', '/lishizhuanji/'),
            new SiteUrl('人文社科', '/renwensheke/'),
            new SiteUrl('励志成功', '/lizhichenggong/'),
            new SiteUrl('经济管理', '/jingjiguanli/'),
            new SiteUrl('学习教育', '/xuexijiaoyu/'),
            new SiteUrl('生活时尚', '/shenghuoshishang/'),
            new SiteUrl('漫画绘本', '/manhuahuiben/'),
        ];
        site.searchList = [
            //https://sobooks.cc/search/%E9%87%91%E7%93%B6%E6%A2%85
            new SiteUrl('搜索', '/search/{keyword}'),
        ];
        site.lang = "zh";

        return site;

    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + url + `page/${page}`;
        let nextApi = this.site.baseUrl + url + `page/${page + 1}`;
        let htmlResponse = await this.client.request({ url: api, method: "GET", });

        let $nodes = $(htmlResponse.body);

        let cardListNodes = $nodes.find('div#cardslist div.card div.card-item');
        let items: ExtensionDetail[] = [];

        cardListNodes.each((index, element) => {
            let ele = $(element);
            let link = ele.find('h3 a').attr('href') || "";
            //https://sobooks.cc/books/23511.html -> 23511
            let idMatch = link.match(/\/([\d]+)\.html/);
            let id = idMatch ? idMatch[1] : "";

            let cover = ele.find('img').attr('data-original') || "";
            let title = ele.find('h3 a').text().trim();
            let author = ele.find('p').text().trim();

            let detail = new ExtensionDetail(id, link, title);
            detail.thumbnail = this.site.baseUrl + cover;
            detail.hasChapter = false;
            detail.author = author;
            detail.type = MediaType.Article;
            items.push(detail);
        });

        let hasMore = items.length >= 40;
        return new ExtensionList(items, page, hasMore ? nextApi : undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + url.replace('{keyword}', encodeURIComponent(keyword));

        let htmlResponse = await this.client.request(
            {
                url: api,
                method: "POST",
                body: "result=66",
                headers: [
                    { key: "Content-Type", value: "application/x-www-form-urlencoded" },
                    { key: "Cookie", value: "esc_search_captcha=1;" }
                ]
            }
        );
        let $nodes = $(htmlResponse.body);

        let cardListNodes = $nodes.find('div#cardslist div.card div.card-item');
        let items: ExtensionDetail[] = [];

        cardListNodes.each((index, element) => {
            let ele = $(element);
            let link = ele.find('h3 a').attr('href') || "";
            //https://sobooks.cc/books/23511.html -> 23511
            let idMatch = link.match(/\/([\d]+)\.html/);
            let id = idMatch ? idMatch[1] : "";

            let cover = ele.find('img').attr('data-original') || "";
            let title = ele.find('h3 a').text().trim();
            let author = ele.find('p').text().trim();

            let detail = new ExtensionDetail(id, link, title);
            detail.thumbnail = this.site.baseUrl + cover;
            detail.hasChapter = false;
            detail.author = author;
            detail.type = MediaType.Article;
            items.push(detail);
        });
        return new ExtensionList(items, page, undefined);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let htmlResponse = await this.client.request({ url: url, method: "GET", });
        let $nodes = $(htmlResponse.body);

        let contentNode = $nodes.find('article#article-content');

        let content = "<html>" + contentNode.html() + "</html>";
        let title = $nodes.find('h1.article-title a').text().trim();

        let article = new ArticleMedia(id, title, content);

        return article;
    }

}


(function () {
    const sobooks = new Sobooks();
    sobooks.init();
})();

export default Sobooks;