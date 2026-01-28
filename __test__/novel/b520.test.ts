import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";
import B520 from "@app/novel/b520";

describe('b520', () => {

    const b520Test = new RuleJest(new B520());

    it('should provide extension info', () => {
        const info = b520Test.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("b520");
        expect(info.name).toBe("笔趣阁520");
        expect(info.type).toBe(MediaType.Novel);
    });

    it('should request item list', async () => {
        const url = "/tongrenxiaoshuo";
        const page = 1;
        const list = await b520Test.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    });

    it.only('should request item chapter', async () => {
        const url = "http://www.b520.cc/193_193307/";
        const id = "193_193307";
        const detail = await b520Test.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBe('钻石王牌之新投手');
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            console.log(v);
            console.log(v.chapters.length);
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    });

    it('search item list', async () => {
        const keyword = "都市";
        const url = `http://www.b520.cc/modules/article/search.php?searchkey={keyword}`;
        const page = 1;
        const list = await b520Test.searchItemList(keyword,url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    });

    it('request item media', async () => {
        const url = "http://www.b520.cc/193_193307/188391991.html";
        const id = "188391991";
        const media = await b520Test.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBe('第三十一章 明治神宫大会结束与引退赛');
    });
});
