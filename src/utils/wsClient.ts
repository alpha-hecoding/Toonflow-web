// utils/WsClient.ts
type WsOptions = {
  timeout?: number; // 超时时间（ms）
  reconnectInterval?: number; // 重连间隔（ms）
  maxRetries?: number; // 最大重连次数
  onMessage?: (msg: string) => void;
  onOpen?: () => void;
  onClose?: (e: any) => void;
  onError?: (err: any) => void;
};

class WsClient {
  public ws: WebSocket | null = null;
  private url: string;
  private options: WsOptions;
  private timer: number | null = null;
  private retries = 0;

  constructor(url: string, options: WsOptions = {}) {
    let baseUrl = import.meta.env.VITE_WS_URL;
    if (baseUrl.startsWith("/")) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      baseUrl = `${protocol}//${window.location.host}${baseUrl}`;
    }
    const wsUrl = new URL(baseUrl);

    const urlParts = url.split("?");
    const pathPart = urlParts[0];
    const queryPart = urlParts[1];

    if (pathPart.startsWith("/")) {
      wsUrl.pathname = wsUrl.pathname.replace(/\/$/, "") + pathPart;
    } else {
      wsUrl.pathname = wsUrl.pathname.replace(/\/$/, "") + "/" + pathPart;
    }

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      params.forEach((value, key) => {
        wsUrl.searchParams.set(key, value);
      });
    }

    const token = localStorage.getItem("token");
    if (token) wsUrl.searchParams.set("token", token);
    this.url = wsUrl.toString();
    this.options = options;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      if (this.options.onOpen) this.options.onOpen();
      this.retries = 0;
    };
    this.ws.onmessage = (e) => {
      if (this.options.onMessage) this.options.onMessage(e.data);
    };
    this.ws.onerror = () => {
      this.stopTimeout();
      this.reconnect();
    };
    this.ws.onclose = (e) => {
      if (this.options.onClose) this.options.onClose(e);
      this.stopTimeout();
      // this.reconnect();
    };
  }

  private stopTimeout() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private reconnect() {
    const maxRetries = this.options.maxRetries ?? 10;
    if (this.retries < maxRetries) {
      setTimeout(() => {
        this.retries++;
        this.connect();
      }, this.options.reconnectInterval ?? 3000);
    }
  }

  send(data: object) {
    if (this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    this.stopTimeout();
    if (this.ws) this.ws.close();
  }
}

export default WsClient;
