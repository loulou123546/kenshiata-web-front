import { faro } from "@grafana/faro-web-sdk";
import type { GamePlayer } from "@shared/types/GamePlayer";
import {
	type GameSessionData,
	GameSession as GameSessionModel,
} from "@shared/types/GameSession";
import type SocketAPI from "../services/socketAPI";

export class GameSession {
	socket: SocketAPI;
	sessionId: string;
	players: GamePlayer[] = [];
	myUserId: string;
	name = "";
	data: GameSessionData = {};

	constructor(socket: SocketAPI, data: GameSessionModel, myUserId: string) {
		const info = GameSessionModel.parse(data);
		this.socket = socket;
		this.sessionId = info.id;
		this.players = info.players;
		this.myUserId = myUserId;
		this.name = info.name;
		this.data = info.data || {};
		faro.api.pushEvent("game session instanciated", {
			sessionId: this.sessionId,
			name: this.name,
			playerCount: String(this.playerCount),
		});
	}

	public get playerCount() {
		return this.players.length;
	}

	public getPlayer(id: string): GamePlayer | undefined {
		return this.players.find((pl) => pl.userId === id || pl.socketId === id);
	}

	public getMyPlayer(): GamePlayer | undefined {
		return this.getPlayer(this.myUserId);
	}

	public setPlayer(player: GamePlayer) {
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

	public addListener(action: string, callback: (data: unknown) => void) {
		this.socket.addListener(action, callback);
	}

	public close() {
		this.socket.close();
	}
}
