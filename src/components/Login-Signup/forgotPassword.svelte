<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { LoginResponse } from "@shared/types/Auth";
import { receiveTokens } from "../../services/auth";
import notyf from "../../services/notyf";
import Turnstile from "../Turnstile.svelte";

let step: "ask_code" | "confirm" = $state("ask_code");

// biome-ignore lint/style/useConst: used in svelte file
let username: string = $state("");
// biome-ignore lint/style/useConst: used in svelte file
let password: string = $state("");
let turnstile_token: string = $state("");
let uniqueKey_reloadTurnstile = $state({});

// biome-ignore lint/style/useConst: used in svelte file
let confirm_code: string = $state("");
let pending_api: boolean = $state(false);

function successTurnstile(token: string) {
	faro.api.pushEvent("Obtained new token from turnstile auth");
	turnstile_token = token;
}

async function AskForCode() {
	if (pending_api) {
		notyf.error("Une demande de ré-initialisation est déjà en cours");
		return;
	}
	if (!username) {
		notyf.error("Veuillez remplir votre nom d'utilisateur / addresse email");
		return;
	}
	if (!turnstile_token) {
		notyf.error("Veuillez valider le contrôle de sécurité Cloudflare");
		return;
	}
	pending_api = true;
	try {
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/auth/forgot-password`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					username,
					turnstileToken: turnstile_token,
				}),
			},
		);
		if (res.ok) {
			notyf.success("Code envoyé sur l'adresse email associé au compte");
			step = "confirm";
		} else {
			notyf.error(
				"Une erreur est survenu dans la validation du contrôle anti-robot, veuillez ré-essayer",
			);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		notyf.error(
			"Erreur réseau lors de la demande de code, veuillez ré-essayer",
		);
	}
	pending_api = false;
	uniqueKey_reloadTurnstile = {};
}

async function ConfirmPasswordReset() {
	if (pending_api) {
		notyf.error("Une demande de ré-initialisation est déjà en cours");
		return;
	}
	if (!username) {
		notyf.error("Erreur interne, veuillez-réessayer (nom d'utilisateur perdu)");
		return;
	}
	if (!password) {
		notyf.error("Veuillez choisir votre nouveau mot de passe");
		return;
	}
	if (!confirm_code) {
		notyf.error("Veuillez remplir le code de validation");
		return;
	}
	pending_api = true;
	try {
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/auth/password-reset`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					username,
					code: confirm_code,
					password,
				}),
			},
		);
		const data = LoginResponse.parse(await res.json());
		if (data?.success) {
			notyf.success("Changement de mot de passe réussi, connexion en cours");
			await receiveTokens(data.success);
		} else if (data?.error) {
			faro.api.pushError(new Error(data?.error));
			switch (data?.error) {
				case "AliasExistsException":
					notyf.error(
						"Cette adresse email est déjà utilisé sur un autre compte",
					);
					break;
				case "CodeMismatchException":
					notyf.error("Le code fourni n'est pas correct");
					break;
				case "ExpiredCodeException":
					notyf.error("Le code fourni est obsolète, veuillez recommencer");
					break;
				case "PasswordHistoryPolicyViolationException":
					notyf.error(
						"Le mot de passe est trop proche d'un ancien mot de passe utilisé sur ce compte",
					);
					break;
				default:
					notyf.error("Echec lors du changement de mot de passe");
					console.error(data.error);
					break;
			}
		} else {
			notyf.error("Comportement inatendu, veuillez ré-essayer");
			console.log(data);
		}
	} catch (err) {
		faro.api.pushError(err as Error);
		notyf.error("Echec lors du changement de mot de passe");
	}
	pending_api = false;
}
</script>

<div>
    {#if step === "ask_code"}
        <div class="mb-4">
            <label
                for="username"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Nom d'utilisateur / addresse email</label
            >
            <input
                id="username"
                type="text"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="Entrer votre pseudo ou email"
                bind:value={username}
                required
                autocomplete="username"
            />
            <p class="mt-1 text-gray-600 text-sm">Veuillez renseigner votre nom d'utilisateur ou l'addresse email associé à votre compte.</p>
        </div>
		{#key uniqueKey_reloadTurnstile}
        	<Turnstile action="forgot-password" onSuccess={successTurnstile} onError={console.error}></Turnstile>
		{/key}
        <div class="w-full text-center mt-2 text-white">
            <button
                class={[
                    "font-semibold px-4 py-2 rounded-lg",
                    pending_api ? 'bg-night-700' : 'bg-night-600 hover:bg-night-800'
                ]}
                onclick={AskForCode}
                disabled={pending_api}
            >
                Demande de nouveau mot de passe
                {#if pending_api}
                    <i class="fa fa-spin fa-circle-notch ml-2"></i>
                {/if}
            </button>
        </div>
    {:else}
        <div class="mb-4">
            <label
                for="password"
                class="block text-sm font-medium font-semibold text-gray-800 mb-2"
                >Créer un nouveau mot de passe</label
            >
            <input
                id="password"
                type="password"
                class="w-full p-2 rounded-lg bg-gray-100 text-black"
                placeholder="Entrez un nouveau mot de passe"
                bind:value={password}
                required
                autocomplete="new-password"
            />
            <p class="mt-1 text-gray-600 text-sm">Au minimum 8 caractères. Doit inclure au moins une majuscule, une minuscule, un chiffre et un caractère spécial.</p>
        </div>
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
            <p class="mt-1 text-gray-600 text-sm">
                Un code vous à était envoyé sur votre adresse email, veuillez le copier ici afin de valider la demande de réinitialisation de mot de passe.
            </p>
        </div>
        <div class="w-full text-center mt-2 text-white">
            <button
                class={[
                    "font-semibold px-4 py-2 rounded-lg",
                    pending_api ? 'bg-night-700' : 'bg-night-600 hover:bg-night-800'
                ]}
                onclick={ConfirmPasswordReset}
                disabled={pending_api}
            >
                Réinitialiser mon mot de passe
                {#if pending_api}
                    <i class="fa fa-spin fa-circle-notch ml-2"></i>
                {/if}
            </button>
        </div>
    {/if}
</div>
