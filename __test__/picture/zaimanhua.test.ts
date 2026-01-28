
import Zaimanhua from "@app/picture/zaimanhua";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('zaimanhua', () => {

    const zaimanhuaTest = new RuleJest(new Zaimanhua());

    it('should provide extension info', () => {
        const info = zaimanhuaTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("zaimanhua");
        expect(info.name).toBe("再漫画");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "size=20&page={page}";
        const page = 1;
        const list = await zaimanhuaTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    }, 120000);

    it('should search item', async () => {
        const keyword = "恋爱";
        const url = "keyword={keyword}&source=0&page={page}&size=24";
        const page = 1;
        const list = await zaimanhuaTest.searchItemList(keyword, url, page);
        console.log(list);
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
        const url = "https://manhua.zaimanhua.com/details/41672";
        const id = "41672";
        const detail = await zaimanhuaTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 120000);

    it.only('should request item media', async () => {
        const url = "https://manhua.zaimanhua.com/detail/41672/103821";
        const id = "103821";
        const media = await zaimanhuaTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBeDefined();
    }, 120000);

});
