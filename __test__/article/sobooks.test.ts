import Sobooks from "@app/article/sobooks";
import { RuleJest } from "./../core";
import { ArticleMedia, MediaType } from "@/core/extension";

describe('sobooks', () => {

    const sobooksTest = new RuleJest(new Sobooks());

    it('should provide extension info', () => {
        const info = sobooksTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("sobooks");
        expect(info.name).toBe("SOBooks");
        expect(info.type).toBe(MediaType.Article);
    });

    it('should request item list', async () => {
        const url = "/";
        const page = 1;
        const list = await sobooksTest.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.hasChapter).toBe(false);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).toBeDefined();
    });

    it('request item media', async () => {
        const url = "https://sobooks.cc/books/23511.html";
        const id = "23511";
        const media = await sobooksTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(ArticleMedia);
        let articleMedia = media as ArticleMedia;
        expect(articleMedia.id).toBe(id);
        expect(articleMedia.content.length).toBeGreaterThan(0);
        expect(articleMedia.title).toBe('1517：全球视野下的“奇迹之年”');
    });
});
