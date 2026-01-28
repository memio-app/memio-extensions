import Komiic from "@app/picture/komiic";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('komiic', () => {

    const komiicTest = new RuleJest(new Komiic());

    it('should provide extension info', () => {
        const info = komiicTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("komiic");
        expect(info.name).toBe("Komiic漫畫");
        expect(info.type).toBe(MediaType.Picture);
    });

    it.only('should request item list', async () => {
        const url = "recentUpdate";
        const page = 1;
        const list = await komiicTest.requestItemList(url, page);
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
    }, 120000);

    it('should search item', async () => {
        const keyword = "戀愛";
        const url = `searchComicAndAuthorQuery`;
        const page = 1;
        const list = await komiicTest.searchItemList(keyword, url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    }, 120000);

    it('should request item chapter', async () => {
        const url = "https://komiic.com/comic/2791";
        const id = "2791";
        const detail = await komiicTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 120000);

    it('request item media', async () => {
        const url = "https://komiic.com/comic/2791/chapter/88006/images/all";
        const id = "88006";
        const media = await komiicTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
    }, 120000);

});
