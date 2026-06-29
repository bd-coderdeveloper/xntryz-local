import { SendRequestToExtension } from './extensionBridge';
import { supabase } from '@/utils/supabase/client';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
  picture_url?: string;
}

export interface FacebookGroup {
  id: string;
  name: string;
  privacy?: string;
  icon?: string;
}

export async function fetchWebDTSGData(): Promise<{ fb_dtsg: string; actor_id: string }> {
  try {
    // 1. Force the extension's service worker to rebuild its in-memory cookie state for DNR rules
    try {
      await SendRequestToExtension('INIT_SET_COOKIE', {});
    } catch (e) {
      console.warn("Could not INIT_SET_COOKIE, extension might be older version.");
    }

    const urlsToTry = [
      'https://www.facebook.com/',
      'https://mbasic.facebook.com/',
      'https://business.facebook.com/content_management'
    ];

    for (const url of urlsToTry) {
      const res = await SendRequestToExtension('PROXY_FETCH', {
        url,
        method: 'GET'
      });

      const proxyRes = res as { success?: boolean; data?: string; error?: string };
      if (proxyRes.error) continue;

      const html = proxyRes.data || '';

      // Extract fb_dtsg
      let fb_dtsg = '';
      const dtsgMatches = [
        html.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"/),
        html.match(/"DTSGInitialData"\[\],\{"token":"([^"]+)"/),
        html.match(/name="fb_dtsg"\s*value="([^"]+)"/),
        html.match(/\["DTSGInitData",\[\],\{"token":"([^"]+)"/),
        html.match(/"token":"(NAp[^"]+)"/) // Fallback for tokens starting with NAp
      ];

      for (const match of dtsgMatches) {
        if (match && match[1]) {
          fb_dtsg = match[1];
          break;
        }
      }

      // Extract actor_id (User ID)
      let actor_id = '';
      const actorMatches = [
        html.match(/"USER_ID":"(\d+)"/),
        html.match(/"ACCOUNT_ID":"(\d+)"/),
        html.match(/"actorID":"(\d+)"/),
        html.match(/name="target"\s*value="(\d+)"/),
        html.match(/c_user=(\d+)/)
      ];

      for (const match of actorMatches) {
        if (match && match[1] && match[1] !== '0') {
          actor_id = match[1];
          break;
        }
      }

      if (fb_dtsg && actor_id) {
        return { fb_dtsg, actor_id };
      }
    }

    throw new Error('ไม่พบข้อมูล fb_dtsg หรือ actor_id (กรุณาล็อกอิน Facebook บนเบราวเซอร์ไว้แล้วลองใหม่)');
  } catch (error) {
    console.error('fetchWebDTSGData error:', error);
    throw error;
  }
}

