import { faro } from "@grafana/faro-web-sdk";
import { get_access_token } from "./auth";

type Logger = (...data: unknown[]) => void;

export default class SocketAPI {
	private socket: WebSocket | null = null;
	private listeners: { [key: string]: ((data: unknown) => void)[] } = {};
	private logger: Logger = console.log;

	constructor({ logger, token }: { logger?: Logger; token: string }) {
		if (logger) this.logger = logger;
		if (!import.meta.env.PUBLIC_WEBSOKET)
			throw new Error("PUBLIC_WEBSOKET variable is not defined");

		this.socket = new WebSocket(
			`${import.meta.env.PUBLIC_WEBSOKET}?token=${token}`,
		);
		// La connexion est ouverte
		this.socket.addEventListener("open", (event) => {
			this.logger("WebSocket: connection opened");
		});
		// Écouter les messages
		this.socket.addEventListener("message", (event) => {
			this.logger("Voici un message du serveur", event.data);
			const data = JSON.parse(event.data);
			if (this.listeners[data.action]) {
				for (const callback of this.listeners[data.action]) {
					callback(data);
				}
			}
		});
		this.socket.addEventListener("error", (event: Event) => {
			faro.api.pushError(
				new Error(`WebSocket error: ${JSON.stringify(event)}`),
			);
		});
	}

	public get ready() {
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}

	public async waitReady(): Promise<void> {
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

	public close() {
		if (!this.socket) throw new Error("Socket is not ready");
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

	public addListener(action: string, callback: (data: unknown) => void) {
		if (!this.listeners[action]) this.listeners[action] = [];
		this.listeners[action].push(callback);
	}

	public static async create(logger?: Logger): Promise<SocketAPI> {
		const token = await get_access_token();
		if (!token) throw new Error("User is not authenticated");
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/open-socket`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				mode: "cors",
			},
		);
		const data = await res.json();
		if (!res.ok || !data?.data?.token) {
			throw new Error("Server declined the socket connection");
		}
		const socket = new SocketAPI({ logger, token: data.data.token });
		return socket;
	}
}
