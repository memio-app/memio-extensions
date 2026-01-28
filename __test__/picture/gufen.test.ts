import Gufen from "@app/picture/gufen";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('gufen', () => {

    const gufenTest = new RuleJest(new Gufen());

    it('should provide extension info', () => {
        const info = gufenTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("gufen");
        expect(info.name).toBe("古风漫画网");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "https://www.gfmh.app/category/page/{page}/";
        const page = 1;
        const list = await gufenTest.requestItemList(url, page);
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
        expect(list.items.length).toBe(16);
        expect(list.nextPageUrl).toBe('https://www.gfmh.app/category/page/2/');
    },5000);

    it('should request category media', async () => {
        const url = "https://www.gfmh.app/category/list/2/page/{page}/";
        const page = 1;
        const list = await gufenTest.requestItemList(url, page);
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
        expect(list.items.length).toBe(16);
        expect(list.nextPageUrl).toBe('https://www.gfmh.app/category/list/2/page/2/');
    },5000);

    it.skip('should search item', async () => {
        const keyword = "猎人";
        const url = `https://www.gfmh.app/search/{keyword}/{page}`;
        const page = 1;
        const list = await gufenTest.searchItemList(keyword, url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
            expect(item.status).toBeDefined();
        });
        //expect(list.items.length).toBe(10);
    },5000);

    it('should request item chapter', async () => {
        const url = "https://www.gfmh.app/402294.html";
        const id = "402294";
        const detail = await gufenTest.requestItemChapter(url, id);
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
        const url = "https://www.gfmh.app/402294/131945.html";
        const id = "131945";
        const media = await gufenTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBe('第1话 你为何而游戏');
    }, 120000);

});