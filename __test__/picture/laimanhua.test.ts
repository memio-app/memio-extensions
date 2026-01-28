import Laimanhua from "@app/picture/laimanhua";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('laimanhua', () => {

    const laimanhuaTest = new RuleJest(new Laimanhua());

    it('should provide extension info', () => {
        const info = laimanhuaTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("laimanhua");
        expect(info.name).toBe("来漫画");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "/kanmanhua/zaixian_rhmh/{page}.html";
        const page = 1;
        const list = await laimanhuaTest.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(30);
        expect(list.nextPageUrl).toBe('https://www.laimanhua88.com/kanmanhua/zaixian_rhmh/2.html');
    }, 5000);

    it('should request category media', async () => {
        const url = "/kanmanhua/rexue/{page}.html";
        const page = 1;
        const list = await laimanhuaTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(30);
        expect(list.nextPageUrl).toBe('https://www.laimanhua88.com/kanmanhua/rexue/2.html');
    }, 5000);

    it('should request item chapter', async () => {
        const url = "https://www.laimanhua88.com/kanmanhua/34288/";
        const id = "34288";
        const detail = await laimanhuaTest.requestItemChapter(url, id);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe("https://www.laimanhua88.com/kanmanhua/34288/");
        expect(detail.title).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
               // console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 5000);


    it.only('request item media', async () => {
        const url = "https://www.laimanhua88.com/kanmanhua/34288/650247.html";
        const id = "650247";
        const media = await laimanhuaTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
    }, 120000);

});
