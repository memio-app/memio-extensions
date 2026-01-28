import HAnime1 from "@app/video/hanime1";
import { RuleJest } from "./../core";
import { MediaType, VideoMedia } from "@/core/extension";

describe('HAnime1', () => {

    const hanime1Test = new RuleJest(new HAnime1());

    it('should provide extension info', () => {
        const info = hanime1Test.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe('hanime1');
        expect(info.name).toBe('H動漫/裏番/線上看');
        expect(info.type).toBe(MediaType.Video);
    });

    it('should request item list', async () => {
        const url = "/search?genre=%E8%A3%8F%E7%95%AA&page={page}";
        const itemList = await hanime1Test.requestItemList(url, 1);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toBeGreaterThan(0);
    });

    it('should search item', async () => {
        const keyword = "少女";
        const url = "/search?genre=%E8%A3%8F%E7%95%AA&query={keyword}&page={page}";
        const itemList = await hanime1Test.searchItemList(keyword, url, 1);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toBeGreaterThan(0);
        itemList.items.forEach(item => {
            expect(item.title).toBeDefined();
            expect(item.hasChapter).toBe(false);
        });
    });

    it('should request item media', async () => {
        const url = "https://hanime1.me/watch?v=400589";
        const id = "400589";
        const media = await hanime1Test.requestItemMedia(url, id);
        expect(media).toBeDefined();
        expect(media.mediaType).toBe(MediaType.Video);
        let videoMedia = media as VideoMedia;
        expect(videoMedia.watchUrl).toBeDefined();
    });
});
