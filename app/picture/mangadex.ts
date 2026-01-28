import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, ItemChapter, PictureMedia, MediaType, ItemVolume } from '@/core/extension';
import { formatDateToYMD } from '@/utils/date';

class Mangadex extends Rule {

    provideExtensionInfo(): Extension {
        let site = new Extension("mangadex", "MangaDex", MediaType.Picture);
        site.baseUrl = "https://api.mangadex.org";
        site.description = "Read comics and manga online at MangaDex, with high quality images and support creators and translators!"
        site.thumbnail = "https://mangadex.org/pwa/icons/icon-180.png";
        site.lang = "en";
        site.categoryList = [
            new SiteUrl("All", "includedTags[]"),
            new SiteUrl("4-Koma", "includedTags[]=87cc87cd-a395-47af-b27a-93258283bbc6"),
            new SiteUrl("Adaptation", "includedTags[]=f4122d1c-3b44-44d0-9936-ff7502c39ad3"),
            new SiteUrl("Anthology", "includedTags[]=51d83883-4103-437c-b4b1-731cb73d786c"),
            new SiteUrl("Award Winning", "includedTags[]=0a39b5a1-b235-4886-a747-1d05d216532d"),
            new SiteUrl("Doujinshi", "includedTags[]=b13b2a48-c720-44a9-9c77-39c9979373fb"),
            new SiteUrl("Fan Colored", "includedTags[]=7b2ce280-79ef-4c09-9b58-12b7c23a9b78"),
            new SiteUrl("Full Color", "includedTags[]=f5ba408b-0e7a-484d-8d49-4e9125ac96de"),
            new SiteUrl("Long Strip", "includedTags[]=3e2b8dae-350e-4ab8-a8ce-016e844b9f0d"),
            new SiteUrl("Official Colored", "includedTags[]=320831a8-4026-470b-94f6-8353740e6f04"),
            new SiteUrl("Oneshot", "includedTags[]=0234a31e-a729-4e28-9d6a-3f87c4966b9e"),
            new SiteUrl("Self-Published", "includedTags[]=891cf039-b895-47f0-9229-bef4c96eccd4"),
            new SiteUrl("Web Comic", "includedTags[]=e197df38-d0e7-43b5-9b09-2842d0c326dd"),

            new SiteUrl("Action", "includedTags[]=391b0423-d847-456f-aff0-8b0cfc03066b"),
            new SiteUrl("Adventure", "includedTags[]=87cc87cd-a395-47af-b27a-93258283bbc6"),
            new SiteUrl("Boys' Love", "includedTags[]=5920b825-4181-4a17-beeb-9918b0ff7a30"),
            new SiteUrl("Comedy", "includedTags[]=4d32cc48-9f00-4cca-9b5a-a839f0764984"),
            new SiteUrl("Crime", "includedTags[]=5ca48985-9a9d-4bd8-be29-80dc0303db72"),
            new SiteUrl("Drama", "includedTags[]=b9af3a63-f058-46de-a9a0-e0c13906197a"),
            new SiteUrl("Fantasy", "includedTags[]=cdc58593-87dd-415e-bbc0-2ec27bf404cc"),
            new SiteUrl("Girls' Love", "includedTags[]=a3c67850-4684-404e-9b7f-c69850ee5da6"),
            new SiteUrl("Historical", "includedTags[]=33771934-028e-4cb3-8744-691e866a923e"),
            new SiteUrl("Horror", "includedTags[]=cdad7e68-1419-41dd-bdce-27753074a640"),
            new SiteUrl("Isekai", "includedTags[]=ace04997-f6bd-436e-b261-779182193d3d"),
            new SiteUrl("Magical Girls", "includedTags[]=81c836c9-914a-4eca-981a-560dad663e73"),
            new SiteUrl("Mecha", "includedTags[]=50880a9d-5440-4732-9afb-8f457127e836"),
            new SiteUrl("Medical", "includedTags[]=c8cbe35b-1b2b-4a3f-9c37-db84c4514856"),
            new SiteUrl("Mystery", "includedTags[]=ee968100-4191-4968-93d3-f82d72be7e46"),
            new SiteUrl("Philosophical", "includedTags[]=b1e97889-25b4-4258-b28b-cd7f4d28ea9b"),
            new SiteUrl("Psychological", "includedTags[]=3b60b75c-a2d7-4860-ab56-05f391bb889c"),
            new SiteUrl("Romance", "includedTags[]=423e2eae-a7a2-4a8b-ac03-a8351462d71d"),
            new SiteUrl("Sci-Fi", "includedTags[]=256c8bd9-4904-4360-bf4f-508a76d67183"),
            new SiteUrl("Slice of Life", "includedTags[]=e5301a23-ebd9-49dd-a0cb-2add944c7fe9"),
            new SiteUrl("Sports", "includedTags[]=69964a64-2f90-4d33-beeb-f3ed2875eb4c"),
            new SiteUrl("Superhero", "includedTags[]=7064a261-a137-4d3a-8848-2d385de3a99c"),
            new SiteUrl("Thriller", "includedTags[]=07251805-a27e-4d59-b488-f0bfbec15168"),
            new SiteUrl("Tragedy", "includedTags[]=f8f62932-27da-4fe4-8ee1-6779a8c5edba"),
            new SiteUrl("Wuxia", "includedTags[]=acc803a4-c95a-4c22-86fc-eb6b582d82a2"),

            new SiteUrl("Aliens", "includedTags[]=e64f6742-c834-471d-8d72-dd51fc02b835"),
            new SiteUrl("Animals", "includedTags[]=3de8c75d-8ee3-48ff-98ee-e20a65c86451"),
            new SiteUrl("Cooking", "includedTags[]=ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869"),
            new SiteUrl("Crossdressing", "includedTags[]=9ab53f92-3eed-4e9b-903a-917c86035ee3"),
            new SiteUrl("Delinquents", "includedTags[]=da2d50ca-3018-4cc0-ac7a-6b7d472a29ea"),
            new SiteUrl("Demons", "includedTags[]=39730448-9a5f-48a2-85b0-a70db87b1233"),
            new SiteUrl("Genderswap", "includedTags[]=2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a"),
            new SiteUrl("Ghosts", "includedTags[]=3bb26d85-09d5-4d2e-880c-c34b974339e9"),
            new SiteUrl("Gyaru", "includedTags[]=fad12b5e-68ba-460e-b933-9ae8318f5b65"),
            new SiteUrl("Harem", "includedTags[]=65761a2a-415e-47f3-bef2-a9dababba7a6"),
            new SiteUrl("Incest", "includedTags[]=5bd0e105-4481-44ca-b6e7-7544da56b1a3"),
            new SiteUrl("Loli", "includedTags[]=2d1f5d56-a1e5-4d0d-a961-2193588b08ec"),
            new SiteUrl("Mafia", "includedTags[]=85daba54-a71c-4554-8a28-9901a8b0afad"),
            new SiteUrl("Magic", "includedTags[]=a1f53773-c69a-4ce5-8cab-fffcd90b1565"),
            new SiteUrl("Martial Arts", "includedTags[]=799c202e-7daa-44eb-9cf7-8a3c0441531e"),
            new SiteUrl("Military", "includedTags[]=ac72833b-c4e9-4878-b9db-6c8a4a99444a"),
            new SiteUrl("Monster Girls", "includedTags[]=dd1f77c5-dea9-4e2b-97ae-224af09caf99"),
            new SiteUrl("Monsters", "includedTags[]=36fd93ea-e8b8-445e-b836-358f02b3d33d"),
            new SiteUrl("Music", "includedTags[]=f42fbf9e-188a-447b-9fdc-f19dc1e4d685"),
            new SiteUrl("Ninja", "includedTags[]=489dd859-9b61-4c37-af75-5b18e88daafc"),
            new SiteUrl("Office Workers", "includedTags[]=92d6d951-ca5e-429c-ac78-451071cbf064"),
            new SiteUrl("Police", "includedTags[]=df33b754-73a3-4c54-80e6-1a74a8058539"),
            new SiteUrl("Post-Apocalyptic", "includedTags[]=9467335a-1b83-4497-9231-765337a00b96"),
            new SiteUrl("Reincarnation", "includedTags[]=0bc90acb-ccc1-44ca-a34a-b9f3a73259d0"),
            new SiteUrl("Reverse Harem", "includedTags[]=65761a2a-415e-47f3-bef2-a9dababba7a6"),
            new SiteUrl("Samurai", "includedTags[]=81183756-1453-4c81-aa9e-f6e1b63be016"),
            new SiteUrl("School Life", "includedTags[]=caaa44eb-cd40-4177-b930-79d3ef2afe87"),
            new SiteUrl("Shota", "includedTags[]=ddefd648-5140-4e5f-ba18-4eca4071d19b"),
            new SiteUrl("Supernatural", "includedTags[]=eabc5b4c-6aff-42f3-b657-3e90cbd00b75"),
            new SiteUrl("Survival", "includedTags[]=5fff9cde-849c-4d78-aab0-0d52b2ee1d25"),
            new SiteUrl("Time Travel", "includedTags[]=292e862b-2d17-4062-90a2-0356caa4ae27"),
            new SiteUrl("Traditional Games", "includedTags[]=31932a7e-5b8e-49a6-9f12-2afa39dc544c"),
            new SiteUrl("Vampires", "includedTags[]=d7d1730f-6eb0-4ba6-9437-602cac38664c"),
            new SiteUrl("Video Games", "includedTags[]=9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8"),
            new SiteUrl("Villainess", "includedTags[]=d14322ac-4d6f-4e9b-afd9-629d5f4d8a41"),
            new SiteUrl("Virtual Reality", "includedTags[]=8c86611e-fab7-4986-9dec-d1a2f44acdd5"),
            new SiteUrl("Zombies", "includedTags[]=631ef465-9aba-4afb-b0fc-ea10efe274a8"),

            new SiteUrl("Gore", "includedTags[]=b29d6a3d-1569-4e7a-8caf-7557bc92cd5d"),
            new SiteUrl("Sexual Violence", "includedTags[]=97893a4c-12af-4dac-b6be-0dffb353568e"),
        ];
        site.searchList = [
            new SiteUrl("Search By Title", "/manga?includes[]=cover_art&includes[]=author&title={keyword}&limit=50&offset={offset}"),
        ];
        site.configParams = [
            { key: "language", value: "Language" },
            { key: "display", value: "Display Language Order" }
        ]

        site.useGuide = `## How to set MangaDex Language Filter
1. Go to Extension Config Setting dialog.
3. In Language field, input language codes separated by comma.
4. Supported language codes, [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes#External_links),for example:
   - ja : Japanese
   - zh : Chinese (Simplified)
   - zh-hk : Chinese (Traditional)
   - en : English
   - ko : Korean
5. Multiple language codes can be set, for example: ja,zh,zh-hk,en
5. Save the configuration and restart the extension to take effect.

## MangaDex Display Language Order

MangaDex support setting display language order, you can set the order of preference for manga languages.
For example, if you set "en,ja,zh", the extension will try to get manga in English first, if not available, then Japanese, then Chinese.
You can set multiple language codes separated by comma to set your preferred order.
`;
        return site;
    }

