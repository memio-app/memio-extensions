import Xmanhua from "@app/picture/xmanhua";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('xmanhua', () => {

    const xmanhuaTest = new RuleJest(new Xmanhua());

    it('should provide extension info', () => {
        const info = xmanhuaTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("xmanhua");
        expect(info.name).toBe("X漫畫");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "/manga-list-0-0-2-p{page}/";
        const page = 1;
        const list = await xmanhuaTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    }, 120000);

    it('should search item', async () => {
        const keyword = "戀愛";
        const url = `search?title={keyword}&page={page}`;
        const page = 1;
        const list = await xmanhuaTest.searchItemList(keyword, url, page);
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
        const url = "https://www.xmanhua.com/1xm/";
        const id = "1xm";
        const detail = await xmanhuaTest.requestItemChapter(url, id);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 120000);

    it('request item media', async () => {
        const url = "https://www.xmanhua.com/m134056/";
        const id = "m134056";
        const media = await xmanhuaTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBeDefined();
    }, 120000);

});