export async function fetchFacebookToken(forceRefresh = false): Promise<string> {
  try {
    if (!forceRefresh) {
      const cachedToken = localStorage.getItem('upfeed_fb_token_v3');
      if (cachedToken) {
        // Validate token
        const check = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/me?access_token=${cachedToken}`,
          method: 'GET'
        }) as any;
        const parsed = typeof check.data === 'string' ? JSON.parse(check.data) : check.data;
        if (!parsed || parsed.error) {
          console.warn('Cached FB Token is invalid, forcing refresh.', parsed?.error);
          localStorage.removeItem('upfeed_fb_token_v3');
          return fetchFacebookToken(true);
        }
        return cachedToken;
      }
    }

    const urlsToTry = [
      'https://business.facebook.com/content_management',
      'https://adsmanager.facebook.com/adsmanager/',
      'https://business.facebook.com/latest/home',
      'https://business.facebook.com/settings',
      'https://business.facebook.com/',
      'https://www.facebook.com/business/dashboard/',
      'https://www.facebook.com/'
    ];

    let fallbackToken: string | null = null;

    for (const url of urlsToTry) {
      const res = await SendRequestToExtension('PROXY_FETCH', {
        url,
        method: 'GET'
      });

      const proxyRes = res as { success?: boolean; data?: string; error?: string };
      if (proxyRes.error) continue; // Try next URL

      const html = proxyRes.data || '';

      const regexes = [
        /(?:accessToken|access_token)["']?\s*[:=]\s*["']?((?:EAAG|EAAB|EAAC|EAAI|EAA)[^"'\s&]+)/gi,
        /((?:EAAG|EAAB|EAAC|EAAI|EAA)[A-Za-z0-9_\-\\]{15,})/g,
        /(EAA\w+)/g
      ];

      const matches: string[] = [];
      for (const regex of regexes) {
        let match;
        while ((match = regex.exec(html)) !== null) {
          let token = match[1] || match[0];
          token = token.replace(/\\/g, '');
          matches.push(token);
        }
      }

      const uniqueMatches = Array.from(new Set(matches));

      for (const possibleToken of uniqueMatches) {
        if (!fallbackToken) fallbackToken = possibleToken;

        // Validate before assuming it's the right token
        const check = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/me/accounts?access_token=${possibleToken}&limit=1`,
          method: 'GET'
        }) as any;

        const parsed = typeof check.data === 'string' ? JSON.parse(check.data) : check.data;

        if (parsed && !parsed.error) {
          // Valid token!
          localStorage.setItem('upfeed_fb_token_v3', possibleToken);
          supabase.auth.updateUser({
            data: { recent_fb_token: possibleToken, last_fb_token_update: new Date().toISOString() }
          }).catch(() => { });
          return possibleToken;
        } else {
          console.warn('Found token but it is invalid/malformed for /me/accounts:', parsed?.error?.message);
        }
      }
    }

    // If we found a token but it failed validation, return it anyway so the UI can show the REAL Facebook error!
    if (fallbackToken) {
      localStorage.setItem('upfeed_fb_token_v3', fallbackToken);
      return fallbackToken;
    }

    throw new Error('ไม่พบข้อมูล Facebook (กรุณาเข้า facebook.com ที่แท็บใหม่ แล้วกด F5 ที่ UPFEEDTH อีกครั้ง)');
  } catch (error) {
    console.error('fetchFacebookToken error:', error);
    throw error;
  }
}

export async function fetchEAABToken(): Promise<string> {
  try {
    const urlsToTry = [
      'https://adsmanager.facebook.com/adsmanager/',
      'https://business.facebook.com/content_management',
      'https://business.facebook.com/settings',
      'https://www.facebook.com/'
    ];

    for (const url of urlsToTry) {
      const res = await SendRequestToExtension('PROXY_FETCH', {
        url,
        method: 'GET'
      });
      const proxyRes = res as { success?: boolean; data?: string; error?: string };
      if (proxyRes.error) continue;

      const html = proxyRes.data || '';
      const regexes = [
        /(?:accessToken|access_token)["']?\s*[:=]\s*["']?(EAAB[^"'\s&]+)/gi,
        /(EAAB[A-Za-z0-9_\-\\]{15,})/g,
        /(EAAB\w+)/g
      ];

      const matches: string[] = [];
      for (const regex of regexes) {
        let match;
        while ((match = regex.exec(html)) !== null) {
          let token = match[1] || match[0];
          token = token.replace(/\\/g, '');
          matches.push(token);
        }
      }

      const uniqueMatches = Array.from(new Set(matches));

      for (const possibleToken of uniqueMatches) {
        // Validate token
        const check = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/me?access_token=${possibleToken}`,
          method: 'GET'
        }) as any;
        const parsed = typeof check.data === 'string' ? JSON.parse(check.data) : check.data;

        if (parsed && !parsed.error) {
          supabase.auth.updateUser({
            data: { recent_eaab_token: possibleToken, last_eaab_token_update: new Date().toISOString() }
          }).catch(() => { });
          return possibleToken;
        }
      }
    }

    throw new Error('ไม่พบ EAAB Token (กรุณาเข้า facebook.com ที่แท็บใหม่ แล้วลองอีกครั้ง)');
  } catch (error) {
    throw error;
  }
}

export async function fetchAdminPages(token: string): Promise<FacebookPage[]> {
  try {
    const res = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/me/accounts?access_token=${token}&fields=id,name,access_token,category,tasks,picture{url}&limit=2000`,
      method: 'GET'
    });

    const proxyRes = res as { success?: boolean; data?: string; error?: string };
    if (proxyRes.error) throw new Error(proxyRes.error);

    const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
    if (data.error) throw new Error(data.error.message);

    if (data && data.data) {
      const pages: FacebookPage[] = data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
        category: page.category || '',
        tasks: page.tasks || [],
        picture_url: page.picture?.data?.url || undefined
      }));
      return pages;
    }

    return [];
  } catch (error) {
    console.error('fetchAdminPages error:', error);
    throw error;
  }
}