    language = "";
    displayOrder: string[] = ["en", "ja", "zh", "zh-hk"];

    override async config(form: Map<string, string>): Promise<boolean> {
        if (form.has("language")) {
            let lang = form.get("language")?.toLowerCase();
            let langs = lang?.split(",");
            if (langs && langs.length > 0) {
                this.language = "";

                // if langs contain "zh", but not "zh-hk", add "zh-hk" to the last.
                if (langs.indexOf("zh") >= 0 && langs.indexOf("zh-hk") < 0) {
                    langs.push("zh-hk");
                }

                if (langs.indexOf("zh-hk") >= 0 && langs.indexOf("zh") < 0) {
                    langs.push("zh");
                }

                // if langs don't contain "en", add "en" to the last.
                if (langs.indexOf("en") < 0) {
                    langs.push("en");
                }
                
                langs.forEach(l => {
                    if (this.language.length > 0) {
                        this.language += "&";
                    }
                    this.language += `originalLanguage[]=${l}`;
                });
            }
        }
        if (form.has("display")) {
            let display = form.get("display")?.toLowerCase();
            if (display) {
                this.displayOrder = display.split(",");
            }
            // if display order contains "zh", but not "zh-hk", add "zh-hk" to the last.
            if (this.displayOrder.indexOf("zh") >= 0 && this.displayOrder.indexOf("zh-hk") < 0) {
                this.displayOrder.push("zh-hk");
            }

            if (this.displayOrder.indexOf("zh-hk") >= 0 && this.displayOrder.indexOf("zh") < 0) {
                this.displayOrder.push("zh");
            }

            // add "en" to the last if not exists.
            if (this.displayOrder.indexOf("en") < 0) {
                this.displayOrder.push("en");
            }

        }
        return true;
    }

