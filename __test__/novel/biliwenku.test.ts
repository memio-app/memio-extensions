import BiliWenku from "@app/novel/biliwenku";
import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";


describe('biliwenku', () => {
    const biliwenkuTest = new RuleJest(new BiliWenku());

    it.only('should provide extension info', () => {
        const info = biliwenkuTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.baseUrl).toBe("https://www.bilinovel.com");
        expect(info.key).toBe("biliwenku");
        expect(info.name).toBe("哔哩文库");
        expect(info.type).toBe(MediaType.Novel);
        
    });

    it('should request item list', async () => {
        const url = "https://www.bilinovel.com/wenku/lastupdate_0_0_0_0_0_0_0_{page}_0.html";
        const page = 1;
        const list = await biliwenkuTest.requestItemList(url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.status).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(30);
        expect(list.nextPageUrl).toBeDefined();
    });

    it('should search item only 1', async () => {
        const keyword = "文学少女";
        const url = `https://www.bilinovel.com/search.html?searchkey={keyword}`;
        const page = 1;
        const list = await biliwenkuTest.searchItemList(keyword, url, page);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBe("文学少女");
            expect(item.id).toBe("88");
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBe(1);
    });

    it('should search items', async () => {
        const keyword = "文学";
        const url = `https://www.bilinovel.com/search.html`;
        const page = 1;
        const list = await biliwenkuTest.searchItemList(keyword, url, page);
        console.log(list);
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
        expect(list.items.length).toBeGreaterThanOrEqual(30);
    });

    it('should request novel detail', async () => {
        const url = "https://www.bilinovel.com/novel/88.html";
        const detail = await biliwenkuTest.requestItemChapter(url,"88");
        //console.log(detail);
        detail?.volumes?.forEach(volume => {
            expect(volume.name).toBeDefined();
            expect(volume.chapters.length).toBeGreaterThan(0);
            volume.chapters.forEach(chapter => {
                expect(chapter.name).toBeDefined();
                expect(chapter.url).not.toContain("javascript:");
                expect(parseInt(chapter.id)).toBeGreaterThan(1);
            });
        });
        expect(detail?.volumes?.length).toBeGreaterThanOrEqual(20);
    });

    it('should request chapter content', async () => {
        //const url = "https://www.bilinovel.com/novel/88/12506.html";
        const url = "https://www.bilinovel.com/novel/2727/129096.html";
        const content = await biliwenkuTest.requestItemMedia(url, "129096");
        expect(content).toBeDefined();
        expect(content.id).toBe("129096");
        expect(content.title).toBe("第三章 硬来什么的，绝对不行！");
        expect(content).toBeInstanceOf(NovelMedia);
        var contentMedia = content as NovelMedia;
        // console.log(contentMedia.content);
        expect(contentMedia.content).toBeDefined();
    });

    it('should request chapter content contain image', async () => {
        const url = "https://www.bilinovel.com/novel/2978/147845.html";
        const content = await biliwenkuTest.requestItemMedia(url, "147845");
        expect(content).toBeDefined();
        expect(content.id).toBe("147845");
        expect(content.title).toBe("插图");
        expect(content).toBeInstanceOf(NovelMedia);
        var contentMedia = content as NovelMedia;
        expect(contentMedia.content).toBeDefined();
    });

});