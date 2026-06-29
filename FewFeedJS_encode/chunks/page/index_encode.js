(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[5405], {
  48312: function (e, o, t) {
    (window.__NEXT_P = window.__NEXT_P || []).push(["/", function () {
      return t(17134);
    }]);
  },
  17134: function (e, o, t) {
    "use strict";

    t.r(o);
    t.d(o, {
      default: function () {
        return x;
      }
    });
    var s = t(85893);
    var l = t(67294);
    let _Component4 = l.forwardRef(function (e, o) {
      return l.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: o
      }, e), l.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      }));
    });
    let _Component = l.forwardRef(function (e, o) {
      return l.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        "aria-hidden": "true",
        ref: o
      }, e), l.createElement("path", {
        fillRule: "evenodd",
        d: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
        clipRule: "evenodd"
      }));
    });
    var r = t(73214);
    let _Component5 = l.forwardRef(function (e, o) {
      return l.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        "aria-hidden": "true",
        ref: o
      }, e), l.createElement("path", {
        fillRule: "evenodd",
        d: "M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z",
        clipRule: "evenodd"
      }), l.createElement("path", {
        d: "M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z"
      }));
    });
    var p = t(33299);
    var g = t(89755);
    var c = t.n(g);
    var d = t(9473);
    var u = t(11163);
    var m = t(85518);
    function _Component3(e) {
      let {
        title: t,
        description: l,
        is_off: a,
        images: i,
        path: r,
        is_admin: n,
        version: g,
        preview: h,
        role: w,
        is_dev: b,
        is_maintenance: f,
        froce_m: x
      } = e;
      let v = (0, d.v9)(e => e.fb_init);
      let y = (0, u.useRouter)();
      let j = (0, d.v9)(e => e.user);
      let {
        ID: k
      } = v.account;
      let {
        version: N
      } = v.info;
      if (b || n && (j == null ? undefined : j.data?.role) != 1) {
        return <s.Fragment />;
      } else {
        const Component = c();
        return <div className={` w-full h-64 bg-white shadow-md rounded-xl   flex flex-col justify-between space-y-4 overflow-hidden ${f ? "opacity-50 cursor-none select-none " : ""}  ${a ? "bg-gray-100" : " bg-white"}`}><div className={` ${a ? "bg-red-600" : w >= 4 ? " bg-yellow-200" : " bg-blue-50"} flex  justify-between items-start   p-3`}><div className=" flex items-start space-x-1 relative  ">{i.map(e => <div className=" relative w-8 h-8 border-2 border-gray-200 rounded-full overflow-hidden "><Component src={e} layout="fill" objectFit="cover" /></div>)}</div>{a ? <button className=" text-[9px] py-1 px-2 bg-gray-700 rounded-md text-white">NOT WORK</button> : <button className=" text-[9px] py-1 px-2 bg-blue-600 rounded-md text-white" onClick={() => h && window.open(h, "_blank").focus()}>Preview</button>}</div><div className=" flex-1 flex flex-col  px-3  space-y-3"><h2 className=" font-extrabold">{t}</h2><p className=" text-gray-500 text-[10px]">{l}</p></div><div className=" px-3 pb-3">{(j == null ? undefined : j.data) ? k ? N && x && m.tq && N < g ? <button className=" w-full bg-slate-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://drive.google.com/file/d/15sruJDna69VM6Fe0LBb7gL_1wtQhSH0N/view?fbclid=IwAR1QP3hblqmgO-xCJT7cDvtAxypiZe9rQgw4CEkvi_8352v6t3bBIu5RyAw";
            }}>Update Chrome Extension</button> : N && !x && N < g ? <button className=" w-full bg-slate-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://drive.google.com/file/d/15sruJDna69VM6Fe0LBb7gL_1wtQhSH0N/view?fbclid=IwAR1QP3hblqmgO-xCJT7cDvtAxypiZe9rQgw4CEkvi_8352v6t3bBIu5RyAw";
            }}>Update Chrome Extension</button> : f ? <button className=" w-full bg-gray-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm">On fixing / Dead Tool :(</button> : w && j.data.role > w && w == 4 ? <button className=" w-full bg-gray-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm">Only Basic Plan +</button> : w && j.data.role > w && w == 3 ? <button className=" w-full bg-gray-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm">Only Pro Plan +</button> : <button className=" select-none w-full bg-yellow-400 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => y.push(r)}>Use this tool</button> : <button className=" w-full bg-gray-400 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://www.facebook.com/";
            }}>Login FB to use</button> : <button className=" w-full bg-gray-400 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => (0, p.signIn)()}>Login to use</button>}</div></div>;
      }
    }
    var w = t(14542);
    var b = t(52211);
    function _Component2(e) {
      let {
        title: t,
        description: l,
        images: a,
        path: i,
        is_admin: r,
        version: n,
        preview: p,
        role: g,
        is_dev: h,
        is_maintenance: w,
        froce_m: b
      } = e;
      let f = (0, d.v9)(e => e.fb_init);
      let x = (0, u.useRouter)();
      let v = (0, d.v9)(e => e.user);
      let {
        ID: y
      } = f.account;
      let {
        version: j
      } = f.info;
      if (h || r && (v == null ? undefined : v.data?.role) > 2) {
        return <s.Fragment />;
      } else {
        const Component2 = c();
        return <div className={` w-full h-64 bg-white shadow-md rounded-xl   flex flex-col justify-between space-y-4 overflow-hidden ${w ? "opacity-50 cursor-none select-none " : ""}`}><div className=" flex  justify-between items-start  bg-green-50  p-3"><div className=" flex items-start space-x-1 relative  ">{a.map(e => <div className=" relative w-8 h-8 border-2 border-yellow-200 rounded-full overflow-hidden "><Component2 src={e} layout="fill" objectFit="cover" /></div>)}</div><button className=" text-[9px] py-1 px-2 bg-gray-600 rounded-md text-white" onClick={() => p && window.open(p, "_blank").focus()}>Preview</button></div><div className=" flex-1 flex flex-col  px-3  space-y-3"><h2 className=" font-extrabold">{t}</h2><p className=" text-gray-500 text-[10px]">{l}</p></div><div className=" px-3 pb-3">{/\d{5,}/g.test(y) ? j && b && m.tq && j < n ? <button className=" w-full bg-slate-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://drive.google.com/file/d/15sruJDna69VM6Fe0LBb7gL_1wtQhSH0N/view?fbclid=IwAR1QP3hblqmgO-xCJT7cDvtAxypiZe9rQgw4CEkvi_8352v6t3bBIu5RyAw";
            }}>Update Chrome Extension</button> : j && !b && j < n ? <button className=" w-full bg-slate-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://drive.google.com/file/d/15sruJDna69VM6Fe0LBb7gL_1wtQhSH0N/view?fbclid=IwAR1QP3hblqmgO-xCJT7cDvtAxypiZe9rQgw4CEkvi_8352v6t3bBIu5RyAw";
            }}>Update Chrome Extension</button> : w ? <button className=" w-full bg-gray-500 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm">On fixing / Dead Tool :(</button> : <button className=" select-none w-full bg-blue-400 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => x.push(i)}>Use this tool</button> : <button className=" w-full bg-gray-400 rounded-lg py-1 shadow-sm shadow-blue-100 text-white text-sm" onClick={() => {
              window.location.href = "https://www.facebook.com/";
            }}>Login FB to use</button>}</div></div>;
      }
    }
    var x = () => {
      let e = (0, d.v9)(e => e.fb_init);
      let o = (0, d.v9)(e => e.user);
      (0, d.I0)();
      let {
        account: t,
        info: l
      } = e;
      let {
        update: g,
        status: u
      } = (0, p.useSession)();
      let m = (t == null ? undefined : t.instagram_token) || (t == null ? undefined : t.ads_token) || null;
      const Component3 = c();
      return <div className=" flex flex-col "><div className=" flex flex-col space-y-5"><div className="rounded-2xl bg-white bg-opacity-60 mt-5  shadow-sm  overflow-hidden" style={{
            backdropFilter: "blur(10px)"
          }}><div onClick={() => g()} className=" w-full h-14 bg-yellow-100  bg-opacity-20   shadow-sm py-3 px-4 flex justify-between items-center" style={{
              backdropFilter: "blur(10px)"
            }}>{(t == null ? undefined : t.name) ? <div className=" flex space-x-3 justify-start">{m ? <img src={`https://graph.facebook.com/${t.ID}/picture?type=small&access_token=${m}`} referrerPolicy="no-referrer" alt="" className="w-7 h-7 rounded-full border border-yellow-400" /> : <div className=" relative w-8 h-8 border-2 border-blue-200 rounded-full overflow-hidden "><Component3 src="/images/ck.jpeg" layout="fill" objectFit="cover" /></div>}<div className=" justify-start"><h3 className=" text-sm text-gray-600">{(0, w.jP)(t.name).replace(/\\/g, "")}</h3><p className=" text-[8px] text-gray-500">{t.ID}</p></div></div> : <div className="animate-pulse flex space-x-2"><div className="rounded-full bg-gray-200 h-8 w-8" /><div className="flex-1 space-y-1 py-1"><div className="h-2 bg-gray-200 rounded" /><div className="space-y-3"><div className="grid grid-cols-5 gap-4"><div className="h-2 bg-gray-200 rounded col-span-4" /><div className="h-2 bg-gray-200 rounded col-span-1" /></div></div></div></div>}{(o == null ? undefined : o.data) && <div className="flex flex-col  rounded-md bg-blue-100 bg-opacity-50 overflow-hidden p-1 shadow-inner "><p className=" text-xs font-bold text-gray-600 text-center">{(o == null ? undefined : o.data.role) === 1 ? "ADMIN 🎖" : (o == null ? undefined : o.data.role) === 2 ? "MODERATOR 🏅" : (o == null ? undefined : o.data.role) === 3 ? "PROFESSIONAL 🏆" : (o == null ? undefined : o.data.role) === 4 ? "BASIC 🎗" : "FREE 🥉"}</p><div className=" flex space-x-2 text-xs text-gray-500  border-b-2  border-blue-100"><p>DAYS LEFT :</p> <p className=" font-bold">{(0, b.A)(o == null ? undefined : o.data.expired_at) < 1 ? 0 : (0, b.A)(o == null ? undefined : o.data.expired_at)}</p></div></div>}</div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><_Component className=" w-4 h-4 text-yellow-600" /> <h1 className=" font-extrabold  text-sm">FREE TOOLS & NO LOGIN REQUIRED </h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component2 version={11} preview="https://www.youtube.com/watch?v=tWUyJbtIy_w&t=3s" title="Auto Post To Facebook Groups PRO 2023" description="Post to multiple groups in one click support [video,photos] BY JERA" images={["/logos/fb.png", "/logos/fbgp.png", "/logos/frog.jpg"]} path="/tool/auto-post-fb-group" /><_Component2 version={11} preview="https://www.youtube.com/watch?v=8RpOO1WHeGc" title="Auto Join To Facebook Groups PRO 2023" description="Automatic join multiple facebook groups by List of group ID support [threads , accept rules , answer every type of questions] by Cyber Hermit" images={["/logos/fb.png", "/logos/fbgp.png", "/logos/wi.jpg"]} path="/tool/auto-join-fb-group" /><_Component2 version={11} preview="https://www.youtube.com/watch?v=P7Dw7tF3xU8" title="Auto Comment Facebook Groups PRO 2023" description="Automatic Comment To Multiple Facebook Groups BY CRYBOII " images={["/logos/fb.png", "/logos/fbgp.png", "/logos/cm.png"]} path="/tool/auto-comment-fb-group" /><_Component2 version={11} is_dev={true} preview="https://www.youtube.com/watch?v=P7Dw7tF3xU8" title="Messenger Spam PRO 2023" description="Automatic Comment To Multiple Facebook Groups BY CRYBOII " images={["/logos/fb.png", "/logos/fbgp.png", "/logos/cm.png"]} path="/tool/messenger-spam" /></div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><r.Z className=" w-4 h-4 text-orange-400" /> <h1 className=" font-extrabold  text-sm">FEATURED TOOLS</h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component3 version={8} preview="https://www.youtube.com/watch?v=c8a7J8T7qQU" title="Page Story Post " description=" Auto bot reply comments in realtime " is_dev={true} images={["/logos/fb.png", "/logos/pfb.png", "/logos/gfb.png"]} path="/tool/page-story-post" /><_Component3 version={8} preview="https://www.youtube.com/watch?v=c8a7J8T7qQU" title="Page Posts Auto Reply Comments (BOT)" description=" Auto bot reply comments in realtime " images={["/logos/fb.png", "/logos/pfb.png", "/logos/gfb.png"]} path="/tool/page-comments-bot" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Group Posts Booking" is_admin={true} description="Remove all Potential spam Posts in group that you are moderator or admin, and make your group green again " images={["/logos/fb.png", "/logos/rm.jpg", "/logos/fbgp.png"]} path="/tool/group-booking" /><_Component3 froce_m={true} version={8} title="Facebook Video Carousel Post" description="Get more chance for people like, and follow to your pages" images={["/logos/fb.png"]} path="/tool/fb-video-carousel" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Group Manager Tools" description=" Avanced tools for group admin and moderator [remove preapproved members, banned members, member posts, and more] " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/admin-groups-manager" /><_Component3 version={8} title="Swipe Up Video Creator " description="Create Swipe Up Videos to boost your website's traffic and significantly increase post reach. These posts only appear on mobile app newsfeeds " images={["/logos/fb.png", "/logos/pfb.png", "/logos/gfb.png"]} path="/tool/swipe-up-video" /><_Component3 froce_m={true} version={8} preview="https://www.youtube.com/watch?v=0bHmq0-DTgs" title="Clone FB Reels & Video to carousel" description="Clone Reels & Video to carousel post just one click !!!" images={["/logos/fb.png", "/logos/reel.jpg"]} path="/tool/fb-clone-video-reel" /><_Component3 version={15} preview="https://www.youtube.com/watch?v=5HU9NIaC3ls&ab_channel=JERA" title="Claim Groups as Admin" description=" Claim any facebook groups that dosen't have admin" images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/make-me-admin" /><_Component3 froce_m={true} version={8} preview="https://www.youtube.com/watch?v=0bHmq0-DTgs" title="TikTok To Carousel Post" description="Clone tiktok video to carousel post just one click !!!" images={["/logos/fb.png", "/logos/tiktok.png"]} path="/tool/tiktok-pe-clone" /><_Component3 version={15} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Pro Bulk Search Facebook Group" description="Automatic bulk searching Groups by Keywords " images={["/logos/fb.png", "/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/group-bulk-search" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Emergency Group Posts Remover" description="Remove posts in public group that you are moderator or admin " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/group-posts-remover" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Group Posts Potential Spam Cleaner" description="Remove all Potential spam Posts in group that you are moderator or admin, and make your group green again " images={["/logos/fb.png", "/logos/rm.jpg", "/logos/fbgp.png"]} path="/tool/group-posts-spam-remover" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Group Pending Posts Remover " description="Remove all Pending Posts in group that you are moderator or admin, and make your group green again " images={["/logos/fb.png", "/logos/rm.jpg", "/logos/fbgp.png"]} path="/tool/group-pending-posts-remover" /><_Component3 froce_m={true} version={8} preview="https://www.youtube.com/watch?v=m--LopID_Ug" title="Facebook 2 Card Video Carousel Post" description="Create 2 video card Carousel Get more chance for people like, and follow to your pages" images={["/logos/fb.png"]} path="/tool/fb-videos-carousel" /><_Component3 version={7} preview="https://www.youtube.com/watch?v=m--LopID_Ug" title="UP TO REELS" description="Bulk upload mutiple videos to reels & Clone any tiktok to facebook reel. not recommended  to upload more than 20 reels in short time " images={["/logos/gfb.png", "/logos/reel.jpg"]} path="/tool/up-to-reels" /><_Component3 version={8} title="Generate One Card V2" description="Create One Card Post with fake albums clickbait (this tool required active ad account) " images={["/logos/gfb.png", "/logos/pfb.png"]} path="/tool/pe-one-card-v2" /><_Component3 is_dev={true} version={8} title="Generate One Card V2" description="Create One Card Post with fake albums clickbait (this tool required active ad account) " images={["/logos/gfb.png", "/logos/pfb.png"]} path="/tool/groups-extractor-v2" /><_Component3 version={8} title="Page Bulk Images Uploader" description="Post & Schedule multilpe images to your page just one click " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/page-pics-posts" /><_Component3 is_dev={true} version={8} title="Group F" description="Post & Schedule multilpe images to your page just one click " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/group-post-f" /><_Component3 version={8} title="Page Posts With Colors Background" description="Post text with background color to your page just one click " images={["/logos/fb.png", "/logos/pfb.png", "/logos/gfb.png"]} path="/tool/page-post-color-bg" /><_Component3 froce_m={true} version={8} title="Sort Facebook Reels" description="Reels Sorting Tool for Facebook: Views, Length & Creation Time" images={["/logos/fb.png", "/logos/reel.jpg"]} path="/tool/reels-sort" /></div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><_Component4 className=" w-4 h-4 text-blue-500" /> <h1 className=" font-extrabold  text-sm">BASIC+ TOOLS</h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component3 version={15} preview="https://www.youtube.com/watch?v=h5DsNPRUuv0" role={4} is_off={true} title="Extract Groups List From Facebook Post" description="extract groups list from facebook post (re-opened) " images={["/logos/gfb.png"]} path="/tool/get-groups-from-posts" /><_Component3 froce_m={true} version={8} role={4} preview="https://www.youtube.com/watch?v=qxo7I7IwCFA" title="Bulk Generate One Card Link" description="Bulk generate one card links by urls (this tool required active ad account) " images={["/logos/gfb.png", "/logos/pfb.png", "/logos/cpfb.jpg"]} path="/tool/pe-one-card-bulk" /><_Component3 froce_m={true} version={8} role={4} preview="https://www.youtube.com/watch?v=KB91Dv3U8mc" title="Page Posts Analyzer (Viral Finder)" description="Become Re-Content master get most viral posts from any facebook page" images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/page-posts-analyze" /><_Component3 froce_m={true} version={8} role={4} title="Clone Carousel Post (PE Clone)" description="Clone any carousel post just one click .." images={["/logos/fb.png", "/logos/ca.png"]} path="/tool/fb-clone-video-pe" /><_Component3 froce_m={true} version={8} role={4} preview="https://www.youtube.com/watch?v=wqN1NRhJqLc" title="Page Posts DEEP CLONE" description="Clone Content From any facebook pages to your own page, this tool support [album,video,picture,link,caption]" images={["/logos/fb.png", "/logos/pfb.png", "/logos/ca.png"]} path="/tool/page-posts-clone" /><_Component3 version={1} role={4} preview="https://www.youtube.com/watch?v=n-AZcszC9S4" title="Public Group Posts Analyzer (Viral Finder)" description="Become Re-Content master get most viral posts from any facebook public groups" images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/group-posts-analyze" /><_Component3 froce_m={true} version={8} role={4} title="Picture Carousel Post (PE Post)" description="Picture carousel post just one click .." images={["/logos/fb.png", "/logos/cpfb.jpg"]} path="/tool/fb-picture-carousel" /><_Component3 version={1} preview="https://www.youtube.com/watch?v=h5DsNPRUuv0" role={4} is_off={true} title="Get Public  Groups From Any FB Profile " description="See which groups they are joined, this is quite useful for social engineering , reconnaissance ..etc / see what people are interested with  " images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/get-groups-from-uid" /><_Component3 version={3} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Admin Group Posts Cleaner V2" role={4} description="Delete All Posts in your groups that you are admin or moderator " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/group-posts-delete" /><_Component3 version={15} role={4} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Scan Group IDs and Get Group Information" description="Extract group information by bulk scanning group IDs. get details such as group name, member count, daily posts, admin, and location " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/get-gid-info" /><_Component3 role={3} is_dev={true} is_off={true} version={1} preview="https://youtu.be/ojZWoZiP-Hc" title="Magic Link Generator " description="Useful for who work with affiliate (Shopee / Lazada / etc) which convert text to clickable link (This Trick Only work with group posting) " images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/gen-magic-link" /><_Component3 version={3} role={4} preview="https://www.youtube.com/watch?v=sb575VDpDAM" title="High Speed Page Posts Remover " description="Bulk remove page posts by range of date / contents type, support multiple threads 100% clean all posts in your page " images={["/logos/fb.png", "/logos/rm.jpg", "/logos/pfb.png"]} path="/tool/page-posts-remover" /><_Component3 version={8} role={4} title="Page Posts Manager Pro " description=" Select multiple posts and delete them all at once, hide them from your page , and change date of posts, You can also hide/delete/change date posts by date range or content type. " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/page-posts-manager" /></div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><_Component5 className=" w-4 h-4 text-pink-500" /> <h1 className=" font-extrabold  text-sm">FREE TOOLS </h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component3 version={7} title="Extract Groups IDs Where Post Shared" description="Reverse sharing copying sources of share post from someone who is spamming, and creating your own list of groups to share with. (Slow)" images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/extract-gid-from-shared-post" /><_Component3 froce_m={true} version={8} title="Facebook One Card Video Post" description="Generate One Card Video With Like Buttons" images={["/logos/fb.png"]} path="/tool/fb-one-card-video-carousel" /><_Component3 version={1} title="Share Link To Multiple Pages" description="Share link Post to multiple pages" images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/fb-share-to-pages" /><_Component3 preview="https://www.youtube.com/watch?v=cW3H5ocuQ0c" version={7} title="Facebook One Card Link Image Post" description="Generate big scale Link cover image post with Put display website" images={["/logos/gfb.png", "/logos/fb.png", "/logos/cpfb.jpg"]} path="/tool/fb-one-card-picture-carousel" /><_Component3 version={1} title="Extract UIDs from post" description="Extract facebook UID (User ID) from any facebook posts" images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/extract-uid-from-post" /><_Component3 version={1} title="Extract UIDs from group " description="Extract facebook UID (User ID)of group members from any groups" images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/extract-uid-from-group" /><_Component3 version={7} preview="https://www.youtube.com/watch?v=cpos37JvfMA" title="Bulk Extract Groups List  From Hashtags" description="Get a list of groups and IDs by bulk scanning hashtags. This tool is useful for finding relevant groups to share your posts with." images={["/logos/gfb.png", "/logos/fbgp.png"]} path="/tool/get-groups-by-hashtag" /><_Component3 version={8} title="Page Posts Hide Helper " description="Bulk Hide posts in your page by range of date / contents type, support multiple threads " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/page-posts-hidden" /><_Component3 version={8} title="Hidden Posts Remover " description="Bulk remove hidden posts in your page by range of date / contents type, support multiple threads " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/page-posts-hidden-remover" /></div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><_Component5 className=" w-4 h-4" /> <h1 className=" font-extrabold  text-sm">EXPERIMENTAL TOOLS </h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component3 version={1} title="Auto Create Multiple Facebook Pages" description=" Creating Pages Profile with business account " images={["/logos/fb.png", "/logos/pfb.png"]} path="/tool/create-bm-pages" /><_Component3 version={4} preview="https://www.youtube.com/watch?v=30JDi7l4K44" title="Bulk Share Groups With Pages" description=" Share post to groups with pages (Please do not use your main account this tool can be risk to get spam) " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/page-profiles-to-groups" /><_Component3 is_dev={true} version={4} preview="https://www.youtube.com/watch?v=98qypFcj0IQ" title="Bulk send messenger With Multiple Pages" description=" Send messenger in to direct message of any facebook account ny using multiple pages (Pages need to be admin atleast 1 groups) " images={["/logos/gfb.png", "/logos/fbgp.png", "/logos/pfb.png"]} path="/tool/pages-msg-uid" /><_Component3 version={4} is_dev={true} preview="https://www.youtube.com/watch?v=30JDi7l4K44" title="Make Gif Post and Go to your custom site" description=" Help you increase traffic with clickable gift " images={["/logos/fb.png", "/logos/fbgp.png"]} path="/tool/gif-to-link" /></div><div className=" flex space-x-3 text-gray-600 px-3 pt-3 md:pt-8"><r.Z className=" w-4 h-4" /> <h1 className=" font-extrabold  text-sm">V3 TOOLS</h1></div><div className=" grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 gap-4 p-3"><_Component3 version={3} preview="https://www.youtube.com/watch?v=GL3IG5fsC0A" title="Multi FB Groups Share Post" description="Share post to multiple groups, with multiple accounts rotation" images={["/logos/fb.png"]} path="/tool/v3-groups-share" /></div></div></div></div>;
    };
  },
  73214: function (e, o, t) {
    "use strict";

    var s = t(67294);
    let l = s.forwardRef(function (e, o) {
      return s.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        "aria-hidden": "true",
        ref: o
      }, e), s.createElement("path", {
        fillRule: "evenodd",
        d: "M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z",
        clipRule: "evenodd"
      }));
    });
    o.Z = l;
  }
}, function (e) {
  e.O(0, [9774, 2888, 179], function () {
    return e(e.s = 48312);
  });
  _N_E = e.O();
}]);