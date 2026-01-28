import Gelbooru from "@app/picture/gelbooru";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('gelbooru', () => {

    const gelbooruTest = new RuleJest(new Gelbooru());

    it('should provide extension info', () => {
        const info = gelbooruTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("gelbooru");
        expect(info.name).toBe("Gelbooru");
        expect(info.type).toBe(MediaType.Picture);
    });

    it.only('should request item list from category', async () => {
        const url = "page=post&s=list&tags=all";
        const page = 1;
        const list = await gelbooruTest.requestItemList(url, page);
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
        const tag = "nintendo";
        const page = 1;
        const list = await gelbooruTest.requestChannelList(tag, page);
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
        const keyword = "nintendo+pokemon";
        const url = "page=post&s=list&tags={keyword}";
        const page = 1;
        const list = await gelbooruTest.searchItemList(keyword, url, page);
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
        // Example artwork ID.
        const artworkId = "13306575";
        const url = `https://gelbooru.com/index.php?page=post&s=view&id=${artworkId}`;
        const media = await gelbooruTest.requestItemMedia(url, artworkId);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(artworkId);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
    }, 120000);
});
