import AgeDm from "@app/video/agedm";
import { RuleJest } from "./../core";
import { MediaType, VideoMedia } from "@/core/extension";

describe('AgeDm', () => {

    const agedmTest = new RuleJest(new AgeDm());

    it('should provide extension info', () => {
        const info = agedmTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe('agedm');
        expect(info.name).toBe('AGE动漫');
        expect(info.type).toBe(MediaType.Video);
    });

    it('should request item list', async () => {
        const url = "https://ageapi.omwjhz.com:18888/v2/catalog?order=time&status=all&page={page}&size=30";
        const itemList = await agedmTest.requestItemList(url, 1);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toEqual(30);
    });

    it('should search item', async () => {
        const keyword = "美少女";
        const url = "https://ageapi.omwjhz.com:18888/v2/search?query={keyword}&page={page}";
        const itemList = await agedmTest.searchItemList(keyword, url, 1);
        expect(itemList).toBeDefined();
        expect(itemList.items.length).toBeGreaterThan(0);
        itemList.items.forEach(item => {
            expect(item.title).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
    });

    it('should request item chapter', async () => {
        const url = "https://ageapi.omwjhz.com:18888/v2/detail/20250127";
        const id = "20250127";
        const detail = await agedmTest.requestItemChapter(url, id);
        expect(detail).toBeDefined();
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        detail.volumes?.forEach(volume => {
            expect(volume.name).toBeDefined();
            expect(volume.chapters.length).toBeGreaterThan(0);
            volume.chapters.forEach(chapter => {
                expect(chapter.id).toBeDefined();
                expect(chapter.url).toBeDefined();
                expect(chapter.name).toBeDefined();
            });
        });
    });

    it.skip('should request item media', async () => {
        const url = "https://43.240.156.118:8443/m3u8/?url=age_edd9a9e4PTEFdq%2BG0nYv%2BmhiAkaiI4qmuCIAs%2FsMEvQzuyPpSieqBWCukbGBq4mD%2FAxxcC%2Fqnffv3fJyshHJKM5ZVtE4qzjbMAxuwsBr6NTdYcMEFw";
        const media = await agedmTest.requestItemMedia(url,"20250127");
        expect(media).toBeDefined();
        expect(media.mediaType).toBe(MediaType.Video);
        let videoMedia = media as VideoMedia;
        expect(videoMedia.autoCatch).toBe(false);
        expect(videoMedia.watchUrl).toContain("index.m3u8");
        console.log(videoMedia);
    });
});
