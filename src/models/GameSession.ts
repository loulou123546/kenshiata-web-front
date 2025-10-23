import { faro } from "@grafana/faro-web-sdk";
import type { GamePlayer } from "@shared/types/GamePlayer";
import {
	type GameSessionData,
	GameSession as GameSessionModel,
	UserGameSession,
} from "@shared/types/GameSession";
import { z } from "zod";
import { get_access_token } from "../services/auth";
import type SocketAPI from "../services/socketAPI";

export class GameSession {
	socket: SocketAPI;
	sessionId: string;
	players: GamePlayer[] = [];
	myUserId: string;
	name = "";
	data: GameSessionData = {};
	already_running: boolean = false;

	constructor(
		socket: SocketAPI,
		data: GameSessionModel,
		myUserId: string,
		already_running: boolean = false,
	) {
		const info = GameSessionModel.parse(data);
		this.socket = socket;
		this.sessionId = info.id;
		this.players = info.players;
		this.myUserId = myUserId;
		this.name = info.name;
		this.data = info.data || {};
		this.already_running = already_running || false;
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

export async function getMyGameSessions(): Promise<UserGameSession[]> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/users/me/game-sessions`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
			},
		);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch self game sessions : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return z.array(UserGameSession).parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		console.error(err);
		throw err;
	}
}

export async function deletePreviousGameSession(
	sessionId: string,
): Promise<void> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/users/me/game-sessions/${encodeURIComponent(sessionId)}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
			},
		);
		if (!response.ok) {
			throw new Error(
				`Failed to delete previous game session : ${response.status} ${response.statusText}`,
			);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
