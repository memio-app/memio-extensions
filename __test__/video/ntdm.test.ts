import Ntdm from "@app/video/ntdm";
import { RuleJest } from "./../core";
import { MediaType, VideoMedia } from "@/core/extension";

describe('Ntdm', () => {

    const ntdmTest = new RuleJest(new Ntdm());

    it('should provide extension info', () => {
        const info = ntdmTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe('ntdm');
        expect(info.name).toBe('NT动漫');
        expect(info.type).toBe(MediaType.Video);
    });

    it('should request item list', async () => {
        const url = "type/riben-{page}.html";
        const itemList = await ntdmTest.requestItemList(url, 1);
        console.log(itemList);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toBeGreaterThan(0);
        itemList.items.forEach(item => {
            expect(item.title).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    }, 30000);

    it('should search item', async () => {
        const keyword = "美少女";
        const url = "search/-------------.html?wd={keyword}&page={page}";
        const itemList = await ntdmTest.searchItemList(keyword, url, 1);
        console.log(itemList);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toBeGreaterThan(0);
        itemList.items.forEach(item => {
            expect(item.title).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    }, 30000);

    it('should request item chapter', async () => {
        const url = "https://www.ntdm8.com/video/6119.html";
        const id = "6119";
        const detail = await ntdmTest.requestItemChapter(url, id);
        console.log(detail);
        expect(detail).toBeDefined();
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.volumes).toBeDefined();
        expect(detail.volumes!.length).toBeGreaterThan(0);
        detail.volumes?.forEach(volume => {
            expect(volume.name).toBeDefined();
            expect(volume.chapters.length).toBeGreaterThan(0);
            volume.chapters.forEach(chapter => {
                expect(chapter.id).toBeDefined();
                expect(chapter.url).toBeDefined();
                expect(chapter.name).toBeDefined();
            });
        });
    }, 30000);

    it.only('should request item media', async () => {
        const url = "https://www.ntdm8.com/play/7006-1-1.html";
        const id = "7006-1-1";
        const media = await ntdmTest.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeDefined();
        expect(media.mediaType).toBe(MediaType.Video);
        let videoMedia = media as VideoMedia;
        expect(videoMedia.watchUrl).toBeDefined();
    });
});
