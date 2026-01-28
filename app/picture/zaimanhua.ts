import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';

class Zaimanhua extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("zaimanhua", "再漫画", MediaType.Picture);
        site.baseUrl = "https://manhua.zaimanhua.com";
        site.thumbnail = "https://tvax3.sinaimg.cn/crop.0.0.600.600.50/006rTElvly8hysey9ha3xj30go0goq4j.jpg";
        site.lang = "zh";

        site.description = "再漫画为您提供每日更新在线漫画观看，拥有国内最新最全的少年少女漫画大全，好看的少年少女漫画大全尽在再漫画漫画网";
        site.categoryList = [
            new SiteUrl("最近更新", "size=20&page={page}"),
        ];

        site.searchList = [
            new SiteUrl("搜索", "keyword={keyword}&source=0&page={page}&size=24"),
        ];

        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        // https://manhua.zaimanhua.com/api/v1/comic2/update_list?page=1&size=20
        let api = this.site.baseUrl + "/api/v1/comic2/update_list?" + url.replace("{page}", page.toString());
        let response = await this.client?.request({ url: api, method: "GET" });
        let jsonContent = response.body;

        try {
            let json = JSON.parse(jsonContent);
            let comicList = json.data.comicList;

            let details: ExtensionDetail[] = [];
            comicList.forEach((comic: any) => {
                let id = comic.id.toString();
                let title = comic.name;
                let author = comic.authors;
                let category = comic.types;
                let status = comic.status;
                let thumbnail = comic.cover;
                let detailUrl = this.site.baseUrl + "/details/" + id;
                let detail = new ExtensionDetail(id, detailUrl, title);
                detail.author = author;
                detail.category = category;
                detail.status = status;
                detail.thumbnail = thumbnail;
                detail.type = MediaType.Picture;
                detail.hasChapter = true;
                details.push(detail);
            });

            let totalNum = json.data.totalNum;
            let hasMore = page * 20 < totalNum;
            let nextApi = hasMore ? this.site.baseUrl + "/api/v1/comic2/update_list?" + url.replace("{page}", (page + 1).toString()) : undefined;
            return new ExtensionList(details, page, nextApi);
        } catch (e) {
            console.log("requestItemList parse json error:", e);
        }
        return new ExtensionList([], page, undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        // https://manhua.zaimanhua.com/app/v1/search/index?keyword=恋爱&source=0&page=1&size=24
        let api = this.site.baseUrl + "/app/v1/search/index?" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", page.toString());
        let response = await this.client?.request({ url: api, method: "GET" });
        let jsonContent = response.body;

        try {
            let json = JSON.parse(jsonContent);
            let comicList = json.data.list;

            let details: ExtensionDetail[] = [];
            comicList.forEach((comic: any) => {
                let id = comic.id.toString();
                let title = comic.title;
                let author = comic.authors;
                let category = comic.types;
                let status = comic.last_update_chapter_name;
                let thumbnail = comic.cover;
                let detailUrl = this.site.baseUrl + "/details/" + id;
                let detail = new ExtensionDetail(id, detailUrl, title);
                detail.author = author;
                detail.category = category;
                detail.status = status;
                detail.thumbnail = thumbnail;
                detail.type = MediaType.Picture;
                detail.hasChapter = true;
                details.push(detail);
            });

            let totalNum = json.data.total;
            let hasMore = page * 24 < totalNum;
            let nextApi = hasMore ? this.site.baseUrl + "/app/v1/search/index?" + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{page}", (page + 1).toString()) : undefined;
            return new ExtensionList(details, page, nextApi);
        } catch (e) {
            console.log("searchItemList parse json error:", e);
        }
        return new ExtensionList([], page, undefined);
    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        //https://manhua.zaimanhua.com/api/v1/comic2/comic/detail?id=41672
        let api = this.site.baseUrl + "/api/v1/comic2/comic/detail?id=" + id;
        let response = await this.client?.request({ url: api, method: "GET" });
        let jsonContent = response.body;

        try {
            let json = JSON.parse(jsonContent);
            if(json.errno !== 0) {
                let msg = json.errmsg || "unknown error";
                return new ExtensionDetail("-1", url, msg);
            }
            let comicData = json.data.comicInfo;
            let title = comicData.title;
            let author = comicData.authorsTagList.map((tag: any) => tag.tagName).join(", ");
            let category = comicData.themeTagList.map((tag: any) => tag.tagName).join(", ");
            let description = comicData.description;

            let volumes: ItemVolume[] = [];
            comicData.chapterList.forEach((v: any) => {
                let chapters: ItemChapter[] = [];
                let volumeName = v.title;

                v.data.forEach((c: any) => {
                    let chapterId = c.chapter_id.toString();
                    let chapterTitle = c.chapter_title;
                    // https://manhua.zaimanhua.com/detail/41672/103820
                    let chapterUrl = this.site.baseUrl + "/detail/" + id + "/" + chapterId;
                    let chapterItem = new ItemChapter(chapterId, chapterUrl, chapterTitle);
                    chapters.push(chapterItem);
                });

                let volume = new ItemVolume(volumeName, chapters.reverse());
                volumes.push(volume);
            });

            let detail = new ExtensionDetail(id, url, title);
            detail.author = author;
            detail.category = category;
            detail.description = description;
            detail.volumes = volumes;
            detail.type = MediaType.Picture;
            detail.hasChapter = true;
            return detail;

        } catch (e) {
            console.log("requestItemChapter parse json error:", e);
        }
        return new ExtensionDetail("-1", url, "");
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // https://manhua.zaimanhua.com/detail/41672/103820 -> 41672
        let comicId = url.split("/").slice(-2)[0];
        // https://manhua.zaimanhua.com/api/v1/comic2/chapter/detail?comic_id=41672&chapter_id=181803
        let api = this.site.baseUrl + `/api/v1/comic2/chapter/detail?comic_id=${comicId}&chapter_id=${id}`;

        console.log("requestItemMedia api:", api);

        let response = await this.client?.request({ url: api, method: "GET" });
        let jsonContent = response.body;

        try {
            let json = JSON.parse(jsonContent);
            let chapterData = json.data.chapterInfo;
            let title = chapterData.title;
            let pageList = chapterData.page_url;

            let images: string[] = [];
            pageList.forEach((page: any) => {
                let imageUrl = page;
                images.push(imageUrl);
            });

            let media = new PictureMedia(id, title, images);
            return media;

        } catch (e) {
            console.log("requestItemMedia parse json error:", e);
        }
        return new PictureMedia("-1", "", []);
    }
}

(function () {
    const zaimanhua = new Zaimanhua();
    zaimanhua.init();
})();
export default Zaimanhua;
