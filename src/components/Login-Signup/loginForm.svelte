
<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { LoginResponse } from "@shared/types/Auth";
import { receiveTokens } from "../../services/auth";
import notyf from "../../services/notyf";

// biome-ignore lint/style/useConst: used in svelte file
let username: string = $state("");
// biome-ignore lint/style/useConst: used in svelte file
let password: string = $state("");
let pending_api: boolean = $state(false);

async function InitAuth() {
	if (pending_api) {
		notyf.error("Une tentative de connexion est déjà en cours");
		return;
	}
	if (!username) {
		notyf.error("Veuillez remplir votre nom d'utilisateur");
		return;
	}
	if (!password) {
		notyf.error("Veuillez remplir votre mot de passe");
		return;
	}
	pending_api = true;
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
		if (data?.success) {
			notyf.success("Connexion réussie");
			await receiveTokens(data.success);
		} else if (data?.error) {
			faro.api.pushError(new Error(data.error));
			notyf.error("Echec de la connexion");
			console.error(data.error);
		} else {
			notyf.error("Comportement inatendu, veuillez ré-essayer");
			console.log(data);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		notyf.error("Echec de la connexion");
		console.error(err);
	}
	pending_api = false;
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
    <div class="w-full text-center text-white">
        <button
            class={[
                "font-semibold px-4 py-2 rounded-lg",
                pending_api ? 'bg-night-700' : 'bg-night-600 hover:bg-night-800'
            ]}
            onclick={InitAuth}
            disabled={pending_api}
        >
            Connexion
            {#if pending_api}
                <i class="fa fa-spin fa-circle-notch ml-2"></i>
            {/if}
        </button>
    </div>
</div>
