import { RuleJest } from "./../core";
import { MediaType, NovelMedia } from "@/core/extension";
import Shuba69 from "@app/novel/69shuba";

describe('69shuba', () => {

    const shuba69Test = new RuleJest(new Shuba69());
    shuba69Test.addExtraHeaders([{
        key: "Cookie", value: "shuba_userverfiy=1765963948@173d5fb0753eb21fd27b6ba175adb751;"
    }]);

    it('should provide extension info', () => {
        const info = shuba69Test.provideExtensionInfo();
        expect(info).toBeDefined();
        expect(info.key).toBe("69shuba");
        expect(info.name).toBe("69书吧");
        expect(info.type).toBe(MediaType.Novel);
    });

    it('test $', async () => {
        let html = ` <li>
                                    <a href="https://www.69shuba.com/book/89432.htm" class="imgbox">
                                        <img src="https://cdn.cdnshu.com/images/nocover.jpg" alt="1" data-src="https://cdn.cdnshu.com/files/article/image/89/89432/89432s.jpg">
                                    <div class="newnav">
                                        <h3><a href="https://www.69shuba.com/book/89432.htm">海贼：从捡到红发断臂开始</a></h3>
                                        <div class="labelbox">
                                            <label>洛城太守</label>
                                            <label>官场职场</label>
                                            <label>连载</label>
                                        </div>
                                        <ol class="ellipsis_2">
                                          人在东海，刚被贝尔梅尔捡回橘子园。
阿龙海贼团入侵在即，还好觉醒献祭系统，捡到红发断臂，夏诺发现献祭那些改变世界线的重要物品，即可获取巨额积分，强化自身。
这什么？古伊娜的大快梯？我吃！这什么，罗杰的绞刑架？我吃！这什么？路飞的草帽？我也吃！我吃吃吃，全吃了！
先发育再出海，到处薅羊毛拿积分，薅秃这
                                        </ol>
                                        <div class="zxzj">
                                            <p><span>最近章节</span>第360章 一年之后</p>
                                        </div>
                                    </div>
                                    <div class="newright">
                                        <div class="piaos">
                                            <span></span><label></label>
                                        </div>
                                        <a class="btn btn-tp" href="https://www.69shuba.com/book/89432.htm">点击阅读</a>
                                        <a class="btn btn-jrsj" rel="nofollow" id="a_addbookcase" href="javascript:;" onclick="addbookcase(89432,0);">加入书架</a>
                                    </div>
                                </li>
                                
                                <li>
                                    <a href="https://www.69shuba.com/book/89920.htm" class="imgbox">
                                        <img src="https://cdn.cdnshu.com/images/nocover.jpg" alt="1" data-src="https://cdn.cdnshu.com/files/article/image/89/89920/89920s.jpg">
                                    <div class="newnav">
                                        <h3><a href="https://www.69shuba.com/book/89920.htm">修仙的我却来到了巫师世界</a></h3>
                                        <div class="labelbox">
                                            <label>食草凯门鳄</label>
                                            <label>玄幻魔法</label>
                                            <label>连载</label>
                                        </div>
                                        <ol class="ellipsis_2">
                                          杰明发现自己穿越了，金手指是修仙百科全书【大道书阁】，可为什么穿越的却是巫师世界？！
星环联邦，深红王庭，虚空建筑院，逆熵联盟……处于大开发时期的巫师文明如狼似虎的对所有发现的位面发动战争。
这是最好的时代，也是最坏的时代。
面对随时有可能变成实验品和即将变成位面战争炮灰的的事实，杰明选择——苟一波，深
                                        </ol>
                                        <div class="zxzj">
                                            <p><span>最近章节</span>第398章 庆典和香火神力</p>
                                        </div>
                                    </div>
                                    <div class="newright">
                                        <div class="piaos">
                                            <span></span><label></label>
                                        </div>
                                        <a class="btn btn-tp" href="https://www.69shuba.com/book/89920.htm">点击阅读</a>
                                        <a class="btn btn-jrsj" rel="nofollow" id="a_addbookcase" href="javascript:;" onclick="addbookcase(89920,0);">加入书架</a>
                                    </div>
                                </li>
                                
                               `;
        let $nodes = $(html);
        let itemNodes = $nodes.filter("li");
        console.log(itemNodes.length);
        // $nodes.children().each((index, element) => {
        //    console.log(element.innerHTML);
        // });
    });

    it('should request item list', async () => {
        const url = "/ajax_novels/class/0/{page}.htm";
        const page = 1;
        const list = await shuba69Test.requestItemList(url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    });

    it('should request item chapter', async () => {
        const url = "https://www.69shuba.com/book/152815/";
        const id = "152815";
        const detail = await shuba69Test.requestItemChapter(url, id);
        console.log(detail);
        expect(detail.id).toBe(id);
        expect(detail.url).toBe("https://www.69shuba.com/book/152815/");
        expect(detail.title).toBe('我在修仙界大器晚成');
        detail.volumes?.forEach(v => {
            console.log(v);
            console.log(v.chapters.length);
            v.chapters.forEach(c => {
                expect(c.id).toBeDefined();
                expect(c.url).toBeDefined();
                expect(c.name).toBeDefined();
            });
        });
    });

    it('search item list', async () => {
        const keyword = "都市";
        const url = `https://www.69shuba.com/modules/article/search.php`;
        const page = 1;
        const list = await shuba69Test.searchItemList(keyword,url, page);
        console.log(list);
        list.items.forEach(item => {
            expect(item.url).toBeDefined();
            expect(item.title).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.category).toBeDefined();
            expect(item.author).toBeDefined();
            expect(item.hasChapter).toBe(true);
        });
        expect(list.items.length).toBeGreaterThan(0);
    });

    it('request item media', async () => {
        const url = "https://www.69shuba.com/book/152815/49492960.html";
        const id = "49492960.html";
        const media = await shuba69Test.requestItemMedia(url, id);
        console.log(media);
        expect(media).toBeInstanceOf(NovelMedia);
        let novelMedia = media as NovelMedia;
        expect(novelMedia.id).toBe(id);
        expect(novelMedia.content.length).toBeGreaterThan(0);
        expect(novelMedia.title).toBe('第一章 平平无奇的大师兄');
    });
});
