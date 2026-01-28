import NHentai from "@app/picture/nhentai";
import { RuleJest } from "./../core";
import { MediaType, PictureMedia } from "@/core/extension";

describe('nhentai', () => {

    const nhentaiTest = new RuleJest(new NHentai());

    it('should provide extension info', () => {
        const info = nhentaiTest.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("nhentai");
        expect(info.name).toBe("nhentai");
        expect(info.type).toBe(MediaType.Picture);
    });

    it('should request item list from new uploads', async () => {
        const url = "/?page={page}"; // New Uploads
        const page = 1;
        const list = await nhentaiTest.requestItemList(url, page);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 60000);

    it('should search for items', async () => {
        const keyword = "naruto";
        const url = "/search/?q={keyword}&page={page}";
        const page = 1;
        const list = await nhentaiTest.searchItemList(keyword, url, page);
        expect(list.items.length).toBeGreaterThan(0);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.thumbnail).toBeDefined();
        });
        expect(list.nextPageUrl).toBeDefined();
    }, 60000);

    it('should request item media', async () => {
        // Example gallery ID.
        const artworkId = "482844";
        const url = `https://nhentai.net/g/${artworkId}/`;
        const media = await nhentaiTest.requestItemMedia(url, artworkId);
        expect(media).toBeInstanceOf(PictureMedia);
        let pictureMedia = media as PictureMedia;
        expect(pictureMedia.id).toBe(artworkId);
        expect(pictureMedia.imageList.length).toBeGreaterThan(0);
    }, 120000);


    it.only("json parse test", async () => {
        const jsonContent = 'window._gallery = JSON.parse("{\u0022id\u0022:622610,\u0022media_id\u0022:\u00223733935\u0022,\u0022title\u0022:{\u0022english\u0022:\u0022[Ito Life] ZURIAYA (Touhou Project) [Digital]\u0022,\u0022japanese\u0022:\u0022[\u005Cu4f0a\u005Cu6771\u005Cu30e9\u005Cu30a4\u005Cu30d5] \u005Cu305a\u005Cu308a\u005Cu3042\u005Cu3084 (\u005Cu6771\u005Cu65b9Project) [DL\u005Cu7248]\u0022,\u0022pretty\u0022:\u0022ZURIAYA\u0022},\u0022images\u0022:{\u0022pages\u0022:[{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808},{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:1280,\u0022h\u0022:1808}],\u0022cover\u0022:{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:350,\u0022h\u0022:494},\u0022thumbnail\u0022:{\u0022t\u0022:\u0022w\u0022,\u0022w\u0022:250,\u0022h\u0022:353}},\u0022scanlator\u0022:\u0022\u0022,\u0022upload_date\u0022:1768199844,\u0022tags\u0022:[{\u0022id\u0022:1033,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022handjob\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fhandjob\u002F\u0022,\u0022count\u0022:15810},{\u0022id\u0022:2937,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022big breasts\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fbig-breasts\u002F\u0022,\u0022count\u0022:207704},{\u0022id\u0022:3735,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022swimsuit\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fswimsuit\u002F\u0022,\u0022count\u0022:32257},{\u0022id\u0022:6346,\u0022type\u0022:\u0022language\u0022,\u0022name\u0022:\u0022japanese\u0022,\u0022url\u0022:\u0022\u002Flanguage\u002Fjapanese\u002F\u0022,\u0022count\u0022:316076},{\u0022id\u0022:10394,\u0022type\u0022:\u0022artist\u0022,\u0022name\u0022:\u0022itou life\u0022,\u0022url\u0022:\u0022\u002Fartist\u002Fitou-life\u002F\u0022,\u0022count\u0022:162},{\u0022id\u0022:13720,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022nakadashi\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fnakadashi\u002F\u0022,\u0022count\u0022:106626},{\u0022id\u0022:15408,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022femdom\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Ffemdom\u002F\u0022,\u0022count\u0022:31329},{\u0022id\u0022:17017,\u0022type\u0022:\u0022character\u0022,\u0022name\u0022:\u0022aya shameimaru\u0022,\u0022url\u0022:\u0022\u002Fcharacter\u002Faya-shameimaru\u002F\u0022,\u0022count\u0022:1076},{\u0022id\u0022:18004,\u0022type\u0022:\u0022group\u0022,\u0022name\u0022:\u0022itou life\u0022,\u0022url\u0022:\u0022\u002Fgroup\u002Fitou-life\u002F\u0022,\u0022count\u0022:157},{\u0022id\u0022:18024,\u0022type\u0022:\u0022parody\u0022,\u0022name\u0022:\u0022touhou project\u0022,\u0022url\u0022:\u0022\u002Fparody\u002Ftouhou-project\u002F\u0022,\u0022count\u0022:22174},{\u0022id\u0022:20035,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022x-ray\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fx-ray\u002F\u0022,\u0022count\u0022:46593},{\u0022id\u0022:24380,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022pantyhose\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fpantyhose\u002F\u0022,\u0022count\u0022:24745},{\u0022id\u0022:25614,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022paizuri\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fpaizuri\u002F\u0022,\u0022count\u0022:41277},{\u0022id\u0022:29859,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022blowjob\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fblowjob\u002F\u0022,\u0022count\u0022:94524},{\u0022id\u0022:33172,\u0022type\u0022:\u0022category\u0022,\u0022name\u0022:\u0022doujinshi\u0022,\u0022url\u0022:\u0022\u002Fcategory\u002Fdoujinshi\u002F\u0022,\u0022count\u0022:458081},{\u0022id\u0022:35762,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022sole female\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fsole-female\u002F\u0022,\u0022count\u0022:179742},{\u0022id\u0022:35763,\u0022type\u0022:\u0022tag\u0022,\u0022name\u0022:\u0022sole male\u0022,\u0022url\u0022:\u0022\u002Ftag\u002Fsole-male\u002F\u0022,\u0022count\u0022:160447}],\u0022num_pages\u0022:21,\u0022num_favorites\u0022:22}");';
        
        let scriptContent = "";
        let regex = /window\._gallery\s*=\s*JSON\.parse\("([\s\S]*?)"\);/;
        let match = jsonContent.match(regex);
        if (match && match[1]) {
            scriptContent = match[1];
            console.log("content:", match[0]);
        }
        
        let parsed = JSON.parse(scriptContent);
        
        console.log("parsed json:", parsed);
    },1000);
});
