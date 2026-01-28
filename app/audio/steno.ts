import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, Extension, MediaType, AudioMedia, ChannelType, Channel, ItemChapter, ItemVolume, ExtensionMedia } from '@/core/extension';
import { formatDateToYMD } from '@/utils/date';

class Steno extends Rule {
    provideExtensionInfo(): Extension {
        let site = new Extension("steno", "steno.fm", MediaType.Audio);
        site.baseUrl = "https://www.steno.fm";
        site.description = "We’re building the home for podcast transcripts."
        site.thumbnail = "https://www.steno.fm/logo-192.png";
        site.lang = "en";
        site.categoryList = [];
        site.searchList = [{
            name: "Search", url: "https://itunes.apple.com/search?term={keyword}&limit=15&media=podcast"
        }];
        site.channel = new Channel(ChannelType.List, "播客频道ID", "podcast");
        // site.script = [
        //     new SiteUrl("jquery", ""),
        //     new SiteUrl("crypto", ""),
        // ]

        site.useGuide = `## How to find Podcast ID
1. Open the [steno.fm](https://www.steno.fm) website and search for the podcast you are interested in.
2. Click on the podcast to go to its main page.
3. Look at the URL in your browser's address bar. The URL will be in the format \`https://www.steno.fm/podcast/{podcast-id}\`.
4. The \`{podcast-id}\` part of the URL is the Podcast ID you need.
5. Copy and paste this Podcast ID into the channel ID input box of this extension to subscribe to the podcast.
`;

        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        return new ExtensionList([], page, undefined);
    }

    override async searchItemList(keyword: string, url: string, page: number): Promise<ExtensionList> {
        let searchApi = url.replace("{keyword}", encodeURIComponent(keyword));
        let response = await this.client?.request({ url: searchApi, method: "GET" });
        let json = JSON.parse(response.body);
        let results = json.results;

        let items: ExtensionDetail[] = [];
        results.forEach((item: any) => {
            let id = item.collectionId.toString();
            let title = item.collectionName;
            let thumbnail = item.artworkUrl100 ?? item.artworkUrl600 ?? item.artworkUrl60;
            let author = item.artistName;
            let category = item.primaryGenreName;
            let date = item.releaseDate;
            let dateTxt = formatDateToYMD(date);
            let status = item.trackCount + " tracks";
            // https://www.steno.fm/api/redirect?itunesID=1696511339
            let link = `${this.provideExtensionInfo().baseUrl}/api/redirect?itunesID=${id}`;
            let detail = new ExtensionDetail(id, link, title);
            detail.thumbnail = thumbnail;
            detail.author = author;
            detail.category = category;
            detail.status = status;
            detail.description = dateTxt;
            detail.hasChapter = true;
            detail.type = MediaType.Audio;

            items.push(detail);
        });

        return new ExtensionList(items, page, undefined);
    }

    searchHtmlScriptElement(html: string): string {
        let $nodes = $(html);
        let jsonString = "";
        $nodes.each((index, element) => {
            if (element instanceof HTMLScriptElement) {
                if (element.id === "__NEXT_DATA__") {
                    let scriptContent = element.innerHTML;
                    jsonString = scriptContent;
                    return false; // Exit the each loop
                }
            }
        });
        return jsonString;
    }

    mediaMap: Map<string, AudioMedia> = new Map<string, AudioMedia>();

