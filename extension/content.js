const observer = new MutationObserver(() => {
  const _0x414cd2 = document.querySelector(".fixed.inset-0.z-50");
  const _0x1079ec = document.querySelector(".fixed.inset-0.z-40");
  if (_0x414cd2) {
    _0x414cd2.remove();
  }
  if (_0x1079ec) {
    _0x1079ec.remove();
  }
  if (_0x414cd2 || _0x1079ec) {
    document.body.style.overflow = "auto";
  }
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Expose extension version to the website via DOM
const versionElement = document.createElement('div');
versionElement.id = 'upfeedth-extension-version';
versionElement.setAttribute('data-version', chrome.runtime.getManifest().version);
versionElement.style.display = 'none';
(document.body || document.documentElement).appendChild(versionElement);
let isAuthChecked = false;
let isUpfeedthUser = false;
async function checkLogin() {
  if (isAuthChecked) {
    return isUpfeedthUser;
  }
  try {
    const _0x31084a = await fetch("/api/auth/session");
    if (_0x31084a.ok) {
      const _0x51c9a1 = await _0x31084a.json();
      if (_0x51c9a1 && _0x51c9a1.user && _0x51c9a1.user.email) {
        isUpfeedthUser = true;
      }
    }
  } catch (_0x555812) {
    console.error("checkLogin error:", _0x555812);
  }
  isAuthChecked = true;
  return isUpfeedthUser;
}
// Run INIT_SET_COOKIE unconditionally for Upfeed
chrome.runtime.sendMessage({
  type: "INIT_SET_COOKIE"
}, function (_0x56d578) {
  if (_0x56d578) {
    document.cookie = "fb_proxy_cookies=" + encodeURIComponent(_0x56d578) + "; path=/";
    console.log("[UPFEEDTH Extension] ✅ Facebook Cookies Initialized");
  } else {
    console.warn("[UPFEEDTH Extension] ⚠️ Failed to initialize Facebook Cookies. Please log in to Facebook.");
  }
});
function waitForElement(_0x46a536) {
  return new Promise(_0x22d924 => {
    if (document.querySelector(_0x46a536)) {
      return _0x22d924(document.querySelector(_0x46a536));
    }
    const _0x3c5ca9 = new MutationObserver(() => {
      if (document.querySelector(_0x46a536)) {
        _0x22d924(document.querySelector(_0x46a536));
      }
    });
    _0x3c5ca9.observe(document.body, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });
  });
}
waitForElement("#upfeedth-add-login").then(_0x1649bc => {
  _0x1649bc.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "LOGIN_NEW_ACC"
    }, function () { });
  });
});
waitForElement("#upfeedth-reels-wipe").then(_0x5afc0f => {
  _0x5afc0f.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "WIPE_REELS",
      body: {}
    }, function (_0x405ca5) {
      _0x5afc0f.value = _0x405ca5;
      _0x5afc0f.dispatchEvent(new Event("keyup", {
        bubbles: true,
        cancelable: false
      }));
    });
  });
});
waitForElement("#upfeedth-accounts-add").then(_0x3fb42b => {
  _0x3fb42b.addEventListener("click", () => {
    const _0x25f2ae = {
      type: "SET_MULTIPLE_HEADER",
      body: _0x3fb42b.value
    };
    chrome.runtime.sendMessage(_0x25f2ae, function (_0x3cca6d) {
      _0x3fb42b.value = _0x3cca6d;
      _0x3fb42b.dispatchEvent(new Event("keyup", {
        bubbles: true,
        cancelable: false
      }));
    });
  });
});
waitForElement("#upfeedth-reel-add").then(_0x579ec8 => {
  _0x579ec8.addEventListener("click", () => {
    const _0x14fc24 = {
      type: "SET_REEL_DATA",
      body: _0x579ec8.value
    };
    chrome.runtime.sendMessage(_0x14fc24, function (_0x3a48ed) {
      _0x579ec8.value = _0x3a48ed;
      _0x579ec8.dispatchEvent(new Event("keyup", {
        bubbles: true,
        cancelable: false
      }));
    });
  });
});
waitForElement("#upfeedth-cookie-add").then(_0x40d02f => {
  _0x40d02f.addEventListener("click", () => { });
});
waitForElement("#upfeedth-click").then(_0x47cd10 => {
  _0x47cd10.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "SET_RAW_COOKIE",
      body: localStorage.getItem("main_cookie") || ""
    }, function (_0x161b0c) {
      _0x47cd10.value = _0x161b0c;
      const _0x2ce431 = {
        cookie: _0x161b0c,
        version: 2
      };
      localStorage.setItem("upfeedth", JSON.stringify(_0x2ce431));
      _0x47cd10.dispatchEvent(new Event("keyup", {
        bubbles: true,
        cancelable: false
      }));
    });
  });
});
window.addEventListener("message", async _0x1d7e7e => {
  if (!_0x1d7e7e.data || !_0x1d7e7e.data.__upfeedth || _0x1d7e7e.data.direction !== "to_extension") {
    return;
  }
  const {
    requestId: _0x3254c3,
    type: _0x3a0724,
    body: _0x4da207
  } = _0x1d7e7e.data;
  if (false) {

    const _0x542c21 = {
      __upfeedth: true,
      direction: "to_page",
      requestId: _0x3254c3,
      success: false,
    };
    return window.postMessage(_0x542c21, "*");
  }
  try {
    const _0x27b885 = await new Promise((_0x571907, _0x338cbb) => {
      const _0x163ed1 = {
        type: _0x3a0724,
        body: _0x4da207
      };
      chrome.runtime.sendMessage(_0x163ed1, function (_0x1a64d8) {
        if (chrome.runtime.lastError) {
          _0x338cbb(new Error(chrome.runtime.lastError.message));
        } else {
          _0x571907(_0x1a64d8);
        }
      });
    });
    const _0x5597ca = {
      __upfeedth: true,
      direction: "to_page",
      requestId: _0x3254c3,
      success: true,
      data: _0x27b885
    };
    window.postMessage(_0x5597ca, "*");
  } catch (_0xe48abc) {
    console.error("[UPFEEDTH Bridge] ❌ Error:", _0xe48abc);
    const _0x40894b = {
      __upfeedth: true,
      direction: "to_page",
      requestId: _0x3254c3,
      success: false,
      error: _0xe48abc.message
    };
    window.postMessage(_0x40894b, "*");
  }
});