export async function fetchUserGroups(token: string, adminOnly: boolean = false): Promise<FacebookGroup[]> {
  try {
    if (adminOnly) {
      // Use the actual GraphQL doc_id and variables for fetching Admin Groups
      const { fb_dtsg, actor_id } = await fetchWebDTSGData();

      const variables = JSON.stringify({ adminGroupsCount: 200, scale: 1 });

      const res = await SendRequestToExtension('PROXY_UPLOAD', {
        url: 'https://www.facebook.com/api/graphql/',
        headers: {
          'Accept': '*/*'
        },
        formDataEntries: [
          { type: 'text', name: 'fb_dtsg', value: fb_dtsg },
          { type: 'text', name: 'variables', value: variables },
          { type: 'text', name: 'doc_id', value: '4136833213019689' }
        ]
      });

      const proxyRes = res as { success?: boolean; data?: string; error?: string };
      if (proxyRes.error) throw new Error(proxyRes.error);

      let json: any = {};
      try {
        json = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
      } catch (err) {
        throw new Error(`GraphQL response parse error. Raw data: ${proxyRes.data}`);
      }
      if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));

      const groups: FacebookGroup[] = [];

      let allGroupLists: { path: string, items: any[] }[] = [];

      const findLists = (obj: any, path: string = '') => {
        if (!obj) return;

        const items = obj.edges || obj.nodes;
        if (items && Array.isArray(items) && items.length > 0) {
          const firstNode = items[0].node || items[0];
          if (firstNode && (firstNode.__typename === 'Group' || firstNode.privacy || firstNode.viewer_group_role || firstNode.cover_photo)) {
            allGroupLists.push({ path, items });
          }
        }

        if (Array.isArray(obj)) {
          obj.forEach(item => findLists(item, path));
        } else if (typeof obj === 'object') {
          Object.keys(obj).forEach(k => {
            const newPath = path ? `${path}.${k}` : k;
            findLists(obj[k], newPath);
          });
        }
      };

      findLists(json);

      if (allGroupLists.length === 0) {
        console.error("GraphQL Response:", json);
        throw new Error("ไม่พบรายการกลุ่มใดๆ ในผลลัพธ์จาก Facebook");
      }

      // 1. Find the list whose JSON path contains admin-related keywords
      // We must explicitly exclude 'nonadmin' because Facebook uses 'nonAdminGroups' which contains the word 'admin'!
      let targetList = allGroupLists.find(l => {
        const lowerPath = l.path.toLowerCase();
        return (lowerPath.includes('admin') || lowerPath.includes('manage')) && !lowerPath.includes('nonadmin');
      });

      let finalItems: any[] = [];

      if (targetList) {
        finalItems = targetList.items;
      } else {
        // Safe fallback: print the JSON paths and the first group name to debug
        const allTexts = allGroupLists.map(l => {
          const firstGroupName = l.items[0]?.node?.name || l.items[0]?.name || 'Unknown';
          return `[Path: "${l.path}" -> ${firstGroupName}]`;
        });
        
        // If the user has 0 admin groups, targetList will be undefined, but we don't want to throw an error.
        // We just return empty array so the UI shows no groups instead of breaking.
        // Wait, I will only throw error if allGroupLists has elements but NONE are admin groups?
        // No, if they have no admin groups, we just return empty.
        console.warn("No Admin Groups found in paths:", allTexts);
        finalItems = [];
      }

      finalItems.forEach((edge: any) => {
        const node = edge.node || edge;
        if (node && node.id && node.name) {
          // Avoid duplicates
          if (!groups.find(g => g.id === node.id)) {
            groups.push({
              id: node.id,
              name: node.name,
              privacy: node.privacy || '',
              icon: node.cover_photo?.photo?.image?.uri || node.cover_photo?.source || node.profile_picture?.uri || undefined
            });
          }
        }
      });

      if (groups.length === 0) {
        console.log("Raw GraphQL Response for Groups:", json);
      }
      return groups;
    }

    // Graph API approach for ALL groups (when adminOnly is false)
    const res = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/me/groups?access_token=${token}&fields=id,name,privacy,icon,cover{source}&limit=1000`,
      method: 'GET'
    });

    const proxyRes = res as { success?: boolean; data?: string; error?: string };
    if (proxyRes.error) throw new Error(proxyRes.error);

    const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
    if (data.error) throw new Error(data.error.message);

    if (data && data.data) {
      const groups: FacebookGroup[] = data.data.map((group: any) => ({
        id: group.id,
        name: group.name,
        privacy: group.privacy || '',
        icon: group.cover?.source || group.icon || undefined
      }));
      return groups;
    }

    return [];
  } catch (error) {
    console.error('fetchUserGroups error:', error);
    throw error;
  }
}

export interface BusinessAccount {
  id: string;
  name: string;
  verification_status?: string;
  created_time?: string;
}

export async function fetchBusinessAccounts(token: string): Promise<BusinessAccount[]> {
  try {
    const res = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/me/businesses?access_token=${token}&fields=id,name,verification_status,created_time&limit=100`,
      method: 'GET'
    });

    const proxyRes = res as { success?: boolean; data?: string; error?: string };
    if (proxyRes.error) throw new Error(proxyRes.error);

    const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
    if (data.error) throw new Error(data.error.message);

    if (data && data.data) {
      return data.data.map((biz: any) => ({
        id: biz.id,
        name: biz.name || `Business ${biz.id}`,
        verification_status: biz.verification_status,
        created_time: biz.created_time
      }));
    }

    return [];
  } catch (error) {
    console.error('fetchBusinessAccounts error:', error);
    throw error;
  }
}

