// Extension Bridge for Upfeed Proxy
// Communicates with the injected content.js using window.postMessage

interface ExtensionPayload {
  url?: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export function SendRequestToExtension(type: string, body: ExtensionPayload): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // 1. Basic check if extension appears to be installed
    if (typeof window === 'undefined') {
      return reject(new Error('Cannot communicate with extension on server side.'));
    }

    // We expect the extension to inject `window.upfeed = { installed: true }`
    // but even if not immediately ready, we can dispatch and timeout if no response.

    const requestId = crypto.randomUUID();

    const handleMessage = (event: MessageEvent) => {
      // Must come from same window
      if (event.source !== window) return;

      const data = event.data;
      // We check if it's the response from the extension by looking at direction and ID
      if (data && data.__upfeedth && data.direction === 'to_page' && data.requestId === requestId) {
        window.removeEventListener('message', handleMessage);

        if (data.success) {
          resolve(data.data);
        } else {
          reject(new Error(data.error || 'Unknown extension error'));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Send the message to content.js
    window.postMessage({
      __upfeedth: true,
      direction: 'to_extension',
      type,
      requestId,
      body
    }, '*');

    // Timeout mechanism (e.g., 30 seconds max for a proxied request)
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('ไม่สามารถเชื่อมต่อกับ UPFEEDTH Extension ได้ กรุณาเปิดใช้งาน Extension'));
    }, 30000);
  });
}

// Function to check if extension is installed
export function isExtensionInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  return !!window.upfeedth?.installed || !!window.upfeed?.installed;
}