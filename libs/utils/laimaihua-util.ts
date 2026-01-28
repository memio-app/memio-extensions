
import CryptoJS from 'crypto-js';


var hostym = "";
function gethost(): string {
    var hosts = ["mhpic5eer.tgmhfc.uk", "mhpic7899-5.tgmhfc.uk", "mhpic7ffr.tgmhfc.uk", "mhpicwwt.tgmhfc.uk", "mhpicwwx.tgmhfc.uk"];
    let ddl = Math.round(Math.random() * 4);
    let realurlsj = "https://" + hosts[ddl];
    return realurlsj;
}

function getpicdamin(chapterId: string): string {
    if (hostym && hostym != "") {
        return hostym;
    }
    //if (parseInt(cid)>10000){

    let yuming = "https://mhpic6.tgmhfc.uk";
    // }else{

    //yuming="https://mhpic7.kingwar.cn"; 
    //}

    if (parseInt(chapterId) > 542724) {
        yuming = gethost();
        hostym = yuming;
    }


    //console.log(yuming);
    //if (parseInt(currentChapterid)>885032)      
    //yuming="https://mhpic88.kingwar.cn";
    //if (parseInt(currentChapterid)>946358)      
    //yuming="https://mhpic5.kingwar.cn";

    return yuming;
}



function getremoteqqurl(qqurl: string) {
    // http://ac.tc.qq.com/store_file_download?buid=15017&uin=521341&dir_path=/mif800/8/99/519899/73/&name=1369.mif2;
    var bym = "http://img11.hgysxz.cn"
    var v = qqurl;
    var qqurlarr = qqurl.split("dir_path=/");
    var qqfilename = qqurlarr[1].replace("&name=", "");
    qqfilename = qqfilename.replace("mif2", "jpg");
    qqfilename = qqfilename.replace("ori", "jpg");
    qqfilename = qqfilename.replace(/\//g, "_");
    var u = "http://img11.aoyuanba.com/pictmdown.php?p=" + btoa(v) + "&sf=" + qqfilename + "&ym=" + bym;
    //alert(u);
    return u;
}

function getkekerealurl(urlstr: string): string {
    var realurl = urlstr;
    var ServerList = new Array(16);
    ServerList[0] = "http://2.99manga.com:9393/dm01/";
    ServerList[1] = "http://2.99manga.com:9393/dm02/";
    ServerList[2] = "http://2.99manga.com:9393/dm03/";
    ServerList[3] = "http://2.99manga.com:9393/dm04/";
    ServerList[4] = "http://2.99manga.com:9393/dm05/";
    ServerList[5] = "http://2.99manga.com:9393/dm06/";
    ServerList[6] = "http://2.99manga.com:9393/dm07/";
    ServerList[7] = "http://2.99manga.com:9393/dm08/";
    ServerList[8] = "http://2.99manga.com:9393/dm09/";
    ServerList[9] = "http://2.99manga.com:9393/dm10/";
    ServerList[10] = "http://2.99manga.com:9393/dm11/";
    ServerList[11] = "http://2.99manga.com:9393/dm12/";
    ServerList[12] = "http://2.99manga.com:9393/dm13/";
    ServerList[13] = "http://2.99manga.com:9393/dm14/";
    ServerList[14] = "http://2.99manga.com:9393/dm15/";
    ServerList[15] = "http://2.99manga.com:9393/dm16/";


    if (realurl.indexOf("/dm01/") != -1) {

        realurl = ServerList[0] + realurl.split("/dm01/")[1];

    }
    else if (realurl.indexOf("/dm02/") != -1) {

        realurl = ServerList[1] + realurl.split("/dm02/")[1];
    }
    else if (realurl.indexOf("/dm03/") != -1) {

        realurl = ServerList[2] + realurl.split("/dm03/")[1];
    }
    else if (realurl.indexOf("/dm04/") != -1) {

        realurl = ServerList[3] + realurl.split("/dm04/")[1];
    }
    else if (realurl.indexOf("/dm05/") != -1) {

        realurl = ServerList[4] + realurl.split("/dm05/")[1];
    }
    else if (realurl.indexOf("/dm06/") != -1) {

        realurl = ServerList[5] + realurl.split("/dm06/")[1];
    }
    else if (realurl.indexOf("/dm07/") != -1) {

        realurl = ServerList[6] + realurl.split("/dm07/")[1];
    }
    else if (realurl.indexOf("/dm08/") != -1) {

        realurl = ServerList[7] + realurl.split("/dm08/")[1];
    }
    else if (realurl.indexOf("/dm09/") != -1) {

        realurl = ServerList[8] + realurl.split("/dm09/")[1];
    }
    else if (realurl.indexOf("/dm10/") != -1) {

        realurl = ServerList[9] + realurl.split("/dm10/")[1];
    }
    else if (realurl.indexOf("/dm11/") != -1) {

        realurl = ServerList[10] + realurl.split("/dm11/")[1];
    }
    else if (realurl.indexOf("/dm12/") != -1) {

        realurl = ServerList[11] + realurl.split("/dm12/")[1];
    }
    else if (realurl.indexOf("/dm13/") != -1) {

        realurl = ServerList[12] + realurl.split("/dm13/")[1];
    }
    else if (realurl.indexOf("/dm14/") != -1) {

        realurl = ServerList[14] + realurl.split("/dm14/")[1];
    }
    else if (realurl.indexOf("/dm15/") != -1) {

        realurl = ServerList[14] + realurl.split("/dm15/")[1];
    }
    else {

        realurl = realurl;
    }
    return realurl;
}


function getrealurl(urlstr: string, chapterId: string): string {
    var realurl = urlstr;

    if (realurl.indexOf("img1.fshmy.com") != -1) {

        realurl = realurl.replace("img1.fshmy.com", "img1.hgysxz.cn");
    }
    else if (realurl.indexOf("imgs.k6188.com") != -1) {

        realurl = realurl.replace("imgs.k6188.com", "imgs.zhujios.com");
    }
    else if (realurl.indexOf("073.k6188.com") != -1) {

        realurl = realurl.replace("073.k6188.com", "cartoon.zhujios.com");
    }
    else if (realurl.indexOf("cartoon.jide123.cc") != -1) {

        realurl = realurl.replace("cartoon.jide123.cc", "cartoon.shhh88.com");
    }
    else if (realurl.indexOf("imgs.gengxin123.com") != -1) {

        realurl = realurl.replace("imgs.gengxin123.com", "imgs1.ysryd.com");
    }
    else if (realurl.indexOf("www.jide123.com") != -1) {

        realurl = realurl.replace("www.jide123.com", "cartoon.shhh88.com");
    }
    else if (realurl.indexOf("cartoon.chuixue123.com") != -1) {

        realurl = realurl.replace("cartoon.chuixue123.com", "cartoon.shhh88.com");
    }
    else if (realurl.indexOf("p10.tuku.cc:8899") != -1) {

        realurl = realurl.replace("p10.tuku.cc:8899", "tkpic.tukucc.com");
    }
    else if (realurl.indexOf("http://") == -1) {
        realurl = encodeURI(getpicdamin(chapterId) + realurl);
    }

    return realurl;

}

function ithmsh(nummhstr: string): string {
    var x, num_out, num_in, str_out;
    var realstr: string;
    x = nummhstr.replace("JLmh160", "");
    realstr = x;

    var PicUrlArr1 = x.split("$qingtiandy$");
    PicUrlArr1.forEach((value, index) => {
        let k = index;
        str_out = "";
        num_out = PicUrlArr1[k];
        for (var i = 0; i < num_out.length; i += 2) {
            num_in = parseInt(num_out.substr(i, 2)) + 23;
            num_in = unescape('%' + num_in.toString(16));
            str_out += num_in;
        }
        realstr = realstr.replace(num_out, unescape(str_out));
    });
    return realstr;
}

function base64Decode(input: string): string {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(input));
}