export interface AdAccount {
  account_id: string;
  account_status: number;
  name?: string;
  id: string; // The full act_XXXXX id
}

export async function fetchAdAccounts(token: string): Promise<AdAccount[]> {
  try {
    const res = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/me/adaccounts?access_token=${token}&fields=account_status,account_id,name&limit=100`,
      method: 'GET'
    });

    const proxyRes = res as { success?: boolean; data?: string; error?: string };
    if (proxyRes.error) throw new Error(proxyRes.error);

    const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
    if (data.error) throw new Error(data.error.message);

    if (data && data.data) {
      return data.data.map((ad: any) => ({
        account_id: ad.account_id,
        account_status: ad.account_status,
        name: ad.name || `Ad Account ${ad.account_id}`,
        id: ad.id // e.g. act_1234567890
      }));
    }

    return [];
  } catch (error) {
    console.error('fetchAdAccounts error:', error);
    throw error;
  }
}

export interface AdImage {
  hash: string;
  url: string;
  name?: string;
}

export async function fetchAdImages(token: string, adAccountId: string): Promise<AdImage[]> {
  try {
    const res = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/${adAccountId}/adimages?access_token=${token}&fields=hash,url,name&limit=2000&upfeedthcors=0`,
      method: 'GET'
    });

    const proxyRes = res as { success?: boolean; data?: string; error?: string };
    if (proxyRes.error) throw new Error(proxyRes.error);

    const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
    if (data.error) throw new Error(data.error.message);

    if (data && data.data) {
      return data.data.map((img: any) => ({
        hash: img.hash,
        url: img.url,
        name: img.name
      }));
    }

    return [];
  } catch (error) {
    console.error('fetchAdImages error:', error);
    throw error;
  }
}
