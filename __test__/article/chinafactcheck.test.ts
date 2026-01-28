import { ExtensionList, ArticleMedia, MediaType } from '@/core/extension';
import { RuleJest } from "./../core";
import ChinaFactCheck from '@app/article/chinafactcheck';

describe("ChinaFactCheck Article Test", () => {
    let ruleJest: RuleJest;
    beforeAll(() => {
        ruleJest = new RuleJest(new ChinaFactCheck());
    });

    test("Provide Extension Info", () => {
        const extInfo = ruleJest.provideExtensionInfo();
        expect(extInfo.key).toBe("chinafactcheck");
        expect(extInfo.name).toBe("国际新闻事实核查");
        expect(extInfo.type).toBe(MediaType.Article);
        expect(extInfo.baseUrl).toBe("https://www.chinafactcheck.com");
        expect(extInfo.categoryList.length).toBeGreaterThan(0);
    });

    test("Request Item List", async () => {
        const extList: ExtensionList = await ruleJest.requestItemList("cat=11", 1);
        expect(extList.items.length).toBeGreaterThan(0);
        extList.items.forEach(item => {
            console.log(item);
            expect(item.id).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.url).toBeDefined();
            expect(item.type).toBe(MediaType.Article);
        });
        expect(extList.nextPageUrl).toBeDefined();
    });

    test("request media detail", async () => {
        const testUrl = "https://www.chinafactcheck.com/?p=15345";
        const mediaDetail = await ruleJest.requestItemMedia(testUrl,"15345");
        console.log(mediaDetail);
        expect(mediaDetail.id).toBeDefined();
        expect(mediaDetail.title).toBeDefined();

        let articleMedia = mediaDetail as ArticleMedia;
        expect(articleMedia.content).toBeDefined();
        expect(articleMedia.author).toBeDefined();
        expect(articleMedia.date).toBeDefined();
    },30000);

});
