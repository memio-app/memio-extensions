import Wenku8 from "@app/novel/wenku8";
import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";

describe('wenku8', () => {

    const wenku8Test = new RuleJest(new Wenku8());
    wenku8Test.addExtraHeaders([
        { key: "Cookie", value: "PHPSESSID=xxxxxxxxxxxxxxxxxxxxx;jieqiUserInfo=;" },
    ]);

    it.only('should provide extension info', () => {
        const info = wenku8Test.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("wenku8");
        expect(info.name).toBe("轻小说文库");
        expect(info.type).toBe(MediaType.Novel);
        expect(info.loginParams).toBeDefined();
        expect(info.loginParams.length).toBe(2);
    });

    it.skip('should login', async () => {
        const form = new Map<string, string>();
        form.set("username", "xxxx");
        form.set("password", "xxxx");
        const auth = await wenku8Test.loginForm(form);
        console.log(auth);
        expect(auth).toBeDefined();
    });

    it('should request item list', async () => {
        const url = "https://www.wenku8.cc/modules/article/toplist.php?sort=lastupdate&charset=utf8&page={page}";
        const page = 1;
        const list = await wenku8Test.requestItemList(url, page);
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
        expect(list.items.length).toBe(20);
        expect(list.nextPageUrl).toBe('https://www.wenku8.cc/modules/article/toplist.php?sort=lastupdate&charset=utf8&page=2');
    });

    it('should search item', async () => {
        const keyword = "文学";
        const url = `https://www.wenku8.cc/modules/article/search.php?searchtype=articlename&searchkey={keyword}&charset=utf8&page={page}`;
        const page = 1;
        const list = await wenku8Test.searchItemList(keyword, url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
            expect(item.description).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.hasChapter).toBe(true);
            expect(item.author).toBeDefined();
            expect(item.status).toBeDefined();
        });
        expect(list.items.length).toBe(1);
    });

    it('should search item', async () => {
        const keyword = "恋爱";
        const url = `https://www.wenku8.cc/modules/article/search.php?searchtype=articlename&searchkey={keyword}&charset=utf8&page={page}`;
        const page = 1;
        const list = await wenku8Test.searchItemList(keyword, url, page);
        console.log(list);
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
        expect(list.items.length).toBe(20);
    });

    it('should request item chapter', async () => {
        const url = "https://www.wenku8.cc/book/3977.htm?charset=utf8";
        const id = "3977";
        const detail = await wenku8Test.requestItemChapter(url, id);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe(url);
        expect(detail.title).toBe('爱依赖的她，成天泡在我房里');
        expect(detail.thumbnail).toBeDefined();
        detail.volumes?.forEach(v => {
            v.chapters.forEach(c => {
                console.log(c);
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    });

    it('request item media', async () => {
        const url = "https://www.wenku8.cc/modules/article/reader.php?aid=3977&cid=165011&charset=utf8";
        const id = "165011";
        const media = await wenku8Test.requestItemMedia(url, id);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBe('第一卷 特典 直到中奖前都是虚无');
    });


});