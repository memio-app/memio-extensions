import { ExtensionList, ArticleMedia, MediaType } from '@/core/extension';
import { RuleJest } from "./../core";
import NtrBlog from '@app/article/ntrblog';

describe("NtrBlog Article Test", () => {
    let ruleJest: RuleJest;
    beforeAll(() => {
        ruleJest = new RuleJest(new NtrBlog());
    });

    test("Provide Extension Info", () => {
        const extInfo = ruleJest.provideExtensionInfo();
        expect(extInfo.key).toBe("ntrblog");
        expect(extInfo.name).toBe("NTR BLOG(寝取られブログ)");
        expect(extInfo.type).toBe(MediaType.Article);
        expect(extInfo.baseUrl).toBe("https://ntrblog.com");
        expect(extInfo.categoryList.length).toBeGreaterThan(0);
    });

    test("Request Item List", async () => {
        const extList: ExtensionList = await ruleJest.requestItemList("/?p=1", 1);
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
        const testUrl = "https://ntrblog.com/archives/1083914128.html";
        const mediaDetail = await ruleJest.requestItemMedia(testUrl,"1083914128");
        console.log(mediaDetail);
        expect(mediaDetail.id).toBeDefined();
        expect(mediaDetail.title).toBeDefined();

        let articleMedia = mediaDetail as ArticleMedia;
        expect(articleMedia.content).toBeDefined();
    },30000);

});
