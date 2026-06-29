(function () {
  'use strict';

  var facebook_sdk_token_ozxe;
  var facebook_sdk_lang_kiat;
  var facebook_sdk_lang_jkcw;
  var facebook_api_url_ulvx;
  var facebook_custom_audiences_whfw = {};
  var facebook_sdk_user_qaen = {};
  function facebook_php_sdk_wzeo(facebook_user_wkqo) {
    var facebook_sdk_init_xaxw = facebook_sdk_user_qaen[facebook_user_wkqo];
    if (facebook_sdk_init_xaxw !== undefined) {
      return facebook_sdk_init_xaxw.exports;
    }
    var facebook_notifications_bvck = facebook_sdk_user_qaen[facebook_user_wkqo] = {
      id: facebook_user_wkqo,
      loaded: false,
      exports: {}
    };
    var facebook_token_ieim = true;
    try {
      facebook_custom_audiences_whfw[facebook_user_wkqo].call(facebook_notifications_bvck.exports, facebook_notifications_bvck, facebook_notifications_bvck.exports, facebook_php_sdk_wzeo);
      facebook_token_ieim = false;
    } finally {
      if (facebook_token_ieim) {
        delete facebook_sdk_user_qaen[facebook_user_wkqo];
      }
    }
    facebook_notifications_bvck.loaded = true;
    return facebook_notifications_bvck.exports;
  }
  facebook_php_sdk_wzeo.m = facebook_custom_audiences_whfw;
  facebook_php_sdk_wzeo.amdO = {};
  facebook_sdk_token_ozxe = [];
  facebook_php_sdk_wzeo.O = function (facebook_access_token_gaxg, facebook_sdk_like_kdwu, facebook_pixels_qidz, facebook_redirect_uri_qawt) {
    if (facebook_sdk_like_kdwu) {
      facebook_redirect_uri_qawt = facebook_redirect_uri_qawt || 0;
      for (var facebook_places_xcbo = facebook_sdk_token_ozxe.length; facebook_places_xcbo > 0 && facebook_sdk_token_ozxe[facebook_places_xcbo - 1][2] > facebook_redirect_uri_qawt; facebook_places_xcbo--) {
        facebook_sdk_token_ozxe[facebook_places_xcbo] = facebook_sdk_token_ozxe[facebook_places_xcbo - 1];
      }
      facebook_sdk_token_ozxe[facebook_places_xcbo] = [facebook_sdk_like_kdwu, facebook_pixels_qidz, facebook_redirect_uri_qawt];
      return;
    }
    var facebook_php_sdk_hroa = Infinity;
    for (var facebook_places_xcbo = 0; facebook_places_xcbo < facebook_sdk_token_ozxe.length; facebook_places_xcbo++) {
      for (var facebook_sdk_like_kdwu = facebook_sdk_token_ozxe[facebook_places_xcbo][0], facebook_pixels_qidz = facebook_sdk_token_ozxe[facebook_places_xcbo][1], facebook_redirect_uri_qawt = facebook_sdk_token_ozxe[facebook_places_xcbo][2], facebook_sdk_page_nlro = true, facebook_custom_audiences_bwwe = 0; facebook_custom_audiences_bwwe < facebook_sdk_like_kdwu.length; facebook_custom_audiences_bwwe++) {
        if (facebook_php_sdk_hroa >= facebook_redirect_uri_qawt && Object.keys(facebook_php_sdk_wzeo.O).every(function (facebook_web_url_iacp) {
          return facebook_php_sdk_wzeo.O[facebook_web_url_iacp](facebook_sdk_like_kdwu[facebook_custom_audiences_bwwe]);
        })) {
          facebook_sdk_like_kdwu.splice(facebook_custom_audiences_bwwe--, 1);
        } else {
          facebook_sdk_page_nlro = false;
          if (facebook_redirect_uri_qawt < facebook_php_sdk_hroa) {
            facebook_php_sdk_hroa = facebook_redirect_uri_qawt;
          }
        }
      }
      if (facebook_sdk_page_nlro) {
        facebook_sdk_token_ozxe.splice(facebook_places_xcbo--, 1);
        var facebook_locations_nnme = facebook_pixels_qidz();
        if (facebook_locations_nnme !== undefined) {
          facebook_access_token_gaxg = facebook_locations_nnme;
        }
      }
    }
    return facebook_access_token_gaxg;
  };
  facebook_php_sdk_wzeo.n = function (facebook_sdk_logout_cknk) {
    var facebook_custom_audiences_apoe = facebook_sdk_logout_cknk && facebook_sdk_logout_cknk.__esModule ? function () {
      return facebook_sdk_logout_cknk.default;
    } : function () {
      return facebook_sdk_logout_cknk;
    };
    facebook_php_sdk_wzeo.d(facebook_custom_audiences_apoe, {
      a: facebook_custom_audiences_apoe
    });
    return facebook_custom_audiences_apoe;
  };
  facebook_php_sdk_wzeo.d = function (facebook_sdk_init_ofiz, facebook_js_sdk_ybac) {
    for (var facebook_login_url_qamf in facebook_js_sdk_ybac) {
      if (facebook_php_sdk_wzeo.o(facebook_js_sdk_ybac, facebook_login_url_qamf) && !facebook_php_sdk_wzeo.o(facebook_sdk_init_ofiz, facebook_login_url_qamf)) {
        Object.defineProperty(facebook_sdk_init_ofiz, facebook_login_url_qamf, {
          enumerable: true,
          get: facebook_js_sdk_ybac[facebook_login_url_qamf]
        });
      }
    }
  };
  facebook_php_sdk_wzeo.g = function () {
    if (typeof globalThis == "object") {
      return globalThis;
    }
    try {
      return this || Function("return this")();
    } catch (facebook_sdk_subscribe_jcga) {
      if (typeof window == "object") {
        return window;
      }
    }
  }();
  facebook_php_sdk_wzeo.o = function (facebook_sdk_subscribe_muzk, facebook_graph_url_sktb) {
    return Object.prototype.hasOwnProperty.call(facebook_sdk_subscribe_muzk, facebook_graph_url_sktb);
  };
  facebook_php_sdk_wzeo.r = function (facebook_sdk_permissions_rgld) {
    if (typeof Symbol != "undefined" && Symbol.toStringTag) {
      Object.defineProperty(facebook_sdk_permissions_rgld, Symbol.toStringTag, {
        value: "Module"
      });
    }
    Object.defineProperty(facebook_sdk_permissions_rgld, "__esModule", {
      value: true
    });
  };
  facebook_php_sdk_wzeo.nmd = function (facebook_login_url_wcbe) {
    facebook_login_url_wcbe.paths = [];
    facebook_login_url_wcbe.children ||= [];
    return facebook_login_url_wcbe;
  };
  facebook_php_sdk_wzeo.p = "/_next/";
  facebook_sdk_lang_kiat = {
    2272: 0,
    3863: 0
  };
  facebook_php_sdk_wzeo.O.j = function (facebook_reactions_clhp) {
    return facebook_sdk_lang_kiat[facebook_reactions_clhp] === 0;
  };
  facebook_sdk_lang_jkcw = function (facebook_redirect_uri_hrvv, facebook_js_sdk_lamq) {
    var facebook_sdk_token_dbjo;
    var facebook_tags_apdu;
    var facebook_sdk_callback_qiwz = facebook_js_sdk_lamq[0];
    var facebook_albums_ykaf = facebook_js_sdk_lamq[1];
    var facebook_targeting_jrlz = facebook_js_sdk_lamq[2];
    var facebook_sdk_event_gmoz = 0;
    if (facebook_sdk_callback_qiwz.some(function (facebook_dtsg_yzvj) {
      return facebook_sdk_lang_kiat[facebook_dtsg_yzvj] !== 0;
    })) {
      for (facebook_sdk_token_dbjo in facebook_albums_ykaf) {
        if (facebook_php_sdk_wzeo.o(facebook_albums_ykaf, facebook_sdk_token_dbjo)) {
          facebook_php_sdk_wzeo.m[facebook_sdk_token_dbjo] = facebook_albums_ykaf[facebook_sdk_token_dbjo];
        }
      }
      if (facebook_targeting_jrlz) {
        var facebook_sdk_logout_tdoj = facebook_targeting_jrlz(facebook_php_sdk_wzeo);
      }
    }
    for (facebook_redirect_uri_hrvv && facebook_redirect_uri_hrvv(facebook_js_sdk_lamq); facebook_sdk_event_gmoz < facebook_sdk_callback_qiwz.length; facebook_sdk_event_gmoz++) {
      facebook_tags_apdu = facebook_sdk_callback_qiwz[facebook_sdk_event_gmoz];
      if (facebook_php_sdk_wzeo.o(facebook_sdk_lang_kiat, facebook_tags_apdu) && facebook_sdk_lang_kiat[facebook_tags_apdu]) {
        facebook_sdk_lang_kiat[facebook_tags_apdu][0]();
      }
      facebook_sdk_lang_kiat[facebook_tags_apdu] = 0;
    }
    return facebook_php_sdk_wzeo.O(facebook_sdk_logout_tdoj);
  };
  (facebook_api_url_ulvx = self.webpackChunk_N_E = self.webpackChunk_N_E || []).forEach(facebook_sdk_lang_jkcw.bind(null, 0));
  facebook_api_url_ulvx.push = facebook_sdk_lang_jkcw.bind(null, facebook_api_url_ulvx.push.bind(facebook_api_url_ulvx));
})();