    private parseItemDetails(dataList: any): ExtensionDetail[] {
        let items: ExtensionDetail[] = [];
        dataList.forEach((dataItem: any) => {
            let id = dataItem.id;
            let titleEn: string = "";
            const langCodes = Object.keys(dataItem.attributes.title);
            if (langCodes.length > 0) {
                const firstLangCode = langCodes[0];
                titleEn = dataItem.attributes.title[firstLangCode];
            }

            let title = "";
            this.displayOrder.forEach(lang => {
                if (lang === "en" && titleEn) {
                    title = titleEn;
                    return;
                } else if (dataItem.attributes.altTitles[lang]) {
                    title = dataItem.attributes.altTitles[lang];
                    return;
                }
            });
            if (title.length == 0) {
                title = titleEn ? titleEn : "No Title";
            }

            let description = "";
            this.displayOrder.forEach(lang => {
                if (dataItem.attributes.description[lang]) {
                    description = dataItem.attributes.description[lang];
                }
            });
            if (description.length == 0) {
                const langCodes = Object.keys(dataItem.attributes.description);
                if (langCodes.length > 0) {
                    const firstLangCode = langCodes[0];
                    description = dataItem.attributes.description[firstLangCode];
                }
            }

            let status = dataItem.attributes.status;
            let tags = dataItem.attributes.tags.map((tagItem: any) => tagItem.attributes.name.en);
            let tag = tags.join(",");

            let date = formatDateToYMD(dataItem.attributes.createdAt);

            let relationships = dataItem.relationships;

            let coverUrl = "";
            let author = "";

            relationships.forEach((relItem: any) => {
                if (relItem.type === "cover_art") {
                    let fileName = relItem.attributes.fileName;
                    coverUrl = `https://uploads.mangadex.org/covers/${id}/${fileName}.256.jpg`;
                } else if (relItem.type === "author" && author.length == 0 && relItem.attributes) {
                    author = relItem.attributes.name;
                }
            });
            let link = `https://api.mangadex.org/manga/${id}/feed`;

            let item = new ExtensionDetail(id, link, title);
            item.thumbnail = coverUrl;
            item.description = description;
            item.category = tag;
            item.author = author;
            item.status = `${status}\n${date}`;
            item.hasChapter = true;
            item.type = MediaType.Picture;
            items.push(item);
        });
        return items;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let api = this.site.baseUrl + "/manga" + "?includes[]=cover_art&includes[]=author&order[latestUploadedChapter]=desc";
        if (this.language && this.language.length > 0) {
            api += `&${this.language}`;
        }
        let categoryUrl = `&` + url;
        if (url === "includedTags[]") {
            categoryUrl = "";
        }
        let currentApi = api + `${categoryUrl}&limit=50&offset=${(page - 1) * 50}`;
        let response = await this.client?.request({ url: currentApi, method: "GET" });

        try {
            let json = JSON.parse(response.body);
            let dataList = json.data;

            if (!dataList || dataList.length == 0) {
                return new ExtensionList([], page, undefined);
            }

            let items = this.parseItemDetails(dataList);

            let total = json.total;
            let limit = json.limit;
            let offset = json.offset;
            let hasMore = (offset + limit) < total;

            let nextApi = api + `&${url}&limit=50&offset=${(page) * 50}`;
            let nextPage = hasMore ? nextApi : undefined;
            return new ExtensionList(items, page, nextPage);
        } catch (e) {
            console.error("Mangadex requestItemList parse json error:", e);
            return new ExtensionList([], page, undefined);
        }
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let offset = (page - 1) * 50;
        let searchUrl = this.site.baseUrl + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{offset}", offset.toString());

        let response = await this.client?.request({ url: searchUrl, method: "GET" });
        try {
            let json = JSON.parse(response.body);
            let dataList = json.data;

            if (!dataList || dataList.length == 0) {
                return new ExtensionList([], page, undefined);
            }

            let items = this.parseItemDetails(dataList);

            let total = json.total;
            let limit = json.limit;
            let offset = json.offset;
            let hasMore = (offset + limit) < total;

            offset = page * 50;
            let nextApi = this.site.baseUrl + url.replace("{keyword}", encodeURIComponent(keyword)).replace("{offset}", offset.toString());
            let nextPage = hasMore ? nextApi : undefined;
            return new ExtensionList(items, page, nextPage);
        } catch (e) {
            console.error("Mangadex searchItemList parse json error:", e);
            return new ExtensionList([], page, undefined);
        }

    }

