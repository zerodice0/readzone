// TextEncoder/TextDecoder 폴리필 (Node.js 환경에서 누락된 경우)
const { TextEncoder, TextDecoder } = require('util');

// Global polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// BroadcastChannel 폴리필 (MSW에서 필요)
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
};

// fetch 폴리필 (이미 whatwg-fetch가 설치되어 있음)
require('whatwg-fetch');