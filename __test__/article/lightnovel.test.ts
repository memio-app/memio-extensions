import { RuleJest } from "./../core";
import { MediaType, ArticleMedia } from "@/core/extension";
import LightNovel from "@app/article/lightnovel";

describe("LightNovel", () => {
    const lightNovelTest = new RuleJest(new LightNovel());

    it("should provide extension info", () => {
        const info = lightNovelTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.baseUrl).toBe("https://www.lightnovel.fun");
        expect(info.key).toBe("lightnovel");
        expect(info.name).toBe("轻之国度");
        expect(info.type).toBe(MediaType.Article);
        expect(info.categoryList.length).toBeGreaterThan(0);
    });

    it.only("explore should request item list", async () => {
        const url = encodeURIComponent(`parent_gid=1&gid=0`);
        const page = 1;
        const list = await lightNovelTest.requestItemList(url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach((item) => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
        });
    });

    it("should get item detail", async () => {

        const media = await lightNovelTest.requestItemMedia("https://www.lightnovel.fun/cn/detail/1142026", "1142026");
        
        expect(media).toBeInstanceOf(ArticleMedia);
        console.log(media);
        let articleMedia = media as ArticleMedia;
        expect(articleMedia).toBeDefined();
        expect(articleMedia.id).toBe("1142026");
        expect(articleMedia.title).toBeDefined();
        expect(articleMedia.content.length).toBeGreaterThan(0);
        expect(articleMedia.date).toBeDefined();
    });

});
