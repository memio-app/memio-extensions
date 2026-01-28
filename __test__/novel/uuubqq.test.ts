import Uuubqq from "@app/novel/uuubqq";
import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";

describe('uuubqq', () => {

    const uuubqqTest = new RuleJest(new Uuubqq());

    it('should provide extension info', () => {
        const info = uuubqqTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("uuubqq");
        expect(info.name).toBe("顶点小说网");
        expect(info.type).toBe(MediaType.Novel);
    });

    it.only('should request item list', async () => {
        const url = "/full";
        const page = 1;
        const list = await uuubqqTest.requestItemList(url, page);
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

    it('should request item chapter', async () => {
        const url = "https://www.uuubqq.cc/29749_29749368/";
        const id = "29749_29749368";
        const detail = await uuubqqTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBe('从前有座镇魔碑');
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

    it('request item media', async () => {
        const url = "https://www.uuubqq.cc/29749_29749368/46200004.html";
        const id = "46200004";
        const media = await uuubqqTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBe('第855章 混沌之火');
    });
});
