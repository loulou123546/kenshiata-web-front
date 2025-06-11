import type { User } from "../models/user";

export default class SocketAPI {
	private socket: WebSocket | null = null;
	private listeners: { [key: string]: ((data: any) => void)[] } = {};
	private socketId: string | null = null;
	private resolveAfterWhoami: (value: string) => void = () => {};
	private logger: (...data: any[]) => void = console.log;

	constructor({logger}: { logger?: (...data: any[]) => void } = {}) {
		if (logger) this.logger = logger;
		if (!import.meta.env.PUBLIC_WEBSOKET) throw new Error("PUBLIC_WEBSOKET variable is not defined");

		this.socket = new WebSocket(import.meta.env.PUBLIC_WEBSOKET);
		// La connexion est ouverte
		this.socket.addEventListener("open", (event) => {
			this.logger("WebSocket: connection opened");
		});
		// Écouter les messages
		this.socket.addEventListener("message", (event) => {
			this.logger("Voici un message du serveur", event.data);
			const data = JSON.parse(event.data);
			if (this.listeners[data.action]) {
				this.listeners[data.action].forEach((callback: (data: any) => void) => {
					callback(data);
				});
			}
		});
		this.addListener("whoami", (data: any) => {
			if (!data || !data.socketId)
				this.logger("WebSocket: Invalid data received for 'whoami':", data);
			this.socketId = data.socketId;
			this.logger("WebSocket: whoami received, socketId:", this.socketId);
			this.resolveAfterWhoami?.(data.socketId);
			this.resolveAfterWhoami = (_a) => {}; // promise should only resolve once
		});
	}

	public get ready() {
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}

	public get socketID() {
		return this.socketId;
	}

	public async connected(): Promise<void> {
		if (this.ready) return Promise.resolve();
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error("Socket is not initialized"));
				return;
			}
			this.socket.addEventListener("open", () => {
				resolve();
			});
		});
	}

	public authenticate(user: User): Promise<string> {
		if (!this.socket || !this.ready) throw new Error("Socket is not ready");
		const prom = new Promise<string>((resolve) => {
			this.resolveAfterWhoami = resolve;
		});
		this.socket.send(
			JSON.stringify({
				action: "set-player",
				user
			}),
		);
		this.logger("WebSocket: authenticate with username:", user.username);
		return prom;
	}

	public close() {
		if (!this.socket || !this.ready) throw new Error("Socket is not ready");
		this.socket.close();
	}

	public send(action: string, data: object) {
		if (!this.socket || !this.ready) throw new Error("Socket is not ready");
		this.socket.send(
			JSON.stringify({
				action,
				...data,
			}),
		);
	}

	public addListener(action: string, callback: (data: any) => void) {
		if (!this.listeners[action]) this.listeners[action] = [];
		this.listeners[action].push(callback);
	}
}
