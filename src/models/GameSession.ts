import { z } from "zod";
import type SocketAPI from "../services/socketAPI";

export const GamePlayerModel = z.object({
	socketId: z.string(),
	userId: z.string(),
	username: z.string(),
	data: z.record(z.any()).optional(),
});
export type GamePlayerModel = z.infer<typeof GamePlayerModel>;

export const GameSessionModel = z.object({
	id: z.string(),
	players: z.array(GamePlayerModel),
	name: z.string(),
	data: z.record(z.any()).optional(),
});
export type GameSessionModel = z.infer<typeof GameSessionModel>;

export class GameSession {
	socket: SocketAPI;
	sessionId: string;
	players: GamePlayerModel[] = [];
	myUserId: string;
	name = "";
	data: Record<string, any> = {};

	constructor(socket: SocketAPI, data: any, myUserId: string) {
		const info = GameSessionModel.parse(data);
		this.socket = socket;
		this.sessionId = info.id;
		this.players = info.players;
		this.myUserId = myUserId;
		this.name = info.name;
		this.data = info.data || {};
	}

	public get playerCount() {
		return this.players.length;
	}

	public getPlayer(id: string): GamePlayerModel | undefined {
		return this.players.find((pl) => pl.userId === id || pl.socketId === id);
	}

	public getMyPlayer(): GamePlayerModel | undefined {
		return this.getPlayer(this.myUserId);
	}

	public setPlayer(player: GamePlayerModel) {
		let found = false;
		this.players = this.players.map((pl) => {
			if (pl.userId === player.userId || pl.socketId === player.socketId) {
				found = true;
				return player;
			}
			return pl;
		});
		if (!found) {
			this.players.push(player);
		}
	}

	public sendServer(action: string, payload: object) {
		this.socket.send(action, { ...payload, sessionId: this.sessionId });
	}

	public broadcastPlayers(action: string, payload: object) {
		this.socket.send("session-broadcast", {
			sessionId: this.sessionId,
			internal_action: action,
			internal_payload: payload,
		});
	}

	public addListener(action: string, callback: (data: any) => void) {
		this.socket.addListener(action, callback);
	}

	public close() {
		this.socket.close();
	}
}
