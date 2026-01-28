import { ExtensionList, ArticleMedia, MediaType } from '@/core/extension';
import { RuleJest } from "./../core";
import Koyso from "@app/article/koyso";

describe('Koyso', () => {
    const koyso = new RuleJest(new Koyso());

    it('provideExtensionInfo should return correct extension info', () => {
        const info = koyso.provideExtensionInfo();
        expect(info.key).toBe('koyso');
        expect(info.name).toBe('Koyso');
        expect(info.lang).toBe('en');
        expect(info.baseUrl).toBe('https://koyso.to');
        expect(info.type).toBe(MediaType.Article);
    });

    it('requestItemList should fetch and parse articles', async () => {
        const url = '/category/action';
        const page = 1;
        const list: ExtensionList = await koyso.requestItemList(url, page);
        expect(list.items.length).toBeGreaterThan(0);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 30000);

    it('requestItemMedia should fetch and parse article media', async () => {
        // Using a known article for testing
        const url = 'https://koyso.to/game/2057';
        const id = '2057';
        const media: ArticleMedia = await koyso.requestItemMedia(url, id) as ArticleMedia;
        console.log(media);
        expect(media.content).toBeDefined();
        expect(media.title).toBeDefined();
        expect(media.id).toBe(id);
    }, 30000);

    it('searchItemList should fetch and parse articles', async () => {
        const keyword = 'elden ring';
        const url = '';
        const page = 1;
        const list: ExtensionList = await koyso.searchItemList(keyword, url, page);
        expect(list.items.length).toBeGreaterThan(0);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
        });
    }, 30000);
});