declare global {
    interface String {
        splic(f: string): string[];
    }
}

String.prototype.splic = function (f) {
    return (base64Decode(String(this)) || "").split(f)
};

export function getImageUrls(picTree: string): string[] {
    var PicUrls = picTree;

    if (PicUrls.indexOf("mh160tuku") == -1) {
        PicUrls = base64Decode(picTree);
    }
    if (PicUrls.indexOf("JLmh160") != -1) {
        PicUrls = ithmsh(PicUrls);
    }
    var PicUrlArr = PicUrls.split("$qingtiandy$");
    return PicUrlArr;
}


export function getDecodePic(pic: string, chapterId: string, cid: string): string {

    var v = pic;
    var v1 = "";
    var s = "";

    if (v.indexOf("qq.com/store_file_download") != -1) {

        //alert(v);
        s = getremoteqqurl(v);
    }
    else if (v.indexOf("/ok-comic") != -1) {
        v = getkekerealurl(v);

        //alert(v);
        s = "http://img5.aoyuanba.com/pictmdown.php?p=" + btoa(v);
    }
    else if (v.indexOf("mangafiles.com") != -1) {

        s = "http://img6.aoyuanba.com:8056/pictmdown.php?p=" + btoa(v);
    }
    else if (v.indexOf("imgs.gengxin123.com") != -1) {
        var bym = "http://www.kxdm.com/";
        v1 = v.replace("imgs.gengxin123.com", "imgs1.ysryd.com");
        s = "http://imgsty1.aoyuanba.com/pictmdown.php?bu=" + bym + "&p=" + btoa(v1);

    }
    else if (v.indexOf("imgs1.ysryd.com") != -1) {
        var bym = "http://www.kxdm.com/";
        s = "http://imgsty1.aoyuanba.com/pictmdown.php?bu=" + bym + "&p=" + btoa(v);

    }
    else if (v.indexOf("dmzj.com") != -1) {
        var bym = "http://manhua.dmzj.com/";
        v = encodeURI(v);

        //alert(v);
        s = "http://imgsty.aoyuanba.com/pictmdown.php?bu=" + bym + "&p=" + btoa(v);
    }
    else if (v.indexOf("imgsrc.baidu.com") != -1) {

        //s="http://www.mh160.com/qTcms_Inc/qTcms.Pic.FangDao.asp?p="+base64_encode(v);
        s = "http://img7.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("sinaimg.cn") != -1) {

        s = "http://img7.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("jumpcn.cc") != -1) {

        s = "http://img7.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("bbs.zymk.cn") != -1) {
        s = "http://img7.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("zhujios.com") != -1) {

        s = "http://img8.hgysxz.cn/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("cartoon.akshk.com") != -1) {

        s = "http://img7.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p=" + btoa(v);
    }
    else if (v.indexOf("JLmh160") != -1) {

        //s="http://img3.aoyuanba.com/picinc/qTcms.Pic.FangDao.asp?p="+base64_encode(v);      
        // s="http://img3.aoyuanba.com/mh160/"+v+".jpg";
        s = "http://d.mh160.com/d/decode/?p=" + v + "&bid=" + parseInt(cid);
    }

    else {
        s = getrealurl(v, chapterId);
    }
    return s

}