import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';

class Komiic extends Rule {
    provideExtensionInfo(): Extension {
        let site = new Extension("komiic", "Komiic漫畫", MediaType.Picture);
        site.baseUrl = "https://komiic.com";
        site.thumbnail = "https://komiic.com/pwa-192x192.png";
        site.description = "漫畫網站，現在努力的在經營這個網站，想把它做到最好，目前漫畫數不多，大多在1400本漫畫, 陸續增加中，會定期更新，會努力的給你最好的體驗";
        site.lang = "zh-TW";
        site.categoryList = [
            new SiteUrl("最新更新", "recentUpdate"),
            new SiteUrl("本月最夯", "hotComics"),
            new SiteUrl("色氣漫畫", "sexyLevel"),
            new SiteUrl("連載漫畫", "statusOngoing"),
            new SiteUrl("完結漫畫", "statusEnd"),
            new SiteUrl("愛情", "comicByCategories-1"),
            new SiteUrl("神鬼", "comicByCategories-3"),
            new SiteUrl("校園", "comicByCategories-4"),
            new SiteUrl("搞笑", "comicByCategories-5"),
            new SiteUrl("生活", "comicByCategories-6"),
            new SiteUrl("懸疑", "comicByCategories-7"),
            new SiteUrl("冒險", "comicByCategories-8"),
            new SiteUrl("職場", "comicByCategories-10"),
            new SiteUrl("魔幻", "comicByCategories-11"),
            new SiteUrl("後宮", "comicByCategories-2"),
            new SiteUrl("魔法", "comicByCategories-12"),
            new SiteUrl("格鬥", "comicByCategories-13"),
            new SiteUrl("宅男", "comicByCategories-14"),
            new SiteUrl("勵志", "comicByCategories-15"),
            new SiteUrl("耽美", "comicByCategories-16"),
            new SiteUrl("科幻", "comicByCategories-17"),
            new SiteUrl("百合", "comicByCategories-18"),
            new SiteUrl("治癒", "comicByCategories-19"),
            new SiteUrl("萌系", "comicByCategories-20"),
            new SiteUrl("熱血", "comicByCategories-21"),
            new SiteUrl("競技", "comicByCategories-22"),
            new SiteUrl("推理", "comicByCategories-23"),
            new SiteUrl("雜誌", "comicByCategories-24"),
            new SiteUrl("偵探", "comicByCategories-25"),
            new SiteUrl("偽娘", "comicByCategories-26"),
            new SiteUrl("美食", "comicByCategories-27"),
            new SiteUrl("恐怖", "comicByCategories-9"),
            new SiteUrl("四格", "comicByCategories-28"),
            new SiteUrl("社會", "comicByCategories-31"),
            new SiteUrl("歷史", "comicByCategories-32"),
            new SiteUrl("戰爭", "comicByCategories-33"),
            new SiteUrl("舞蹈", "comicByCategories-34"),
            new SiteUrl("武俠", "comicByCategories-35"),
            new SiteUrl("機戰", "comicByCategories-36"),
            new SiteUrl("音樂", "comicByCategories-37"),
            new SiteUrl("體育", "comicByCategories-40"),
            new SiteUrl("黑道", "comicByCategories-42"),
            new SiteUrl("腐女", "comicByCategories-46"),
            new SiteUrl("異世界", "comicByCategories-47"),
            new SiteUrl("驚悚", "comicByCategories-48"),
            new SiteUrl("成人", "comicByCategories-51"),
            new SiteUrl("戰鬥", "comicByCategories-54"),
            new SiteUrl("復仇", "comicByCategories-55"),
            new SiteUrl("轉生", "comicByCategories-56"),
            new SiteUrl("黑暗奇幻", "comicByCategories-57"),
            new SiteUrl("戲劇", "comicByCategories-58"),
            new SiteUrl("生存", "comicByCategories-59"),
            new SiteUrl("策略", "comicByCategories-60"),
            new SiteUrl("政治", "comicByCategories-61"),
            new SiteUrl("黑暗", "comicByCategories-62"),
            new SiteUrl("動作", "comicByCategories-64"),
            new SiteUrl("性轉換", "comicByCategories-70"),
            new SiteUrl("日常", "comicByCategories-78"),
            new SiteUrl("青春", "comicByCategories-81"),
            new SiteUrl("醫療", "comicByCategories-85"),
            new SiteUrl("致鬱", "comicByCategories-86"),
            new SiteUrl("心理", "comicByCategories-87"),
            new SiteUrl("穿越", "comicByCategories-88"),
            new SiteUrl("友情", "comicByCategories-92"),
            new SiteUrl("犯罪", "comicByCategories-93"),
            new SiteUrl("劇情", "comicByCategories-97"),
            new SiteUrl("少女", "comicByCategories-113"),
            new SiteUrl("賭博", "comicByCategories-114"),
            new SiteUrl("女性向", "comicByCategories-123"),
            new SiteUrl("溫馨", "comicByCategories-129"),
            new SiteUrl("同人", "comicByCategories-164"),
            new SiteUrl("幻想", "comicByCategories-183"),
            new SiteUrl("成長", "comicByCategories-184"),
            new SiteUrl("心裡", "comicByCategories-185"),
            new SiteUrl("溫暖", "comicByCategories-186"),
            new SiteUrl("戀愛", "comicByCategories-187"),
            new SiteUrl("奇幻", "comicByCategories-189"),
            new SiteUrl("驚愕", "comicByCategories-204"),
            new SiteUrl("懷疑", "comicByCategories-214"),
            new SiteUrl("驚訝", "comicByCategories-219"),
            new SiteUrl("同性", "comicByCategories-222"),
            new SiteUrl("驚奇", "comicByCategories-223"),
            new SiteUrl("博彩", "comicByCategories-227"),
            new SiteUrl("治療", "comicByCategories-245"),
            new SiteUrl("青年", "comicByCategories-246"),
            new SiteUrl("親情", "comicByCategories-247"),
            new SiteUrl("友誼", "comicByCategories-248"),
        ];

        site.searchList = [
            new SiteUrl("漫畫或作者", "searchComicAndAuthorQuery"),
        ];


        return site;
    }

