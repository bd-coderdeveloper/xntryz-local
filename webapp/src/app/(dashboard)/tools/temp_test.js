const { SendRequestToExtension } = require('../../utils/extensionBridge');

// We can't easily test without the extension context since it relies on window.postMessage.
