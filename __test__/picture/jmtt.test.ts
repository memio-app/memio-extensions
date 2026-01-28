import Jmtt from "@app/picture/jmtt";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('jmtt', () => {

    const jmttTest = new RuleJest(new Jmtt());
    jmttTest.config(
        new Map<string, string>([
            // "host", "https://jm18c-jjd.club"
            ["host", "https://jm18c-jjd.club"],
        ])
    );

    it('should provide extension info', () => {
        const info = jmttTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("18comic");
        expect(info.name).toBe("禁漫天堂");
        expect(info.type).toBe(MediaType.Picture);
    });

    it.only('should request item list', async () => {
        const url = "albums?o=mr&page={page}"; // 最新
        const page = 1;
        const list = await jmttTest.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
        expect(list.nextPageUrl).not.toBeNull();
    }, 60000);

    it('should search item', async () => {
        const keyword = "校服";
        const url = "search/photos?search_query={keyword}&page={page}";
        const page = 1;
        const list = await jmttTest.searchItemList(keyword, url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    }, 60000);

    it('should search id item', async () => {
        const keyword = "201118";
        const url = "search/photos?search_query={keyword}&page={page}";
        const page = 1;
        const list = await jmttTest.searchItemList(keyword, url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    }, 60000);

    it('should request item chapter', async () => {
        const url = "https://jm18c-jjd.club/album/201118/"; 
        const id = "201118";
        const detail = await jmttTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        expect(detail.volumes).toBeDefined();
        expect(detail.volumes!.length).toBeGreaterThan(0);
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 60000);


    it('request item media', async () => {
        const url = "https://jm18c-jjd.club/photo/1136963";
        const id = "1136963";
        const media = await jmttTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.encodeMethod).toBe("scramble");
        expect(pictureMedia.encodeKeys).toBeDefined();
        expect(pictureMedia.encodeKeys!.length).toBe(pictureMedia.imageList.length);
        pictureMedia.imageList.forEach(image => {
            expect(image).toContain("cdn-msp");
        });
    }, 60000);
});