    private combinePostParam(category: string, limit: number, offset: number, categoryId: string): string {
        let params = `{\\n    id\\n    title\\n    status\\n    year\\n    imageUrl\\n    authors {\\n      id\\n      name\\n      __typename\\n    }\\n    categories {\\n      id\\n      name\\n      __typename\\n    }\\n    dateUpdated\\n    monthViews\\n    views\\n    favoriteCount\\n    lastBookUpdate\\n    lastChapterUpdate\\n    __typename\\n  }`;
        // category = "recentUpdate"
        let post = "";
        let orderBy = "DATE_UPDATED";
        if (category === "recentUpdate" || category === "hotComics") {
            orderBy = category === "recentUpdate" ? "DATE_UPDATED" : "MONTH_VIEWS";
            post = `{"operationName":"${category}","variables":{"pagination":{"limit":${limit},"offset":${offset},"orderBy":"${orderBy}","status":"","asc":true}},"query":"query ${category}($pagination: Pagination!) {\\n  ${category}(pagination: $pagination) ${params}\\n}"}`
        } else if (category === "comicByCategories") {
            post = `{"operationName":"${category}","variables":{"categoryId":["${categoryId}"],"pagination":{"limit":${limit},"offset":${offset},"orderBy":"${orderBy}","asc":false,"status":""}},"query":"query ${category}($categoryId: [ID!]!, $pagination: Pagination!) {\\n  ${category}(categoryId: $categoryId, pagination: $pagination) ${params}\\n}"}`
        } else if (category === "sexyLevel") {
            category = "comicByCategories";
            post = `{"operationName":"${category}","variables":{"categoryId":[],"pagination":{"limit":${limit},"offset":${offset},"orderBy":"${orderBy}","asc":false,"status":"","sexyLevel":4}},"query":"query ${category}($categoryId: [ID!]!, $pagination: Pagination!) {\\n  ${category}(categoryId: $categoryId, pagination: $pagination) ${params}\\n}"}`
        } else if (category == "statusOngoing" || category == "statusEnd") {
            let status = category === "statusEnd" ? "END" : "ONGOING";
            category = "comicByCategories";
            post = `{"operationName":"${category}","variables":{"categoryId":[],"pagination":{"limit":${limit},"offset":${offset},"orderBy":"${orderBy}","asc":false,"status":"${status}"}},"query":"query ${category}($categoryId: [ID!]!, $pagination: Pagination!) {\\n  ${category}(categoryId: $categoryId, pagination: $pagination) ${params}\\n}"}`
        } else if (category === "searchComicAndAuthorQuery") {
            post = `{"operationName":"${category}","variables":{"keyword":"${categoryId}"},"query":"query ${category}($keyword: String!) {\\n  searchComicsAndAuthors(keyword: $keyword) comics${params}\\n}"}`
       post = `{"operationName":"${category}","variables":{"keyword":"${categoryId}"},"query":"query ${category}($keyword: String!) {\\n  searchComicsAndAuthors(keyword: $keyword) {\\n    comics ${params}\\n    authors {\\n      id\\n      name\\n      chName\\n      enName\\n      wikiLink\\n      comicCount\\n      views\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`
        }
        return post;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let limit = 30;
        let offset = (page - 1) * limit;
        let categoryId = "";
        let category = url;
        if (url.startsWith("comicByCategories-")) {
            let parts = url.split("-");
            category = parts[0];
            categoryId = parts[1];
        }
        let postParam = this.combinePostParam(category, limit, offset, categoryId);
        if (category === "sexyLevel" || category === "statusOngoing" || category === "statusEnd") {
            category = "comicByCategories";
        }
        let api = "https://komiic.com/api/query";
        let response = await this.client?.request({ url: api, method: "POST", body: postParam, contentType: "application/json" });

        try {
            let jsonContent = response.body;
            let json = JSON.parse(jsonContent);
            let comicList = json.data[category];
            let details: ExtensionDetail[] = [];
            comicList.forEach((comic: any) => {
                let id = comic.id;
                let title = comic.title;
                let author = comic.authors.map((a: any) => a.name).join(", ");
                let category = comic.categories.map((c: any) => c.name).join(", ");
                let status = comic.status;
                let thumbnail = comic.imageUrl;
                let detailUrl = this.site.baseUrl + "/comic/" + id;
                let detail = new ExtensionDetail(id, detailUrl, title);
                let lastBookUpdate = comic.lastBookUpdate;
                let lastChapterUpdate = comic.lastChapterUpdate;
                let description = "";
                if (lastChapterUpdate) {
                    description = `${lastChapterUpdate}話`;
                }
                if (lastBookUpdate.length > 0) {
                    description += ` | ${lastBookUpdate}卷`
                }
                detail.author = author;
                detail.category = category;
                detail.status = status;
                detail.thumbnail = thumbnail;
                detail.type = MediaType.Picture;
                detail.hasChapter = true;
                detail.description = description;

                details.push(detail);
            });
            let nextApi = details.length >= limit ? url : undefined
            return new ExtensionList(details, page, nextApi);
        } catch (e) {
            console.log("requestItemList parse json error:", e);
        }
        return new ExtensionList([], page, undefined);

    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let postParam = this.combinePostParam(url, 0, 0, keyword);
        let api = "https://komiic.com/api/query";
        let response = await this.client?.request({ url: api, method: "POST", body: postParam, contentType: "application/json" });

        try {
            let jsonContent = response.body;
            console.log("searchItemList response:", jsonContent);
            let json = JSON.parse(jsonContent);
            let comicList = json.data.searchComicsAndAuthors.comics;
            let details: ExtensionDetail[] = [];
            comicList.forEach((comic: any) => {
                let id = comic.id;
                let title = comic.title;
                let author = comic.authors.map((a: any) => a.name).join(", ");
                let category = comic.categories.map((c: any) => c.name).join(", ");
                let status = comic.status;
                let thumbnail = comic.imageUrl;
                let detailUrl = this.site.baseUrl + "/comic/" + id;
                let detail = new ExtensionDetail(id, detailUrl, title);
                let lastBookUpdate = comic.lastBookUpdate;
                let lastChapterUpdate = comic.lastChapterUpdate;
                let description = "";
                if (lastChapterUpdate) {
                    description = `${lastChapterUpdate}話`;
                }
                if (lastBookUpdate.length > 0) {
                    description += ` | ${lastBookUpdate}卷`
                }
                detail.author = author;
                detail.category = category;
                detail.status = status;
                detail.thumbnail = thumbnail;
                detail.type = MediaType.Picture;
                detail.hasChapter = true;
                detail.description = description;

                details.push(detail);
            });
            return new ExtensionList(details, page, undefined);
        } catch (e) {
            console.log("requestItemList parse json error:", e);
        }
        return new ExtensionList([], page, undefined);

    }

    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let postParam = `{"operationName":"comicDetailedInfo","variables":{"comicId":"${id}"},"query":"query comicDetailedInfo($comicId: ID!) {\\n  comicById(comicId: $comicId) {\\n   title\\n    description\\n   status\\n    year\\n    imageUrl\\n    authors {\\n      id\\n      name\\n      __typename\\n    }\\n    categories {\\n      id\\n      name\\n   }    ntr\\n   lastBookUpdate\\n    lastChapterUpdate\\n    __typename\\n  }\\n}"}`;
        let api = "https://komiic.com/api/query";
        let response = await this.client?.request({ url: api, method: "POST", body: postParam, contentType: "application/json" });

