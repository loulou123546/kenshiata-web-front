import { faro } from "@grafana/faro-web-sdk";
import { type EditStory, Stories, Story } from "@shared/types/Story";
import { get_access_token } from "../services/auth";

export async function listStoriesByAuthor(author: string): Promise<Stories> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories/by-author/${encodeURIComponent(author)}`,
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
				`Failed to fetch stories from author ${author} : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return Stories.parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function getStory(id: string): Promise<Story> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories/${encodeURIComponent(id)}`,
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
				`Failed to fetch story id ${id} : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return Story.parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function createStory(name: string): Promise<Story> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
				body: JSON.stringify({ name }),
			},
		);
		if (!response.ok) {
			throw new Error(
				`Failed to create story with name ${name} : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return Story.parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function editStory(story: EditStory): Promise<Story> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories/${story.id}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
				body: JSON.stringify(story),
			},
		);
		if (!response.ok) {
			throw new Error(`Failed to edit story ${name} : ${response.statusText}`);
		}
		const data = await response.json();
		return Story.parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
