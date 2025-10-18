
<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { LoginResponse, SignupResponse } from "@shared/types/Auth";
import { receiveTokens } from "../../services/auth";
import notyf from "../../services/notyf";
import Turnstile from "../Turnstile.svelte";

let step: "create" | "confirm" = $state("create");

// biome-ignore lint/style/useConst: used in svelte file
let username: string = $state("");
// biome-ignore lint/style/useConst: used in svelte file
let password: string = $state("");
// biome-ignore lint/style/useConst: used in svelte file
let email: string = $state("");
let turnstile_token: string = $state("");

let confirm_via: string = $state("");
let confirm_to: string = $state("");
// biome-ignore lint/style/useConst: used in svelte file
let confirm_code: string = $state("");
let session: string = $state("");
let pending_api: boolean = $state(false);

function successTurnstile(token: string) {
	turnstile_token = token;
}

async function InitSignUp() {
	if (pending_api) {
		notyf.error("Une tentative d'inscription est déjà en cours");
		return;
	}
	if (!username) {
		notyf.error("Veuillez remplir votre nom d'utilisateur");
		return;
	}
	if (!email) {
		notyf.error("Veuillez remplir votre email");
		return;
	}
	if (!password) {
		notyf.error("Veuillez remplir votre mot de passe");
		return;
	}
	if (!turnstile_token) {
		notyf.error("Veuillez valider le contrôle de sécurité Cloudflare");
		return;
	}
	pending_api = true;
	try {
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/auth/signup`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					username,
					password,
					email,
					turnstileToken: turnstile_token,
				}),
			},
		);
		const data = SignupResponse.parse(await res.json());
		if (data?.success) {
			notyf.success("Inscription validé, connexion en cours");
			await receiveTokens(data.success); // never happen in normal conditions
		} else if (data?.continue?.code_sent) {
			notyf.success("Pré-inscription confirmée, veuillez valider votre email");
			confirm_to = data.continue?.code_sent_to;
			confirm_via = data.continue?.code_sent_via;
			session = data.continue?.session_id;
			step = "confirm";
		} else if (data?.error) {
			faro.api.pushError(new Error(data?.error));
			notyf.error("Echec lors de l'inscription");
			console.error(data.error);
		} else {
			notyf.error("Comportement inatendu, veuillez ré-essayer");
			console.log(data);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		notyf.error("Echec lors de l'inscription");
		console.error(err);
	}
	pending_api = false;
}

async function ConfirmSignUp() {
	if (pending_api) {
		notyf.error("Une tentative d'inscription est déjà en cours");
		return;
	}
	if (!username) {
		notyf.error("Erreur interne, veuillez-réessayer (nom d'utilisateur perdu)");
		return;
	}
	if (!session) {
		notyf.error("Erreur interne, veuillez-réessayer (session perdu)");
		return;
	}
	if (!confirm_code) {
		notyf.error("Veuillez remplir le code de validation");
		return;
	}
	pending_api = true;
	try {
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/auth/signup-confirm`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					username,
					code: confirm_code,
					session_id: session,
				}),
			},
		);
		const data = LoginResponse.parse(await res.json());
		if (data?.success) {
			notyf.success("Inscription réussie, connexion en cours");
			await receiveTokens(data.success);
		} else if (data?.error) {
			faro.api.pushError(new Error(data?.error));
			notyf.error("Echec lors de l'inscription");
			console.error(data.error);
		} else {
			notyf.error("Comportement inatendu, veuillez ré-essayer");
			console.log(data);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		notyf.error("Echec lors de l'inscription");
		console.error(err);
	}
	pending_api = false;
}
</script>

<div>
    {#if step === "create"}
        <div class="mb-4">
            <label
                for="username"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Nom d'utilisateur</label
            >
            <input
                id="username"
                type="text"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="Choisissez un nom de joueur"
                bind:value={username}
                required
                autocomplete="username"
            />
            <p class="mt-1 text-gray-600 text-sm">Ce nom sera utilisé pour vous identifier de manière unique.
                Vous pourrez ensuite créer autant de personnages jouable que vous le souhaitez.</p>
        </div>
        <div class="mb-4">
            <label
                for="email"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Adresse email</label
            >
            <input
                id="email"
                type="email"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="Entrer votre adresse email"
                bind:value={email}
                required
                autocomplete="email"
            />
            <p class="mt-1 text-gray-600 text-sm">Un code de validation sera envoyé sur cette adresse email afin de valider votre compte.</p>
        </div>
        <div class="mb-4">
            <label
                for="password"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Créer un mot de passe</label
            >
            <input
                id="password"
                type="password"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="Entrez un mot de passe"
                bind:value={password}
                required
                autocomplete="new-password"
            />
            <p class="mt-1 text-gray-600 text-sm">Au minimum 8 caractères. Doit inclure au moins une majuscule, une minuscule, un chiffre et un caractère spécial.</p>
        </div>
        <Turnstile action="signup" onSuccess={successTurnstile} onError={console.error}></Turnstile>
        <div class="w-full text-center mt-2 text-white">
            <button
                class={[
                    "font-semibold px-4 py-2 rounded-lg",
                    pending_api ? 'bg-night-700' : 'bg-night-600 hover:bg-night-800'
                ]}
                onclick={InitSignUp}
                disabled={pending_api}
            >
                Inscription
                {#if pending_api}
                    <i class="fa fa-spin fa-circle-notch ml-2"></i>
                {/if}
            </button>
        </div>
    {:else}
        <div class="mb-4">
            <label
                for="confirmCode"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Code de validation</label
            >
            <input
                id="confirmCode"
                type="text"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="******"
                bind:value={confirm_code}
                required
                autocomplete="one-time-code"
            />
            {#if confirm_via.toLowerCase() === "phone"}
                <p class="mt-1 text-gray-600 text-sm">Veuillez copier le code reçu par téléphone au numéro {confirm_to}.</p>
            {:else if confirm_via.toLowerCase() === "email"}
                <p class="mt-1 text-gray-600 text-sm">Veuillez copier le code reçu sur l'adresse email {confirm_to}.</p>
            {:else}
                <p class="mt-1 text-gray-600 text-sm">Un code vous à était envoyé ({confirm_to}), veuillez le copier ici afin de valider la création de votre compte.</p>
            {/if}
        </div>
        <div class="w-full text-center mt-2 text-white">
            <button
                class={[
                    "font-semibold px-4 py-2 rounded-lg",
                    pending_api ? 'bg-night-700' : 'bg-night-600 hover:bg-night-800'
                ]}
                onclick={ConfirmSignUp}
                disabled={pending_api}
            >
                Confirmer mon compte
                {#if pending_api}
                    <i class="fa fa-spin fa-circle-notch ml-2"></i>
                {/if}
            </button>
        </div>
    {/if}
</div>
