import { faro } from "@grafana/faro-web-sdk";
import { z } from "zod";
import { get_access_token } from "../services/auth";

const EmailConsents = z.object({
	consents: z.array(z.string()),
});

export async function getEmailConsent(): Promise<string[]> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/users/me/email-consents`,
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
				`Failed to fetch self achievements : ${response.statusText}`,
			);
		}
		const data = await response.json();
		return EmailConsents.parse(data).consents;
	} catch (err) {
		faro.api.pushError(err as Error);
		console.error(err);
		throw err;
	}
}

export async function setEmailConsent(email_consent: string[]): Promise<void> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/users/me/email-consents`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
				body: JSON.stringify({ email_consent }),
			},
		);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch self achievements : ${response.statusText}`,
			);
		}
		if (!response.ok) {
			throw new Error(
				`Failed to set email consents: ${response.status} ${response.statusText}`,
			);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		console.error(err);
		throw err;
	}
}
