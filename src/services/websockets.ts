export default class SocketAPI {
	private socket: WebSocket | null = null;
	private listeners: { [key: string]: ((data: any) => void)[] } = {};
	private socketId: string | null = null;
	private resolveAfterWhoami: (value: string) => void = () => {};

	constructor() {
		this.socket = new WebSocket("ws://localhost:4200");
		// La connexion est ouverte
		this.socket.addEventListener("open", (event) => {
			console.log("Connexion ouverte avec le serveur WebSocket");
		});
		// Écouter les messages
		this.socket.addEventListener("message", (event) => {
			console.log("Voici un message du serveur", event.data);
			const data = JSON.parse(event.data);
			if (this.listeners[data.action]) {
				this.listeners[data.action].forEach((callback: (data: any) => void) => {
					callback(data);
				});
			}
		});
		this.addListener("whoami", (data: any) => {
			if (!data || !data.socketId)
				console.error("Invalid data received for 'whoami':", data);
			this.socketId = data.socketId;
			this.resolveAfterWhoami?.(data.socketId);
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

	public authenticate(username: string): Promise<string> {
		if (!this.socket || !this.ready) throw new Error("Socket is not ready");
		const prom = new Promise<string>((resolve) => {
			this.resolveAfterWhoami = resolve;
		});
		this.socket.send(
			JSON.stringify({
				action: "player-online",
				username,
			}),
		);
		return prom;
	}

	public close() {
		if (!this.socket || !this.ready) throw new Error("Socket is not ready");
		this.socket.close();
	}

	public sendData(action: string, data: object) {
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
