import Mangadex from "@app/picture/mangadex";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('mangadex', () => {

    const mangadexTest = new RuleJest(new Mangadex());

    it('should provide extension info', () => {
        const info = mangadexTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("mangadex");
        expect(info.name).toBe("MangaDex");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "includedTags[]=87cc87cd-a395-47af-b27a-93258283bbc6"; // 4-Koma
        const page = 1;
        const list = await mangadexTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(50);
        expect(list.nextPageUrl).not.toBeNull();
    }, 60000);

    it('should search item', async () => {
        const keyword = "frieren";
        const url = `https://api.mangadex.org/manga?includes[]=cover_art&includes[]=author&title={keyword}&limit=50&offset={offset}`;
        const page = 1;
        const list = await mangadexTest.searchItemList(keyword, url, page);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    }, 60000);

    it('should request item chapter', async () => {
        const url = "https://mangadex.org/title/a1c7c817-4e59-43b7-9365-09675a149a6f"; // Sousou no Frieren
        const id = "a1c7c817-4e59-43b7-9365-09675a149a6f";
        const detail = await mangadexTest.requestItemChapter(url, id);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        expect(detail.volumes).toBeDefined();
        expect(detail.volumes!.length).toBeGreaterThan(0);
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 60000);


    it('request item media', async () => {
        const url = "unused";
        const id = "3275c153-9593-4f51-9352-332c5a1a9237"; // Frieren ch 128
        const media = await mangadexTest.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBeDefined();
        pictureMedia.imageList.forEach(image => {
            expect(image).toContain("uploads.mangadex.org");
        });
    }, 60000);
});
