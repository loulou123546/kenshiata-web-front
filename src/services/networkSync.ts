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
	private connectedPromise:
		| { resolve: (value: any) => void; reject: (error: any) => void }
		| undefined = undefined;

	constructor() {
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
				this.webrtc = new WebRTCAPI(false, this.socket, target, from);
			}
		});

		this.socket.addListener("play-together-response", (data: any) => {
			console.log("play-together-response", data);
			const { from, target, accept } = data;
			if (accept) {
				alert(
					`${from.player.username} (${from.socketId}) à accepté votre invitation`,
				);
				this.webrtc = new WebRTCAPI(true, this.socket, target, from);
				this.connectedPromise?.resolve(true);
			} else {
				alert(
					`${from.player.username} (${from.socketId}) à refusé votre invitation`,
				);
				this.connectedPromise?.reject(new Error("Invitation refused"));
			}
		});
	}

	public close() {
		this.socket.close();
	}
}

export async function listNetworkUsers(): Promise<NetworkUser[]> {
	const response = await fetch("http://localhost:4200/players/online", {
		method: "GET",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (!response.ok) {
		return [];
	}
	const data = await response.json();
	return data
		.map((user: any) => {
			try {
				return NetworkUser.parse({
					socketId: user.socketId,
					player: {
						username: user.username,
					},
				});
			} catch {
				return undefined;
			}
		})
		.filter((user: NetworkUser | undefined) => user !== undefined);
}
