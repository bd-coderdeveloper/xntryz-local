const DOMAINS = ["localhost", "vercel.app", "upfeedv2.vercel.app", "upfeedth.com"];
const ALL_RESOURCE_TYPES = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "webtransport", "webbundle", "other"];
const FAKE_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36";
const _0x1945c1 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||upload-business.facebook.com"
};
const _0x364576 = {
  id: 1,
  priority: 1,
  condition: _0x1945c1,
  action: {
    type: "modifyHeaders",
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }, {
      header: "Access-Control-Allow-Credentials",
      operation: "set",
      value: "true"
    }, {
      header: "Access-Control-Allow-Methods",
      operation: "set",
      value: "POST, OPTIONS, GET"
    }, {
      header: "Access-Control-Allow-Headers",
      operation: "set",
      value: "Content-Type, Accept, Origin, Referer"
    }]
  }
};
const _0x569234 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||m.facebook.com"
};
const _0x471697 = {
  id: 2,
  priority: 1,
  condition: _0x569234,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://m.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://m.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x1418a0 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||www.facebook.com"
};
const _0x4b9571 = {
  id: 5,
  priority: 1,
  condition: _0x1418a0,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://www.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://www.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x215083 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||web.facebook.com"
};
const _0xaf90c0 = {
  id: 6,
  priority: 1,
  condition: _0x215083,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://web.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://web.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x1f762c = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||mobile.facebook.com"
};
const _0x10e43f = {
  id: 7,
  priority: 1,
  condition: _0x1f762c,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://mobile.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://mobile.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x441f72 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||mbasic.facebook.com"
};
const _0x4d30b5 = {
  id: 8,
  priority: 1,
  condition: _0x441f72,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://mbasic.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://mbasic.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x207002 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||business.facebook.com"
};
const _0x5a80ed = {
  id: 13,
  priority: 1,
  condition: _0x207002,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://business.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://business.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }, {
      header: "Access-Control-Allow-Credentials",
      operation: "set",
      value: "true"
    }, {
      header: "Access-Control-Allow-Methods",
      operation: "set",
      value: "POST, OPTIONS, GET"
    }, {
      header: "Access-Control-Allow-Headers",
      operation: "set",
      value: "Content-Type, Accept, Origin, Referer"
    }]
  }
};
const _0x2d259a = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||en-gb.facebook.com"
};
const _0x3e44c0 = {
  id: 14,
  priority: 1,
  condition: _0x2d259a,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://en-gb.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://en-gb.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x257933 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||upload-business.facebook.com"
};
const _0x368e9b = {
  id: 16,
  priority: 2,
  condition: _0x257933,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://business.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://business.facebook.com"
    }]
  }
};
const _0x12ebbe = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||upload.facebook.com"
};
const _0x30086e = {
  id: 267,
  priority: 1,
  condition: _0x12ebbe,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://upload.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://upload.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0xca9280 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||free.facebook.com"
};
const _0x2e866b = {
  id: 269,
  priority: 1,
  condition: _0xca9280,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://free.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://free.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x56ac0e = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||adsmanager.facebook.com"
};
const _0x30f2be = {
  id: 286,
  priority: 1,
  condition: _0x56ac0e,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://adsmanager.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://adsmanager.facebook.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x3880ff = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||graph.facebook.com"
};
const _0x40e9ef = {
  id: 25,
  priority: 1,
  condition: _0x3880ff,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://www.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://www.facebook.com/"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }, {
      header: "Access-Control-Allow-Credentials",
      operation: "set",
      value: "true"
    }]
  }
};
const _0x21fc62 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||up.facebook.com"
};
const _0x31adbc = {
  id: 26,
  priority: 2,
  condition: _0x21fc62,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://business.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://business.facebook.com/"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }, {
      header: "Access-Control-Allow-Credentials",
      operation: "set",
      value: "true"
    }, {
      header: "Access-Control-Allow-Headers",
      operation: "set",
      value: "Content-Type, Accept, x_fb_video_waterfall_id, x-entity-name, x-entity-length, x-entity-type, offset, end_offset, start_offset, x-total-asset-size"
    }, {
      header: "Access-Control-Allow-Methods",
      operation: "set",
      value: "POST, OPTIONS, GET"
    }]
  }
};
const FB_SUBDOMAIN_RULES = [_0x364576, _0x471697, _0x4b9571, _0xaf90c0, _0x10e43f, _0x4d30b5, _0x5a80ed, _0x3e44c0, _0x368e9b, _0x30086e, _0x2e866b, _0x30f2be, _0x40e9ef, _0x31adbc];
const _0x3b4d89 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  regexFilter: "^https://[^/]*\\.(facebook|tiktok)\\.com/"
};
const _0x16c122 = {
  id: 3,
  priority: 1,
  condition: _0x3b4d89,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Sec-Fetch-Dest",
      operation: "set",
      value: "empty"
    }, {
      header: "Sec-Fetch-Mode",
      operation: "set",
      value: "cors"
    }, {
      header: "Sec-Fetch-Site",
      operation: "set",
      value: "same-site"
    }]
  }
};
const _0x1e21c8 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||facebook.com"
};
const _0x1ad047 = {
  id: 4,
  priority: 1,
  condition: _0x1e21c8,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Upfeedth-Sec-Cookie",
      operation: "remove"
    }, {
      header: "Upfeedth-Sec-Dest",
      operation: "remove"
    }, {
      header: "Upfeedth-Sec-Mode",
      operation: "remove"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x333458 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  urlFilter: "||tiktok.com"
};
const _0x223cf2 = {
  id: 9,
  priority: 1,
  condition: _0x333458,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://www.tiktok.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://www.tiktok.com"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }]
  }
};
const _0x28bde2 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  regexFilter: "global_scope_id"
};
const _0x3c70ff = {
  id: 10,
  priority: 2,
  condition: _0x28bde2,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Sec-Fetch-Dest",
      operation: "set",
      value: "document"
    }, {
      header: "Sec-Fetch-Mode",
      operation: "set",
      value: "same-origin"
    }, {
      header: "Sec-Fetch-Site",
      operation: "set",
      value: "none"
    }, {
      header: "Sec-Ch-Prefers-Color-Scheme",
      operation: "set",
      value: "light"
    }]
  }
};
const _0x41248b = {
  initiatorDomains: DOMAINS,
  resourceTypes: ["xmlhttprequest"],
  regexFilter: "upfeedth_urlencoded"
};
const _0x190c58 = {
  id: 12,
  priority: 2,
  condition: _0x41248b,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Content-Type",
      operation: "set",
      value: "application/x-www-form-urlencoded"
    }, {
      header: "Sec-Fetch-Dest",
      operation: "set",
      value: "empty"
    }, {
      header: "Sec-Fetch-Mode",
      operation: "set",
      value: "cors"
    }]
  }
};
const _0x4ead2c = {
  initiatorDomains: DOMAINS,
  resourceTypes: ALL_RESOURCE_TYPES,
  regexFilter: "upfeedthcors=0"
};
const _0x41df7c = {
  id: 18,
  priority: 2,
  condition: _0x4ead2c,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Origin",
      operation: "set",
      value: "https://www.facebook.com"
    }, {
      header: "Referer",
      operation: "set",
      value: "https://www.facebook.com/"
    }],
    responseHeaders: [{
      header: "Access-Control-Allow-Origin",
      operation: "set",
      value: "*"
    }, {
      header: "Access-Control-Allow-Credentials",
      operation: "set",
      value: "true"
    }]
  }
};
const _0x6181eb = {
  initiatorDomains: DOMAINS,
  resourceTypes: ["xmlhttprequest"],
  regexFilter: "upfeedth_empty"
};
const _0x2ce139 = {
  id: 112,
  priority: 3,
  condition: _0x6181eb,
  action: {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Cookie",
      operation: "remove"
    }]
  }
};
const _0x5c43a2 = {
  initiatorDomains: DOMAINS,
  resourceTypes: ["xmlhttprequest"],
  regexFilter: "killagent=0"
};
const _0x5247ac = {
  header: "User-Agent",
  operation: "set",
  value: FAKE_UA
};
const _0x581a0b = {
  type: "modifyHeaders",
  requestHeaders: [_0x5247ac]
};
const _0x317e84 = {
  id: 266,
  priority: 2,
  condition: _0x5c43a2,
  action: _0x581a0b
};
const MAGIC_STRING_RULES = [_0x16c122, _0x1ad047, _0x223cf2, _0x3c70ff, _0x190c58, _0x41df7c, _0x2ce139, _0x317e84];
const ALL_STATIC_RULES = [];
let ruleCounter = 1000;
for (const rule of [...FB_SUBDOMAIN_RULES, ...MAGIC_STRING_RULES]) {
  const ruleApp = JSON.parse(JSON.stringify(rule));
  ruleApp.id = ruleCounter++;
  ruleApp.condition.initiatorDomains = ["upfeedth.com"];
  if (ruleApp.action.responseHeaders) {
    ruleApp.action.responseHeaders.forEach(_0x358f76 => {
      if (_0x358f76.header === "Access-Control-Allow-Origin" && _0x358f76.value === "https://upfeedth.com") {
        _0x358f76.value = "https://upfeedth.com";
      }
    });
  }
  ALL_STATIC_RULES.push(ruleApp);
  const ruleOnline = JSON.parse(JSON.stringify(rule));
  ruleOnline.id = ruleCounter++;
  ruleOnline.condition.initiatorDomains = ["upfeedth.com"];
  if (ruleOnline.action.responseHeaders) {
    ruleOnline.action.responseHeaders.forEach(_0x5f144c => {
      if (_0x5f144c.header === "Access-Control-Allow-Origin" && _0x5f144c.value === "https://upfeedth.com") {
        _0x5f144c.value = "https://upfeedth.com";
      }
    });
  }
  ALL_STATIC_RULES.push(ruleOnline);
}
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[UPFEEDTH] Extension installed. Setting up DNR rules...");
  const _0x1d7a2c = await chrome.declarativeNetRequest.getDynamicRules();
  const _0x10d117 = _0x1d7a2c.map(_0x5a7ee7 => _0x5a7ee7.id);
  const _0x565fb1 = {
    removeRuleIds: _0x10d117,
    addRules: ALL_STATIC_RULES
  };
  await chrome.declarativeNetRequest.updateDynamicRules(_0x565fb1);
  console.log("[UPFEEDTH] ✅ Installed " + ALL_STATIC_RULES.length + " static DNR rules");
});
let currentCookieStr = "";
let currentUID = "";
async function setCookieHeader(_0x21702d) {
  const _0x1c0c81 = {
    initiatorDomains: DOMAINS,
    resourceTypes: ALL_RESOURCE_TYPES,
    regexFilter: "facebook\\.com"
  };
  const _0x1e4b8c = {
    type: "modifyHeaders",
    requestHeaders: [{
      header: "Cookie",
      operation: "set",
      value: _0x21702d
    }]
  };
  const _0x407692 = {
    id: 111,
    priority: 1,
    condition: _0x1c0c81,
    action: _0x1e4b8c
  };
  const _0x5a7332 = _0x407692;
  try {
    const _0x45e6ee = {
      removeRuleIds: [111],
      addRules: [_0x5a7332]
    };
    await chrome.declarativeNetRequest.updateDynamicRules(_0x45e6ee);
  } catch (_0xbdc054) {
    console.error("[UPFEEDTH] Error setting cookie rule 0x6F:", _0xbdc054);
  }
  console.log("[UPFEEDTH] 🍪 Rule 0x6F: Cookie rule set for facebook.com");
}
async function setCookieHeaderTargetID(_0x62352d, _0x103b0d) {
  const _0x18a26b = parseInt(_0x62352d.substr(_0x62352d.length - 8));
  const _0x330212 = {
    id: _0x18a26b,
    priority: 1,
    condition: {
      initiatorDomains: DOMAINS,
      resourceTypes: ALL_RESOURCE_TYPES,
      regexFilter: "upfeedth_fb_id=" + _0x62352d
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [{
        header: "Cookie",
        operation: "set",
        value: _0x103b0d
      }]
    }
  };
  try {
    const _0x4ff5cb = {
      removeRuleIds: [_0x18a26b],
      addRules: [_0x330212]
    };
    await chrome.declarativeNetRequest.updateDynamicRules(_0x4ff5cb);
  } catch (_0x44f7b8) {
    console.error("[UPFEEDTH] Error setting upfeedth_fb_id rule:", _0x44f7b8);
  }
  console.log("[UPFEEDTH] 🔑 Dynamic Rule set: upfeedth_fb_id=" + _0x62352d + " → Cookie injected (Rule ID: " + _0x18a26b + ")");
}
async function initSetCookie() {
  return new Promise(_0x1b9d5f => {
    chrome.cookies.getAll({
      domain: "facebook.com"
    }, async _0x3443be => {
      if (!_0x3443be || _0x3443be.length === 0) {
        console.log("[UPFEEDTH] ⚠️ No Facebook cookies found");
        _0x1b9d5f("");
        return;
      }
      currentCookieStr = _0x3443be.map(_0x253455 => _0x253455.name + "=" + _0x253455.value + ";").join(" ");
      const _0x25efaf = /c_user=([0-9]+)/g.exec(currentCookieStr);
      currentUID = _0x25efaf ? _0x25efaf[1] : "";
      if (!currentUID) {
        console.log("[UPFEEDTH] ⚠️ No c_user found (not logged in?)");
        _0x1b9d5f("");
        return;
      }
      console.log("[UPFEEDTH] 🍪 Got cookies for UID: " + currentUID);
      await setCookieHeader(currentCookieStr);
      await setCookieHeaderTargetID(currentUID, currentCookieStr);
      _0x1b9d5f(currentCookieStr);
    });
  });
}
const REEL_RULE_BASE = 50000;
async function setReelData(_0x1e5992) {
  const _0x4cdcbe = typeof _0x1e5992 === "string" ? JSON.parse(_0x1e5992) : _0x1e5992;
  const {
    vid: _0x317066,
    offset: _0x5602bd,
    file_size: _0x4f4f0a,
    end_offset: _0x2752ef,
    x_fb_video_waterfall_id: _0x130d3e,
    name: _0x3bb45d,
    bz: _0x45ed7b
  } = _0x4cdcbe;
  const _0x22b866 = REEL_RULE_BASE + 1;
  const _0x55cb12 = REEL_RULE_BASE + 2;
  try {
    const _0x11b02c = {
      removeRuleIds: [_0x22b866, _0x55cb12]
    };
    await chrome.declarativeNetRequest.updateDynamicRules(_0x11b02c);
  } catch (_0x220ee6) { }
  const _0x28a194 = {
    id: _0x22b866,
    priority: 5,
    condition: {
      initiatorDomains: DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      regexFilter: "reel_video=" + _0x317066
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [{
        header: "x_fb_video_waterfall_id",
        operation: "set",
        value: _0x130d3e || ""
      }, {
        header: "Accept",
        operation: "set",
        value: "*/*"
      }, {
        header: "Referer",
        operation: "set",
        value: "https://business.facebook.com/creatorstudio/published?content_table=POSTED_POSTS&post_type=FB_SHORTS"
      }, {
        header: "Origin",
        operation: "set",
        value: "https://business.facebook.com"
      }, {
        header: "Cookie",
        operation: "set",
        value: currentCookieStr
      }, {
        header: "x-entity-name",
        operation: "set",
        value: _0x3bb45d || "video.mp4"
      }, {
        header: "x-entity-length",
        operation: "set",
        value: String(_0x4f4f0a || 0)
      }, {
        header: "x-total-asset-size",
        operation: "set",
        value: String(_0x4f4f0a || 0)
      }, {
        header: "offset",
        operation: "set",
        value: String(_0x5602bd || 0)
      }, {
        header: "end_offset",
        operation: "set",
        value: String(_0x2752ef || _0x4f4f0a || 0)
      }],
      responseHeaders: [{
        header: "Access-Control-Allow-Origin",
        operation: "set",
        value: "*"
      }, {
        header: "Access-Control-Allow-Credentials",
        operation: "set",
        value: "true"
      }]
    }
  };
  const _0x4ef77c = {
    id: _0x55cb12,
    priority: 5,
    condition: {
      initiatorDomains: DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      regexFilter: "up\\.facebook\\.com/.*wall_reel_id=" + _0x317066
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [{
        header: "Content-Type",
        operation: "remove"
      }, {
        header: "Origin",
        operation: "set",
        value: "https://business.facebook.com"
      }, {
        header: "Referer",
        operation: "set",
        value: "https://business.facebook.com/creatorstudio/published?content_table=POSTED_POSTS&post_type=FB_SHORTS"
      }, {
        header: "offset",
        operation: "set",
        value: String(_0x5602bd || 0)
      }, {
        header: "start_offset",
        operation: "set",
        value: "0"
      }, {
        header: "end_offset",
        operation: "set",
        value: String(_0x2752ef || _0x4f4f0a || 0)
      }, {
        header: "x-entity-name",
        operation: "set",
        value: _0x3bb45d || "video.mp4"
      }, {
        header: "x-entity-length",
        operation: "set",
        value: String(_0x4f4f0a || 0)
      }, {
        header: "x-total-asset-size",
        operation: "set",
        value: String(_0x4f4f0a || 0)
      }, {
        header: "Cookie",
        operation: "set",
        value: currentCookieStr
      }],
      responseHeaders: [{
        header: "Access-Control-Allow-Origin",
        operation: "set",
        value: "*"
      }, {
        header: "Access-Control-Allow-Credentials",
        operation: "set",
        value: "true"
      }]
    }
  };
  const _0x4a5673 = {
    addRules: [_0x28a194, _0x4ef77c]
  };
  await chrome.declarativeNetRequest.updateDynamicRules(_0x4a5673);
  console.log("[UPFEEDTH] 🎬 Reel rules set for vid: " + _0x317066);
  return "";
}
async function wipeReels() {
  const _0x573f33 = await chrome.declarativeNetRequest.getDynamicRules();
  const _0x43d952 = _0x573f33.filter(_0x19eca9 => _0x19eca9.condition && _0x19eca9.condition.regexFilter && (_0x19eca9.condition.regexFilter.startsWith("reel_video=") || _0x19eca9.condition.regexFilter.startsWith("wall_reel_id="))).map(_0x27df41 => _0x27df41.id);
  if (_0x43d952.length > 0) {
    const _0x3f7758 = {
      removeRuleIds: _0x43d952
    };
    await chrome.declarativeNetRequest.updateDynamicRules(_0x3f7758);
  }
  console.log("[UPFEEDTH] 🗑️ Wiped " + _0x43d952.length + " reel rules");
  return "";
}
async function setMultipleHeader(_0x522934) {
  const _0x58f277 = typeof _0x522934 === "string" ? JSON.parse(_0x522934) : _0x522934;
  if (Array.isArray(_0x58f277)) {
    for (const _0x2b59c2 of _0x58f277) {
      if (_0x2b59c2.id && _0x2b59c2.cookie) {
        await setCookieHeaderTargetID(String(_0x2b59c2.id), _0x2b59c2.cookie);
      }
    }
    return "";
  }
  if (_0x58f277 && _0x58f277.uid && _0x58f277.cookie) {
    await setCookieHeaderTargetID(_0x58f277.uid, _0x58f277.cookie);
    return "";
  }
  return "";
}
async function setRawCookie(_0x458396) {
  let _0x462e47 = "";
  if (typeof _0x458396 === "string") {
    try {
      const _0x270ffd = JSON.parse(_0x458396);
      _0x462e47 = _0x270ffd.main_cookie || _0x270ffd;
    } catch (_0x887e5d) {
      _0x462e47 = _0x458396;
    }
  } else if (_0x458396 && _0x458396.main_cookie) {
    _0x462e47 = _0x458396.main_cookie;
  }
  if (!_0x462e47 || typeof _0x462e47 !== "string") {
    return "";
  }
  currentCookieStr = _0x462e47;
  const _0x12998c = /c_user=([0-9]+)/g.exec(_0x462e47);
  currentUID = _0x12998c ? _0x12998c[1] : "";
  const _0x48dfa6 = _0x462e47.split(";").map(_0x4c54bd => _0x4c54bd.trim()).filter(Boolean);
  for (const _0x2ca90d of _0x48dfa6) {
    const _0x5bb241 = _0x2ca90d.indexOf("=");
    if (_0x5bb241 === -1) {
      continue;
    }
    const _0x243355 = _0x2ca90d.substring(0, _0x5bb241).trim();
    const _0x2d277f = _0x2ca90d.substring(_0x5bb241 + 1).trim();
    try {
      const _0x37a1d0 = {
        url: "https://www.facebook.com",
        domain: ".facebook.com",
        path: "/",
        name: _0x243355,
        value: _0x2d277f,
        secure: true
      };
      await chrome.cookies.set(_0x37a1d0);
    } catch (_0x3f6735) { }
  }
  await setCookieHeader(currentCookieStr);
  if (currentUID) {
    await setCookieHeaderTargetID(currentUID, currentCookieStr);
  }
  return currentCookieStr;
}
async function loginNewAcc() {
  const _0x25513d = ["c_user", "xs", "fr", "datr", "sb"];
  for (const _0x549d31 of _0x25513d) {
    try {
      const _0x11cbcf = {
        url: "https://www.facebook.com",
        name: _0x549d31
      };
      await chrome.cookies.remove(_0x11cbcf);
    } catch (_0x52e846) { }
  }
  chrome.tabs.create({
    url: "https://www.facebook.com"
  });
}
function calcJazoest(_0x27dca7) {
  if (!_0x27dca7) {
    return "";
  }
  let _0x511225 = 0;
  for (let _0xb32ff3 = 0; _0xb32ff3 < _0x27dca7.length; _0xb32ff3++) {
    _0x511225 += _0x27dca7.charCodeAt(_0xb32ff3);
  }
  return "2" + _0x511225;
}
let proxyRuleCounter = 60000;
async function createProxyDnrRule(_0x55dd19) {
  const _0x1269cf = ++proxyRuleCounter;
  const _0x26f27a = "__fwp=" + _0x1269cf;
  const _0x4b1cde = {
    header: "Cookie",
    operation: "set",
    value: currentCookieStr
  };
  const _0x534442 = [_0x4b1cde, {
    header: "Origin",
    operation: "set",
    value: "https://business.facebook.com"
  }, {
      header: "Referer",
      operation: "set",
      value: "https://business.facebook.com/"
    }, {
      header: "Sec-Fetch-Site",
      operation: "set",
      value: "same-site"
    }, {
      header: "Sec-Fetch-Mode",
      operation: "set",
      value: "cors"
    }, {
      header: "Sec-Fetch-Dest",
      operation: "set",
      value: "empty"
    }];
  if (_0x55dd19) {
    for (const [_0x2a4720, _0x57f99d] of Object.entries(_0x55dd19)) {
      const _0x41b3c6 = _0x2a4720.toLowerCase();
      if (!["cookie", "origin", "referer"].includes(_0x41b3c6) && !_0x41b3c6.startsWith("sec-fetch")) {
        _0x534442.push({
          header: _0x2a4720,
          operation: "set",
          value: String(_0x57f99d)
        });
      }
    }
  }
  const _0x25b1b5 = {
    id: _0x1269cf,
    priority: 10,
    condition: {
      regexFilter: _0x26f27a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      resourceTypes: ALL_RESOURCE_TYPES
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: _0x534442,
      responseHeaders: [{
        header: "Access-Control-Allow-Origin",
        operation: "set",
        value: "*"
      }, {
        header: "Access-Control-Allow-Credentials",
        operation: "set",
        value: "true"
      }]
    }
  };
  const _0x4586d5 = {
    removeRuleIds: [_0x1269cf],
    addRules: [_0x25b1b5]
  };
  await chrome.declarativeNetRequest.updateDynamicRules(_0x4586d5);
  console.log("[UPFEEDTH SW] 📏 Created temp DNR rule " + _0x1269cf + " for " + _0x26f27a);
  const _0x14b85d = {
    marker: _0x26f27a,
    ruleId: _0x1269cf
  };
  return _0x14b85d;
}
async function cleanupProxyRule(_0x573955) {
  try {
    const _0x23d3fd = {
      removeRuleIds: [_0x573955]
    };
    await chrome.declarativeNetRequest.updateDynamicRules(_0x23d3fd);
  } catch (_0x5a833a) { }
}
async function swProxyUpload(_0x283016) {
  let {
    url: _0x476bd1,
    formDataEntries: _0x593c29,
    headers: _0x4ee243
  } = _0x283016;
  if (_0x476bd1.includes("upload-business.facebook.com") && !_0x476bd1.includes("jazoest")) {
    const _0x422992 = _0x476bd1.match(/fb_dtsg=([^&]+)/);
    if (_0x422992) {
      _0x476bd1 += "&jazoest=" + calcJazoest(decodeURIComponent(_0x422992[1]));
    }
  }
  const {
    marker: _0x5df010,
    ruleId: _0xb1b5bc
  } = await createProxyDnrRule(_0x4ee243);
  const _0xb98ae1 = _0x476bd1.includes("?") ? "&" : "?";
  const _0x242b02 = _0x476bd1 + _0xb98ae1 + _0x5df010;
  console.log("[UPFEEDTH SW] 📤 Upload via DNR proxy: " + _0x476bd1.substring(0, 80) + "...");
  const _0x3a603a = new FormData();
  if (_0x593c29) {
    for (const _0x532723 of _0x593c29) {
      if (_0x532723.type === "file") {
        const _0x5523fd = new Uint8Array(_0x532723.data);
        const _0x4e7407 = {
          type: _0x532723.mimeType || "application/octet-stream"
        };
        const _0x10b1d0 = new Blob([_0x5523fd], _0x4e7407);
        _0x3a603a.append(_0x532723.name, _0x10b1d0, _0x532723.fileName || "file");
      } else {
        _0x3a603a.append(_0x532723.name, _0x532723.value);
      }
    }
  }
  try {
    const _0x1f0a8a = await fetch(_0x242b02, {
      method: "POST",
      body: _0x3a603a
    });
    const _0x323f64 = await _0x1f0a8a.text();
    console.log("[UPFEEDTH SW] ✅ Upload response: " + _0x1f0a8a.status);
    const _0x51ecbf = {
      success: true,
      data: _0x323f64,
      status: _0x1f0a8a.status
    };
    return _0x51ecbf;
  } catch (_0x223630) {
    console.error("[UPFEEDTH SW] ❌ Upload error:", _0x223630.message);
    const _0xc0861e = {
      success: false,
      error: _0x223630.message
    };
    return _0xc0861e;
  } finally {
    await cleanupProxyRule(_0xb1b5bc);
  }
}
async function swProxyFetch(_0x240ec2) {
  let {
    url: _0x993944,
    method: _0x29a00f,
    body: _0x7e0945,
    bodyType: _0x12b3b2,
    headers: _0x382be8
  } = _0x240ec2;
  const {
    marker: _0x30f1f9,
    ruleId: _0x2c083f
  } = await createProxyDnrRule(_0x382be8);
  const _0x45479a = _0x993944.includes("?") ? "&" : "?";
  const _0x4e7836 = _0x993944 + _0x45479a + _0x30f1f9;
  console.log("[UPFEEDTH SW] 🔄 Fetch via DNR proxy: " + (_0x29a00f || "POST") + " " + _0x993944.substring(0, 80) + "...");
  let _0x2b1db8 = null;
  if (_0x7e0945) {
    if (_0x12b3b2 === "arraybuffer") {
      _0x2b1db8 = new Uint8Array(_0x7e0945).buffer;
    } else {
      _0x2b1db8 = _0x7e0945;
    }
  }
  try {
    const _0x1af217 = await fetch(_0x4e7836, {
      method: _0x29a00f || "POST",
      body: _0x2b1db8
    });
    const _0x573e6b = await _0x1af217.text();
    console.log("[UPFEEDTH SW] ✅ Fetch response: " + _0x1af217.status);
    const _0x2cc876 = {
      success: true,
      data: _0x573e6b,
      status: _0x1af217.status
    };
    return _0x2cc876;
  } catch (_0x880861) {
    console.error("[UPFEEDTH SW] ❌ Fetch error:", _0x880861.message);
    const _0x884aac = {
      success: false,
      error: _0x880861.message
    };
    return _0x884aac;
  } finally {
    await cleanupProxyRule(_0x2c083f);
  }
}
chrome.runtime.onMessage.addListener((_0x1558cd, _0x3d1212, _0x271b4b) => {
  const {
    type: _0x394eb3,
    body: _0xff0d6
  } = _0x1558cd;
  console.log("[UPFEEDTH] 📩 Message: " + _0x394eb3);
  switch (_0x394eb3) {
    case "INIT_SET_COOKIE":
      initSetCookie().then(_0x1819e3 => _0x271b4b(_0x1819e3));
      return true;
    case "SET_REEL_DATA":
      setReelData(_0xff0d6).then(_0x37496e => _0x271b4b(_0x37496e));
      return true;
    case "WIPE_REELS":
      wipeReels().then(_0x25943a => _0x271b4b(_0x25943a));
      return true;
    case "SET_MULTIPLE_HEADER":
      setMultipleHeader(_0xff0d6).then(_0xd7cd19 => _0x271b4b(_0xd7cd19));
      return true;
    case "SET_RAW_COOKIE":
      setRawCookie(_0xff0d6).then(_0x42f404 => _0x271b4b(_0x42f404));
      return true;
    case "LOGIN_NEW_ACC":
      loginNewAcc();
      _0x271b4b("OK");
      return false;
    case "PROXY_UPLOAD":
      swProxyUpload(_0xff0d6).then(_0x551a72 => _0x271b4b(_0x551a72));
      return true;
    case "PROXY_FETCH":
      swProxyFetch(_0xff0d6).then(_0x2f3355 => _0x271b4b(_0x2f3355));
      return true;
    default:
      console.log("[UPFEEDTH] ⚠️ Unknown: " + _0x394eb3);
      _0x271b4b(null);
      return false;
  }
});
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(tab => tab.url && (tab.url.includes("localhost:3000") || tab.url.includes("upfeedth.com")));

  if (existingTab) {
    chrome.windows.update(existingTab.windowId, { focused: true });
    chrome.tabs.update(existingTab.id, { active: true });
  } else {
    chrome.tabs.create({ url: "https://upfeedth.com" }); // Change to https://upfeedth.com for production
  }
});
console.log("[UPFEEDTH] 🚀 Service Worker loaded (v1.1 — SW Direct Proxy)");