    override async requestChannelList(key: string, page: number): Promise<ExtensionList> {
        // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814
        let podcastUrl = `${this.site.baseUrl}/show/${key}`;
        let response = await this.client?.request({ url: podcastUrl, method: "GET" });
        let html = response.body;
        let jsonString = this.searchHtmlScriptElement(html);

        let eps: ExtensionDetail[] = [];
        try {
            let jsonData = JSON.parse(jsonString);
            let podcastData = jsonData.props.pageProps;
            let podcast = podcastData.show;
            let podcastId = podcastData.showId;
            let episodes = podcastData.episodes;
            let podcastCover = podcast.image ?? "";
            let author = podcast.author;
            this.mediaMap.clear();
            episodes.forEach((ep: any) => {
                let id = ep.guid;
                let title = ep.title;
                // let guid = base64Encode(id);
                let guid = btoa(id);
                // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl
                let url = `${this.site.baseUrl}/show/${podcastId}/episode/${guid}`;
                let description = ep.description || "";
                let date = ep.datePublishedPretty;
                let cover = ep.image.length > 0 ? ep.image : podcastCover;
                let playUrl = ep.enclosureUrl;
                let duration = ep.duration;
                let episode = new ExtensionDetail(id, url, title);
                episode.author = author;
                episode.description = description;
                episode.status = "";
                episode.hasChapter = false;
                episode.thumbnail = cover;
                episode.type = MediaType.Audio;
                episode.category = date;
                eps.push(episode);

                let audioMedia = new AudioMedia(id, title, playUrl, duration);
                audioMedia.artist = author;
                audioMedia.thumbnail = cover;

                this.mediaMap.set(id, audioMedia);
            });
        } catch (error) {
            console.error("Failed to parse JSON data:", error);
            return new ExtensionList([], page, undefined);
        }
        return new ExtensionList(eps, page, undefined);
    }

    // enter from search
    override async requestItemChapter(url: string, id: string): Promise<ExtensionDetail> {
        let response = await this.client?.request({ url: url, method: "GET" });

        let html = response.body;
        let jsonString = this.searchHtmlScriptElement(html);

        try {
            let jsonData = JSON.parse(jsonString);
            let podcastData = jsonData.props.pageProps;
            let podcast = podcastData.show;
            let podcastId = podcastData.showId;
            let episodes = podcastData.episodes;
            let podcastCover = podcast.image ?? "";
            let author = podcast.author;

            let podcastDetail = new ExtensionDetail(id, url, podcast.title);
            podcastDetail.author = author;
            podcastDetail.description = podcast.description;
            podcastDetail.thumbnail = podcastCover;
            podcastDetail.hasChapter = true;
            podcastDetail.type = MediaType.Audio;
            podcastDetail.status = podcast.episodeCount + " episodes";

            let chapters: ItemChapter[] = [];

            episodes.forEach((ep: any) => {
                let id = ep.guid;
                let title = ep.title;
                // let guid = base64Encode(id);
                let guid = btoa(id);
                // https://www.steno.fm/show/6407e0f4-9ca2-55d0-a540-2207d71ff814/episode/NjkzOTU2OGQyYTM4M2RhMTY3NWU4MTVl
                let url = `${this.site.baseUrl}/show/${podcastId}/episode/${guid}`;
                let cover = ep.image.length > 0 ? ep.image : podcastCover;
                let playUrl = ep.enclosureUrl;
                let duration = ep.duration;
                let episode = new ItemChapter(id, url, title);
                chapters.push(episode);

                let audioMedia = new AudioMedia(id, title, playUrl, duration);
                audioMedia.artist = author;
                audioMedia.thumbnail = cover;

                this.mediaMap.set(id, audioMedia);
            });

            let volumes = new ItemVolume("EPISODES", chapters);
            podcastDetail.volumes = [volumes];
            return podcastDetail;
        } catch (error) {
            console.error("Failed to parse JSON data:", error);
            return new ExtensionDetail("-1", "", "Error");
        }
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let audioMedia = this.mediaMap.get(id);
        if (audioMedia) {
            return audioMedia;
        }

        let response = await this.client?.request({ url: url, method: "GET" });
        let html = response.body;
        let jsonString = this.searchHtmlScriptElement(html);

        try {
            let jsonData = JSON.parse(jsonString);
            let podcastData = jsonData.props.pageProps;
            let podcast = podcastData.show;
            let podcastCover = podcast.image ?? "";
            let author = podcast.author;

            let ep = podcastData.episode;
            let id = ep.guid;
            let title = ep.title;

            let cover = ep.image ?? podcastCover;
            let playUrl = ep.enclosureUrl;
            let duration = ep.duration;

            let audioMedia = new AudioMedia(id, title, playUrl, duration);
            audioMedia.artist = author;
            audioMedia.thumbnail = cover;

            this.mediaMap.set(id, audioMedia);

            return audioMedia;
        } catch (error) {
            console.error("Failed to parse JSON data:", error);
        }

        return new AudioMedia("-1", "Not Found", "", 0);
    }

}

(function () {
    const steno = new Steno();
    steno.init();
})();

export default Steno;