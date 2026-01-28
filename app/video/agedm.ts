import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, MediaType, VideoMedia } from '@/core/extension';

class AgeDm extends Rule {

    siteHost = "https://ageapi.omwjhz.com:18888";

    provideExtensionInfo(): Extension {
        let site = new Extension("agedm", "AGE动漫", MediaType.Video);
        site.baseUrl = "https://ageapi.omwjhz.com:18888";
        site.description = "Age动漫专业的在线动漫网站，动漫免费在线观看，高品质画质，实时更新，追番利器!"
        site.thumbnail = "https://p1.bdxiguaimg.com/origin/13843000115ffe11c0c01";
        site.lang = "zh";
        site.categoryList = [
            new SiteUrl("最近更新", site.baseUrl + "/v2/catalog?order=time&status=all&page={page}&size=30"),
            new SiteUrl("连载中", site.baseUrl + "/v2/catalog?order=time&status=%E8%BF%9E%E8%BD%BD&page={page}&size=30"),
            new SiteUrl("已完结", site.baseUrl + "/v2/catalog?order=time&status=%E5%AE%8C%E7%BB%93&page={page}&size=30"),
            new SiteUrl("TV", site.baseUrl + "/v2/catalog?genre=TV&order=time&page={page}&size=30"),
            new SiteUrl("剧场版", site.baseUrl + "/v2/catalog?genre=%E5%89%A7%E5%9C%BA%E7%89%88&order=time&page={page}&size=30"),
            new SiteUrl("OVA", site.baseUrl + "/v2/catalog?genre=OVA&order=time&page={page}&size=30"),
            new SiteUrl("1月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=1&page={page}&size=30"),
            new SiteUrl("4月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=4&page={page}&size=30"),
            new SiteUrl("7月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=7&page={page}&size=30"),
            new SiteUrl("10月新番", site.baseUrl + "/v2/catalog?order=time&status=all&season=10&page={page}&size=30"),
        ];
        site.searchList = [
            new SiteUrl("默认", site.baseUrl + "/v2/search?query={keyword}&page={page}"),
        ];
        return site;
    }

    async requestItemList(url: string, page: number): Promise<ExtensionList> {
        var realUrl = url.replace("{page}", page.toString());
        var nextUrl = url.replace("{page}", (page + 1).toString());
        var httpResponse = await this.client?.request(
            {
                url: realUrl,
                method: "GET",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                ]
            });
        const json = JSON.parse(httpResponse.body);

        var items: ExtensionDetail[] = [];
        json.videos.forEach((ele: any) => {
            const id = ele.id.toString();
            const link = this.site.baseUrl + `/v2/detail/${id}`;
            const cover = ele.cover;
            const title = ele.name;
            const description = ele.intro;
            const update = this.formatTimeStamp(ele.time);
            const author = ele.writer;
            const category = ele.tags;
            let item = new ExtensionDetail(id, link, title);
            item.thumbnail = cover;
            item.description = description;
            item.status = update;
            item.category = category;
            item.author = author;
            item.hasChapter = true;
            item.type = MediaType.Video;
            items.push(item);
            return item;
        });
        const total = json.total as number;

        let disableNext = (page ?? 1) * 30 >= total;
        return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
    }

    formatTimeStamp(timestamp: number): string {
        const date = new Date(timestamp * 1000); // 乘以1000转换为毫秒
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // 自定义格式：YYYY-MM-DD
        return formattedDate;
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let realUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let nextUrl = url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString());
        var httpResponse = await this.client?.request(
            {
                url: realUrl,
                method: "GET",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                ]
            });
        const json = JSON.parse(httpResponse.body);

        var items: ExtensionDetail[] = [];
        json.data.videos.forEach((ele: any) => {
            const id = ele.id.toString();
            const link = this.site.baseUrl + `/v2/detail/${id}`;
            const cover = ele.cover;
            const title = ele.name;
            const description = ele.intro;
            const update = this.formatTimeStamp(ele.time);
            const author = ele.writer;
            const category = ele.tags;
            let item = new ExtensionDetail(id, link, title);
            item.thumbnail = cover;
            item.description = description;
            item.status = update;
            item.category = category;
            item.author = author;
            item.hasChapter = true;
            item.type = MediaType.Video;
            items.push(item);
            return item;
        });

        let disableNext = (json.data.totalPage as number) <= (page);
        return new ExtensionList(items, page ? page : 1, disableNext ? undefined : nextUrl);
    }

    override async requestItemChapter(url: string, id?: string): Promise<ExtensionDetail> {
        const requestUrl = id ? `${this.site.baseUrl}/v2/detail/${id}` : url;
        var httpResponse = await this.client?.request(
            {
                url: requestUrl,
                method: "GET",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                ]
            });
        const json = JSON.parse(httpResponse.body);

        const ele = json.video;
        const detailId = ele.id.toString();
        const link = `${this.site.baseUrl}/v2/detail/${id}`;
        const title = ele.name;
        let detail = new ExtensionDetail(detailId, link, title);

        detail.thumbnail = ele.cover;
        detail.description = ele.intro;
        detail.status = ele.status;
        detail.category = ele.tags;
        detail.author = ele.writer;
        detail.hasChapter = true;
        detail.type = MediaType.Video;

        let volumes = ele.playlists;
        const mediaUrlPrefix = json.player_jx.zj;
        const mediaVipPrefix = json.player_jx.vip;

        detail.volumes = [];
        const keys = Object.keys(volumes);
        keys.forEach((key) => {
            let volumeName = key;
            let chapterList: ItemChapter[] = [];
            let prefix = key.includes("m3u8") ? mediaUrlPrefix : mediaVipPrefix;
            var index = 0;
            volumes[key].forEach((item: any) => {
                let chapterId = ++index;
                let chapterLink = prefix + item[1];
                let chapterTitle = item[0];
                let chapter = new ItemChapter(chapterId.toString(), chapterLink, chapterTitle);
                chapterList.push(chapter);
            });
            detail.volumes?.push({ name: volumeName, chapters: chapterList });
        });
        return detail;
    }

    async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        var httpResponse = await this.client?.request(
            {
                url: url,
                method: "GET",
                headers: [
                    { key: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/244.178.44.111 Safari/537.36" },
                ]
            });
        var html = httpResponse.body;
        const rExp: RegExp = /var Vurl = '(.+?)'/g;
        const result = rExp.exec(html);
        var autoCatch = true;
        if (result != null && result.length > 1) {
            autoCatch = false;
        }
        const watchUrl = result ? result[1] : url;
        return new VideoMedia(id, "", watchUrl, autoCatch);
    }

}

(function () {
    const agedm = new AgeDm();
    agedm.init();
})();

export default AgeDm;
