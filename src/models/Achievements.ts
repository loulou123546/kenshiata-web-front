import { faro } from "@grafana/faro-web-sdk";
import { Achievement, PlayerAchievement } from "@shared/types/Achievement";
import { atom } from "nanostores";
import { z } from "zod";
import { get_access_token } from "../services/auth";

export const myAchievements = atom<PlayerAchievement[]>([]);

export async function getMyAchievements(): Promise<PlayerAchievement[]> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/users/me/achievements`,
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
				`Failed to fetch self achievements : ${response.status} ${response.statusText}`,
			);
		}
		const data = await response.json();
		return z.array(PlayerAchievement).parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		console.error(err);
		throw err;
	}
}

export async function getStoryAchievements(
	storyId: string,
): Promise<Achievement[]> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories/${encodeURIComponent(storyId)}/achievements`,
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
				`Failed to fetch achievements for story ${storyId} : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return z.array(Achievement).parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
