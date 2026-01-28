import { ExtensionList, ArticleMedia, MediaType } from '@/core/extension';
import { RuleJest } from "./../core";
import Cosplay8K from '@app/article/cosplay8k';

describe('Cosplay8K', () => {
    const cosplay8k = new RuleJest(new Cosplay8K());

    it('provideExtensionInfo should return correct extension info', () => {
        const info = cosplay8k.provideExtensionInfo();
        expect(info.key).toBe('8kcosplay');
        expect(info.name).toBe('8k Cosplay Zone');
        expect(info.lang).toBe('en');
        expect(info.baseUrl).toBe('https://www.8kcosplay.com');
        expect(info.type).toBe(MediaType.Article);
    });

    it('requestItemList should fetch and parse articles', async () => {
        const url = 'megapack-archives';
        const page = 1;
        const list: ExtensionList = await cosplay8k.requestItemList(url, page);
        expect(list.items.length).toBeGreaterThan(0);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 30000);

    it.only('requestItemMedia should fetch and parse article media', async () => {
        const url = 'https://www.8kcosplay.com/%e9%bb%8f%e9%bb%8f%e5%9b%a2%e5%ad%90%e5%85%94yiko%e6%b9%bf%e6%b6%a6%e5%85%94-11%e6%9c%88%e4%bd%9c%e5%93%81-%e5%85%ac%e4%b8%bb%e5%b0%8f%e5%a6%b9-princess-96p-1v%ef%bc%8f2-31gb/';
        const id = '%e9%bb%8f%e9%bb%8f%e5%9b%a2%e5%ad%90%e5%85%94yiko%e6%b9%bf%e6%b6%a6%e5%85%94-11%e6%9c%88%e4%bd%9c%e5%93%81-%e5%85%ac%e4%b8%bb%e5%b0%8f%e5%a6%b9-princess-96p-1v%ef%bc%8f2-31gb';
        const media: ArticleMedia = await cosplay8k.requestItemMedia(url, id) as ArticleMedia;
        console.log(media);
        expect(media).toBeDefined();
        expect(media.id).toBe(id);
        expect(media.title).toBeDefined();
        expect(media.content).toBeDefined();
    }, 30000);
});
