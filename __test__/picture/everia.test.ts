import Everia from "@app/picture/everia";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('everia', () => {

    const everiaTest = new RuleJest(new Everia());

    it('should provide extension info', () => {
        const info = everiaTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("everia");
        expect(info.name).toBe("EVERIA.CLUB");
        expect(info.type).toBe(MediaType.Picture);
    });

    it.only('should request item list from category', async () => {
        const url = "/"; // LATEST
        const page = 1;
        const list = await everiaTest.requestItemList(url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 60000);

    it('should request channel list for a tag', async () => {
        const tagId = "digital-photobook";
        const page = 1;
        const list = await everiaTest.requestChannelList(tagId, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 60000);

    it('should search for items', async () => {
        const keyword = "korea";
        const url = "/page/{page}/?s={keyword}";
        const page = 1;
        const list = await everiaTest.searchItemList(keyword, url, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 60000);

    it('should request item media', async () => {
        // Example artwork ID from everia.club
        const artworkId = "132203";
        const url = `https://everia.club/2024/04/132203/`;
        const media = await everiaTest.requestItemMedia(url, artworkId);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(artworkId);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
    }, 120000);
});