        let chapterParam = `{"operationName":"chapterByComicId","variables":{"comicId":"${id}"},"query":"query chapterByComicId($comicId: ID!) {\\n  chaptersByComicId(comicId: $comicId) {\\n    id\\n    serial\\n    type\\n    dateCreated\\n    dateUpdated\\n    size\\n    __typename\\n  }\\n}"}`;
        let chapterResponse = await this.client?.request({ url: api, method: "POST", body: chapterParam, contentType: "application/json" });

        try {
            let jsonContent = response.body;
            let json = JSON.parse(jsonContent);
            let comic = json.data.comicById;
            let title = comic.title;
            let description = comic.description;
            let author = comic.authors.map((a: any) => a.name).join(", ");
            let category = comic.categories.map((c: any) => c.name).join(", ");
            let status = comic.status;
            let thumbnail = comic.imageUrl;
            let detailUrl = this.site.baseUrl + "/comic/" + id;

            let chapterContent = chapterResponse.body;
            let chapterJson = JSON.parse(chapterContent);
            let chapterList = chapterJson.data.chaptersByComicId;
            let chapters: ItemChapter[] = [];
            let chapterv: ItemChapter[] = [];

            // https://komiic.com/comic/2791/chapter/88006/images/all
            chapterList.forEach((chapter: any) => {
                let chapterId = chapter.id;
                let type = chapter.type;
                let chapterTitle = type === "chapter" ? `第${chapter.serial}話` : `第${chapter.serial}卷`;
                let chapterUrl = this.site.baseUrl + `/comic/${id}/chapter/${chapterId}/images/all`;
                let itemChapter = new ItemChapter(chapterId, chapterUrl, chapterTitle);
                if (type === "book") {
                    chapterv.push(itemChapter);
                } else {
                    chapters.push(itemChapter);
                }
            });

            let detail = new ExtensionDetail(id, detailUrl, title);
            detail.author = author;
            detail.category = category;
            detail.status = status;
            detail.thumbnail = thumbnail;
            detail.type = MediaType.Picture;
            detail.description = description;
            let volumes: ItemVolume[] = [];
            if (chapters.length > 0) {
                let volume = new ItemVolume("話", chapters);
                volumes.push(volume);
            }
            if (chapterv.length > 0) {
                let volume = new ItemVolume("卷", chapterv);
                volumes.push(volume);
            }
            detail.volumes = volumes;
            return detail;
        } catch (e) {
            console.log("requestItemChapter parse json error:", e);
        }
        return new ExtensionDetail("-1", url, "");
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let postParam = `{"operationName":"imagesByChapterId","variables":{"chapterId":"${id}"},"query":"query imagesByChapterId($chapterId: ID!) {\\n  imagesByChapterId(chapterId: $chapterId) {\\n    id\\n    kid\\n    height\\n    width\\n    __typename\\n  }\\n}"}`;
    
        let api = "https://komiic.com/api/query";
        let response = await this.client?.request({ url: api, method: "POST", body: postParam, contentType: "application/json" });
        try {
            let jsonContent = response.body;
            let json = JSON.parse(jsonContent);
            let imageList = json.data.imagesByChapterId;
            let images: string[] = [];
            imageList.forEach((image: any) => {
                let kid = image.kid;
                // https://komiic.com/api/image/b08f21ec-9f9c-4af0-ba90-4e03bf6ef513
                let imageUrl = `https://komiic.com/api/image/${kid}`;
                images.push(imageUrl);
            });
            let media = new PictureMedia(id, "", images);
            media.refer = url;
            return media;
        }catch (e) {
            console.log("requestItemMedia parse json error:", e);
        }
        return new PictureMedia("-1", "", []);
    }
}

(function () {
    const komiic = new Komiic();
    komiic.init();
})();
export default Komiic;