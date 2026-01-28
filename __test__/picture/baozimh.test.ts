
import Baozimh from "@app/picture/baozimh";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('baozimh', () => {

    const baozimhTest = new RuleJest(new Baozimh());

    it('should provide extension info', () => {
        const info = baozimhTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("baozimh");
        expect(info.name).toBe("包子漫画");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list', async () => {
        const url = "region=jp&type=all";
        const page = 1;
        const list = await baozimhTest.requestItemList(url, page);
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
        expect(list.items.length).toBeGreaterThan(0);
    }, 120000);

    it('should search item', async () => {
        const keyword = "恋爱";
        const url = `/search?q={keyword}`;
        const page = 1;
        const list = await baozimhTest.searchItemList(keyword, url, page);
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
        const url = "https://www.baozimh.com/comic/hejiqirenpapapanengsuanzaijingyancishulima-yiming";
        const id = "hejiqirenpapapanengsuanzaijingyancishulima-yiming";
        const detail = await baozimhTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 120000);

    it('should request item chapter2', async () => {
        const url = "https://www.baozimh.com/comic/yinjiaoweiyuanchangdeyinle-tehakusen";
        const id = "yinjiaoweiyuanchangdeyinle-tehakusen";
        const detail = await baozimhTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBeDefined();
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    }, 120000);


    it.only('request item media', async () => {
        // https://www.twmanga.com/comic/chapter/yiquanchaoren-one/0_354.html
        const url = "https://www.baozimh.com/user/page_direct?comic_id=yiquanchaoren-one&section_slot=0&chapter_slot=354";
        const id = "2";
        const media = await baozimhTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(id);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
        expect(pictureMedia.title).toBeDefined();
    }, 120000);

});
