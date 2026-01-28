import Shukuge from "@app/novel/shukuge";
import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";

describe('shukuge', () => {

    const shukugeTest = new RuleJest(new Shukuge());

    it('should provide extension info', () => {
        const info = shukugeTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("shukuge");
        expect(info.name).toBe("365Book");
        expect(info.type).toBe(MediaType.Novel);
    });

    it('should request item list', async () => {
        const url = "http://www.shukuge.com/new/";
        const page = 1;
        const list = await shukugeTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).toBe('http://www.shukuge.com/new/2');
    });

    it('should search item', async () => {
        const keyword = "魔法";
        const url = `http://www.shukuge.com/Search?wd=`;
        const page = 1;
        const list = await shukugeTest.searchItemList(keyword, url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.hasChapter).toBe(true);
            expect(item.author).toBeDefined();
        });
        expect(list.items.length).toBeGreaterThan(0);
    });

    it('should request item chapter', async () => {
        const url = "http://www.shukuge.com/book/143932/";
        const id = "143932";
        const detail = await shukugeTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBe('魔法！');
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
                console.log(c);
            });
        });
    });

    it('request item media', async () => {
        const url = "http://www.shukuge.com/book/143932/45477921.html";
        const id = "45477921";
        const media = await shukugeTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        console.log(novelMedia);
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBe('1.网购到的魔法书，居然是假货');
    });
});
