import FreeComputerBooks from "@app/article/freecomputerbooks";
import { RuleJest } from "./../core";
import { ArticleMedia, MediaType } from "@/core/extension";

describe('freecomputerbooks', () => {

    const freecomputerbooksTest = new RuleJest(new FreeComputerBooks());

    it('should provide extension info', () => {
        const info = freecomputerbooksTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("freecomputerbooks");
        expect(info.name).toBe("FreeComputerBooks");
        expect(info.type).toBe(MediaType.Article);
    });

    it('should request item list', async () => {
        const url = "mobileAndroidProgrammingBooks.html";
        const page = 1;
        const list = await freecomputerbooksTest.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.hasChapter).toBe(false);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).toBeUndefined();
    });

    it.only('request item media', async () => {
        const url = "https://freecomputerbooks.com/Android-Cookbook.html";
        const id = "Android-Cookbook";
        const media = await freecomputerbooksTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(ArticleMedia);
        let articleMedia = media as ArticleMedia;
        expect(articleMedia.id).toBe(id);
        expect(articleMedia.content.length).toBeGreaterThan(0);
        expect(articleMedia.title).toBe('Android Cookbook: Problems and Solutions for Android Developers');
    });
});
