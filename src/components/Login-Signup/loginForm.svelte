
<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { LoginResponse } from "@shared/types/Auth";
import { receiveTokens } from "../../services/auth";

// biome-ignore lint/style/useConst: <explanation>
let username: string = $state("");
// biome-ignore lint/style/useConst: <explanation>
let password: string = $state("");

async function InitAuth() {
	try {
		faro.api.pushEvent(`init new login request for ${username}`);
		const res = await fetch(`${import.meta.env.PUBLIC_API_DOMAIN}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				username,
				password,
			}),
		});
		const data = LoginResponse.parse(await res.json());
		if (data?.success) receiveTokens(data.success);
		else if (data?.error) console.error(data.error);
		else {
			console.log(data);
		}
	} catch (err) {
		console.error(err);
	}
}
</script>

<div>
    <div class="mb-4">
        <label
            for="username"
            class="block text-sm font-medium font-semibold text-gray-800 mb-2"
            >Nom d'utilisateur / Email</label
        >
        <input
            id="username"
            type="text"
            class="w-full p-2 rounded-lg bg-gray-100 text-black"
            placeholder="Entrer votre pseudo / email"
            bind:value={username}
            required
            autocomplete="username"
        />
    </div>
    <div class="mb-4">
        <label
            for="password"
            class="block text-sm font-medium font-semibold text-gray-800 mb-2"
            >Mot de passe</label
        >
        <input
            id="password"
            type="password"
            class="w-full p-2 rounded-lg bg-gray-100 text-black"
            placeholder="Entrez votre mot de passe"
            bind:value={password}
            required
            autocomplete="current-password"
        />
    </div>
    <div class="w-full text-center">
        <button class="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg" onclick={InitAuth}>Connexion</button>
    </div>
</div>
