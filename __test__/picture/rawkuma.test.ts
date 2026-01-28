import Rawkuma from "@app/picture/rawkuma";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('rawkuma', () => {

    const rawkumaTest = new RuleJest(new Rawkuma());

    it('should provide extension info', () => {
        const info = rawkumaTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("rawkuma");
        expect(info.name).toBe("Rawkuma");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "[]"; // All
        const page = 1;
        const list = await rawkumaTest.requestItemList(url, page);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
        });
        expect(list.items.length).toBe(24);
        expect(list.nextPageUrl).not.toBeNull();
    }, 60000);

    it('should search item', async () => {
        const keyword = "love";
        const url = "search";
        const page = 1;
        const list = await rawkumaTest.searchItemList(keyword, url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
        });
    }, 60000);

    it('should request item chapter', async () => {
        const url = "https://rawkuma.net/manga/ossan-teihen-chiyu-shi-to-manasume-no-henkyou-life/";
        const id = "ossan-teihen-chiyu-shi-to-manasume-no-henkyou-life";
        const detail = await rawkumaTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.volumes).toBeDefined();
        expect(detail.volumes!.length).toBeGreaterThan(0);
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
                console.log(`Chapter: ${c.name}, URL: ${c.url},ID: ${c.id}`);
            });
        });
    }, 60000);


    it.only('request item media', async () => {
        const url = "https://rawkuma.net/manga/ossan-teihen-chiyu-shi-to-manasume-no-henkyou-life/chapter-7.3.30899/";
        const id = "chapter-7.3.30899";
        const media = await rawkumaTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        pictureMedia.imageList.forEach(image => {
            expect(image).toBeDefined();
        });
    }, 60000);
});
