import { z } from "zod";
import WebRTCAPI from "../services/webrtc";
import { Player } from "./players.ts";
import SocketAPI from "./websockets.ts";

export const NetworkUser = z.object({
	socketId: z.string(),
	player: Player,
});
export type NetworkUser = z.infer<typeof NetworkUser>;

export default class NetworkSync {
	private socket: SocketAPI;
	private webrtc: WebRTCAPI | undefined = undefined;
	private me: NetworkUser | undefined = undefined;
	private target: NetworkUser | undefined = undefined;
	private listeners: { [key: string]: ((data: any) => void)[] };
	private isHost = false;
	private connectedPromise:
		| { resolve: (value: any) => void; reject: (error: any) => void }
		| undefined = undefined;

	constructor() {
		this.listeners = { default: [] };
		this.socket = new SocketAPI();
		this.setupPlayerRequest();
	}

	public async start(me: Player) {
		await this.socket.connected();
		await this.socket.authenticate(me.username);
		this.me = NetworkUser.parse({
			socketId: this.socket.socketID,
			player: me,
		});
	}

	public async askToConnectTo(target: NetworkUser) {
		if (!this.me) {
			throw new Error(
				"You must start the NetworkSync with your player before asking to connect to another player.",
			);
		}
		const prom = new Promise((resolve, reject) => {
			this.connectedPromise = { resolve, reject };
		});
		this.target = target;
		this.socket.sendData("play-together-request", { from: this.me, target });
		return prom;
	}

	public async send(action: string, data: any) {
		if (!this.webrtc) {
			throw new Error("You are not connected to any player");
		}
		this.webrtc.sendMessage(JSON.stringify({ action, ...data }));
	}

	public addListener(action: string, callback: (data: any) => void) {
		if (!this.listeners[action]) this.listeners[action] = [];
		this.listeners[action].push(callback);
	}

	private setupPlayerRequest() {
		this.socket.addListener("play-together-request", (data: any) => {
			console.log("play-together-request", data);
			const { from, target } = data;
			const accept = confirm(
				`Voulez-vous jouer avec ${from.player.username} (${from.socketId}) ?`,
			);
			this.socket.sendData("play-together-response", {
				from: target,
				target: from,
				accept,
			});
			if (accept) {
				this.isHost = false;
				this.setupWebRTC(target, from);
			}
		});

		this.socket.addListener("play-together-response", (data: any) => {
			console.log("play-together-response", data);
			const { from, target, accept } = data;
			if (accept) {
				alert(
					`${from.player.username} (${from.socketId}) à accepté votre invitation`,
				);
				this.isHost = true;
				this.setupWebRTC(target, from);
				this.connectedPromise?.resolve(true);
			} else {
				alert(
					`${from.player.username} (${from.socketId}) à refusé votre invitation`,
				);
				this.connectedPromise?.reject(new Error("Invitation refused"));
			}
		});
	}

	private setupWebRTC(from: NetworkUser, target: NetworkUser) {
		this.webrtc = new WebRTCAPI(this.isHost, this.socket, from, target);
		this.webrtc.onMessage((raw: any) => {
			try {
				const data = JSON.parse(raw);
				if (data.action) {
					this.listeners[data.action]?.forEach((callback) => {
						callback(data);
					});
				} else {
					this.listeners["default"]?.forEach((callback) => {
						callback(data);
					});
				}
			} catch {
				this.listeners["default"]?.forEach((callback) => {
					callback(raw);
				});
			}
		});
	}

	public get host() {
		return this.isHost;
	}

	public close() {
		this.socket.close();
	}
}