    private findVolumes(volumes: ItemVolume[], volumeName: string): ItemVolume {
        let findVolume: ItemVolume | undefined = undefined;
        for (let i = 0; i < volumes.length; i++) {
            if (volumes[i].name === volumeName) {
                findVolume = volumes[i];
                break;
            }
        }
        if (findVolume === undefined) {
            findVolume = new ItemVolume(volumeName, []);
            volumes.push(findVolume);
        }
        return findVolume;
    }


    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let limit = 100;
        let api = `https://api.mangadex.org/manga/${id}/feed?order[volume]=asc&order[chapter]=asc&limit=${limit}`;

        let offset = 0;
        let hasMoreChapters = true;
        let detail = new ExtensionDetail(id, url, "");
        let volumes: ItemVolume[] = [];

        while (hasMoreChapters) {
            let requestApi = api + `&offset=${offset}`;
            let response = await this.client?.request({ url: requestApi, method: "GET" });

            try {
                let json = JSON.parse(response.body);
                let dataList = json.data;
                dataList.forEach((dataItem: any) => {
                    let attributes = dataItem.attributes;
                    let volumeNum = attributes.volume;
                    let volumeName = volumeNum ? `vol.${volumeNum}` : "No Volume";
                    let volume = this.findVolumes(volumes, volumeName);

                    let chapterId = dataItem.id;
                    // https://api.mangadex.org/at-home/server/:chapterId
                    let chapterUrl = `https://api.mangadex.org/at-home/server/${chapterId}`;
                    let lang = attributes.translatedLanguage;
                    let chapterNum = attributes.chapter;
                    let chapterName = attributes.title;
                    let chapterTitle = `ch.${chapterNum}`;
                    if (lang && lang != "en") {
                        chapterTitle = `[${lang}]` + chapterTitle;
                    }
                    if (chapterName && chapterName.length > 0) {
                        chapterTitle += ` - ${chapterName}`;
                    }
                    let chapter = new ItemChapter(chapterId, chapterUrl, chapterTitle);
                    volume.chapters.push(chapter);
                });

                let total = json.total;
                if (offset + limit >= total) {
                    hasMoreChapters = false;
                } else {
                    hasMoreChapters = true;
                    offset += limit;
                }
            } catch (e) {
                hasMoreChapters = false;
                console.error("Mangadex requestItemChapter parse json error:", e);
            }
        }

        detail.volumes = volumes;
        return detail;
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        // url: https://api.mangadex.org/at-home/server/:chapterId
        let api = `https://api.mangadex.org/at-home/server/${id}`;
        let response = await this.client?.request({ url: api, method: "GET" });
        try {
            let json = JSON.parse(response.body);
            let baseUrl = json.baseUrl;
            let chapterData = json.chapter;
            let hash = chapterData.hash;
            let data_splice = "data-saver"
            let data = chapterData.dataSaver; // array of image file names
            if (data.length == 0) {
                data = chapterData.data;
                data_splice = "data";
            }

            let imageUrls: string[] = [];
            data.forEach((fileName: string) => {
                let imageUrl = `${baseUrl}/${data_splice}/${hash}/${fileName}`;
                imageUrls.push(imageUrl);
            });

            let media = new PictureMedia(id, "", imageUrls);
            return media;
        } catch (e) {
            console.error("Mangadex requestItemMedia parse json error:", e);
            return new PictureMedia("-1", "", []);
        }
    }

}

(function () {
    // Register extension.
    let rule = new Mangadex();
    rule.init();
})();

export default Mangadex;