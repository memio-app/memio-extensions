import Xbookcn from "@app/novel/xbookcn";
import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";

describe('xbookcn', () => {

    const xbookcnTest = new RuleJest(new Xbookcn());

    it('should provide extension info', () => {
        const info = xbookcnTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("xbookcn");
        expect(info.name).toBe("中文成人文學網");
        expect(info.type).toBe(MediaType.Novel);
    });

    it('should request short story list', async () => {
        const url = "https://blog.xbookcn.net/";
        const page = 1;
        const list = await xbookcnTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.hasChapter).toBe(false);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).toBeDefined();
    });

    it('should request novel list', async () => {
        const url = "https://book.xbookcn.net/p/popular.html";
        const page = 1;
        const list = await xbookcnTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).toBeUndefined();
    });

    it('should request item chapter', async () => {
        const url = "https://book.xbookcn.net/search/label/%E6%88%91%E7%9A%84%E5%A5%B3%E5%85%92%E5%9C%8B%E5%82%B3%E5%A5%87";
        const id = "%E6%88%91%E7%9A%84%E5%A5%B3%E5%85%92%E5%9C%8B%E5%82%B3%E5%A5%87";
        const detail = await xbookcnTest.requestItemChapter(url, id);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBe('我的女兒國傳奇');
        expect(detail.author).toBeDefined();
        expect(detail.description).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    });

    it('request short story media', async () => {
        const url = "https://blog.xbookcn.net/2024/04/0424.html";
        const id = "2024/04/0424";
        const media = await xbookcnTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBeDefined();
    });

    it('request novel media', async () => {
        const url = "https://book.xbookcn.net/2024/04/1_25.html";
        const id = "2024/04/1_25";
        const media = await xbookcnTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBeDefined();
    });
});
