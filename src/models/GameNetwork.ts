
export class GameNetwork {
    private listeners: { [key: string]: ((data: any) => void)[] } = {};
    private sendFunction: ((action: string, data: any) => void) | undefined = undefined;
    private msgQueue: { action: string, data: any, onSent: () => void }[] = [];
    private receivedPong: boolean = false;
    private onReadyCB: (() => void)[] = [];
    public amIHost: boolean;

    constructor(isHost: boolean) {
        this.addListener("ping", () => {
            this.send("pong", {});
        });
        this.addListener("pong", () => {
            this.receivedPong = true;
            this.onReadyCB.forEach((cb) => cb());
        });
        this.amIHost = isHost;
    }

    public get ready (): boolean {
        return this.receivedPong;
    }

    public get isHost(): boolean {
        return this.amIHost;
    }

    public async waitForReady(): Promise<void> {
        if (this.ready) return;
        return new Promise((resolve) => {
            this.onReadyCB.push(resolve);
        });
    }

    public addListener(action: string, callback: (data: any) => void) {
        if (!this.listeners[action]) this.listeners[action] = [];
        this.listeners[action].push(callback);
    }

    public send(action: string, data: any): Promise<void> {
        if (!this.sendFunction) {
            const prom = new Promise<void>((resolve) => {
                this.msgQueue.push({ action, data, onSent: resolve });
            });
            return prom;
        }
        this.sendFunction(action, data);
        return Promise.resolve();
    }

    public internal_registerSendfunction (sendFunction: (action: string, data: any) => void) {
        this.sendFunction = sendFunction;
        this.msgQueue.forEach((msg) => {
            // @ts-ignore
            this.sendFunction(msg.action, msg.data);
            msg.onSent();
        })
        this.msgQueue = [];
    }

    public internal_receivedMessage(action: string, data: any) {
        if (this.listeners[action]) {
            this.listeners[action].forEach((callback) => {
                callback(data);
            });
        } else if (this.listeners["default"]) {
            this.listeners["default"].forEach((callback) => {
                callback({ action, data });
            });
        }
    }
}
