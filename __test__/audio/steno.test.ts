import { RuleJest } from "./../core";
import { AudioMedia, MediaType } from "@/core/extension";
import Steno from "@app/audio/steno";

describe("Steno", () => {
    const stenoTest = new RuleJest(new Steno());

    it("should provide extension info", () => {
        const info = stenoTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.baseUrl).toBe("https://www.steno.fm");
        expect(info.key).toBe("steno");
        expect(info.name).toBe("steno.fm");
        expect(info.type).toBe(MediaType.Audio);
    });

    it("channel should request channel list", async () => {
        const podcastId = "6407e0f4-9ca2-55d0-a540-2207d71ff814"; // Lex Fridman Podcast
        const page = 1;
        const list = await stenoTest.requestChannelList(podcastId, page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(10);
        list.items.forEach((item) => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
    }, 20000);

    it("search should return results", async () => {
        const keyword = "三个";
        const page = 1;
        const list = await stenoTest.searchItemList(keyword,"https://itunes.apple.com/search?term={keyword}&limit=15&media=podcast", page);
        console.log(list);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach((item) => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
    }, 20000);


    it("should request item media", async () => {
        // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl
        const itemUrl = "https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl";
        const id = "6939568d2a383da1675e815e";
        const media = await stenoTest.requestItemMedia(itemUrl, id);
        expect(media).toBeInstanceOf(AudioMedia);
        let audioMedia = media as AudioMedia;
        expect(audioMedia.playUrl).toBeDefined();
        expect(audioMedia.title).toBeDefined();
        expect(audioMedia.artist).toBeDefined();
        expect(audioMedia.duration).toBeGreaterThan(0);
    }, 20000);
});
