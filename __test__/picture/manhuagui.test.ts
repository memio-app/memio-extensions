import ManhuaGui from "@app/picture/manhuagui";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('manhuagui', () => {

    const manhuaguiTest = new RuleJest(new ManhuaGui());

    it('should provide extension info', () => {
        const info = manhuaguiTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("manhuagui");
        expect(info.name).toBe("漫畫櫃");
        expect(info.type).toBe(MediaType.Picture);
    });

    it.only('should request item list', async () => {
        const url = "/list/update_p{page}.html";
        const page = 1;
        const list = await manhuaguiTest.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(42);
        expect(list.nextPageUrl).toBe('https://www.manhuagui.com/list/update_p2.html');
    },5000);

    it('should request category media', async () => {
        const url = "/list/rexue/update_p{page}.html";
        const page = 1;
        const list = await manhuaguiTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(42);
        expect(list.nextPageUrl).toBe('https://www.manhuagui.com/list/rexue/update_p2.html');
    },5000);

    it('should search item', async () => {
        const keyword = "猎人";
        const url = `/s/{keyword}_p{page}.html`;
        const page = 1;
        const list = await manhuaguiTest.searchItemList(keyword, url, page);
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
        expect(list.items.length).toBe(10);
    },5000);

    it('should request item chapter', async () => {
        const url = "/comic/19430/";
        const id = "19430";
        const detail = await manhuaguiTest.requestItemChapter(url, id);
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
    },5000);


    it('request item media', async () => {
        const url = "https://www.manhuagui.com/comic/17380/541907.html";
        const id = "541907";
        const media = await manhuaguiTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBe('第1话');
    }, 120000);

});
