import Dgjyw from '../../app/video/dgjyw';
import { RuleJest } from '../core';
import { MediaType, VideoMedia } from '@/core/extension';

describe('Dgjyw', () => {
    const dgjywTest = new RuleJest(new Dgjyw());

    dgjywTest.addExtraHeaders([
        { key: "Cookie", value: "qnzbcnmcb=d87984bbe556a28a; nxgmnmry=f6f4b0c890ab56c9" },
    ]);

    it('should get extension info', () => {
        const extensionInfo = dgjywTest.provideExtensionInfo();
        expect(extensionInfo.name).toBe('东莞影视网');
        expect(extensionInfo.key).toBe('dgjyw');
        expect(extensionInfo.type).toBe(MediaType.Video);
    });

    it.only('should get item list', async () => {
        const list = await dgjywTest.requestItemList("1-0-0-0-0-{page}", 1);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.id).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.url).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.status).toBeDefined();
        });
        console.log(list.items[0]);
    }, 30000);

    it('should get item chapter', async () => {
        const item = await dgjywTest.requestItemChapter("https://www.dgjyw.com/dongguanmv/614277/", "614277");
        expect(item.volumes).toBeDefined();
        if (!item.volumes) return;
        expect(item.volumes.length).toBeGreaterThan(0);
        expect(item.volumes[0].chapters.length).toBeGreaterThan(0);
        const chapter = item.volumes[0].chapters[0];
        expect(chapter.id).toBeDefined();
        expect(chapter.name).toBeDefined();
        expect(chapter.url).toBeDefined();
        console.log(chapter);
    }, 30000);

    it('should get item media', async () => {
        const media = await dgjywTest.requestItemMedia("https://www.dgjyw.com/dongguanmv/614277/v1245684r2.html", "v1245684r2");
        expect(media).toBeInstanceOf(VideoMedia);
        const videoMedia = media as VideoMedia;
        expect(videoMedia.watchUrl).toBeDefined();
        expect(videoMedia.watchUrl.length).toBeGreaterThan(0);

        console.log(videoMedia);
    }, 30000);
});
