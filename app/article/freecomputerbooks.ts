import { Rule } from '@/core/rule';
import { ExtensionList, ExtensionDetail, ExtensionMedia, Extension, SiteUrl, MediaType, ArticleMedia, Channel, ChannelType } from '@/core/extension';

class FreeComputerBooks extends Rule {
    provideExtensionInfo(): Extension {
        let site = new Extension('freecomputerbooks', 'FreeComputerBooks', MediaType.Article);
        site.thumbnail = "https://freecomputerbooks.com/favicon.ico";
        site.baseUrl = "https://freecomputerbooks.com";
        site.description = "Links to Free Programming, Computer, Mathematics, Technical eBooks and Lecture Notes all over the World, Directory of online free programming, computer, engineering, mathematics, technical books, ebooks, lecture notes and tutorials. Very well categorized. Equipped with advanced search engines.";
        site.categoryList = [
            new SiteUrl('Home', 'index.html'),
            new SiteUrl('Math', 'mathCombinatoricsBooks.html'),
            new SiteUrl('MachineLearning', 'compscMachineLearningBooks.html'),
            new SiteUrl('AIgorithm', 'specialOperationResearchBooks.html'),
            new SiteUrl('C', 'langCBooks.html'),
            new SiteUrl('C++', 'langCppBooks.html'),
            new SiteUrl('C#', 'langCSharpBooks.html'),
            new SiteUrl('DATA', 'dbDataVisualizationBooks.html'),
            new SiteUrl('Embedded', 'specialEmbeddedSystemsBooks.html'),
            new SiteUrl('Game', 'compscGameProgrammingBooks.html'),
            new SiteUrl('JAVA', 'javaGuiBooks.html'),
            new SiteUrl('Networks', 'networkComputerBooks.html'),
            new SiteUrl('Python', 'langPythonBooks.html'),
            new SiteUrl('WEB', 'webJavaScriptBooks.html'),
        ];

        site.channel = new Channel(ChannelType.List, "Category", "category");
        site.lang = "en";
        site.useGuide = `## How to get channel category?
1. Go to [FreeComputerBooks](https://freecomputerbooks.com).
2. Select a category from the home page, it must show the list of books.
3. Copy the URL of the category page.
4. Extract the category value from the URL. For example, in the URL "https://freecomputerbooks.com/mobileAndroidProgrammingBooks.html", the category value is "mobileAndroidProgrammingBooks".
5. Use this value as the channel category in the extension.
`;
        return site;
    }

    override async requestItemList(url: string, page: number): Promise<ExtensionList> {
        let categoryApi = this.site.baseUrl + "/" + url;
        let htmlResponse = await this.client.request({ url: categoryApi, method: "GET", });

        let $nodes = $(htmlResponse.body);

        let bookListNodes = $nodes.find('ul#newBooksL li');
        if(bookListNodes.length === 0){
            // Fallback to another selector
            bookListNodes = $nodes.find('ul#newBooksG li');
        }
        let items: ExtensionDetail[] = [];
        bookListNodes.each((index, element) => {
            let ele = $(element);
            let link = ele.find('a').first().attr('href') || "";
            let title = ele.find('a').first().text().trim();
            // /compscMachineLearningBooks.html -> compscMachineLearningBooks
            let id = link.replace('/', '').replace('.html', '');
            let cover = ele.find('img').attr('src') || "";
            cover = cover.replace("_43x55", ""); // get the full cover image

            // Elements of Android Jetpack (Mark L. Murphy) -> Mark L. Murphy
            let authorMatch = title.match(/\(([^)]+)\)/);
            let author = authorMatch ? authorMatch[1] : "";

            let description = ele.find('p').last().text().trim();

            let detail = new ExtensionDetail(id, this.site.baseUrl + link, title);
            detail.thumbnail = this.site.baseUrl + "/" + cover;
            detail.hasChapter = false;
            detail.description = description;
            detail.author = author;
            detail.type = MediaType.Article;
            items.push(detail);
        });

        let extensionList = new ExtensionList(items, page, undefined);
        
        return extensionList;
    }

    override async requestChannelList(key: string, page: number): Promise<ExtensionList> {
        let category = key;
        let url = category + ".html";
        return this.requestItemList(url, page);
    }

    override async requestItemMedia(url: string, id: string): Promise<ExtensionMedia> {
        let htmlResponse = await this.client.request({ url: url, method: "GET", });
        let $nodes = $(htmlResponse.body);

        let bookNode = $nodes.find('div#bookdesc');
        let cover = bookNode.find('td.imageColumn img').attr('src') || "";
        let thumbnail = this.site.baseUrl + "/" + cover;

        let titleNode = bookNode.find('div#booktitle li:eq(0)');
        titleNode.find('b').remove();
        let title = titleNode.text().trim();

        let authorNode = bookNode.find('div#booktitle li:eq(1)');
        authorNode.find('b').remove();
        let author = authorNode.text().trim();

        let dateNode = bookNode.find('div#booktitle li:eq(2)');
        dateNode.find('b').remove();
        let date = dateNode.text().trim();

        let contentNode = bookNode.find('div#bookdesccontent');
        contentNode.find('div.advertisement').remove();
        contentNode.find('ul#newBooksL').remove();
        contentNode.find('b').last().remove();
        contentNode.find('img').remove();

        let media = new ArticleMedia(id, title, `<html><img src="${thumbnail}"><br/>${contentNode.html() || ""}</html>`);
        media.author = author;
        media.date = date;

        return media;
    }
}

(function () {
    const freeComputerBooks = new FreeComputerBooks();
    freeComputerBooks.init();
})();

export default FreeComputerBooks;