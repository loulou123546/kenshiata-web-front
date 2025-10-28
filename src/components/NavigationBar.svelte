<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import debounce from "lodash/debounce";
import { untrack } from "svelte";
import { getEmailConsent, setEmailConsent } from "../models/EmailConsent";
// biome-ignore lint/correctness/noUnusedImports: used on button click
import { disconnect } from "../services/auth";
import notyf from "../services/notyf";

const { setPanel }: { setPanel: (panel: string) => void } = $props<{
	setPanel: (panel: string) => void;
}>();

let menu_opened: boolean = $state(true);
let last_opened_menu: string = $state("characters");
// biome-ignore lint/style/useConst: used in svelte file
let consent_email: string[] = $state([]);

$effect(() => {
	untrack(async () => {
		consent_email = await getEmailConsent();
	});
});

const saveConsentOnChange = debounce(
	() => {
		return setEmailConsent(consent_email)
			.then(() => {
				notyf.success("Vos choix ont été enregistrées.");
			})
			.catch((err) => faro.api.pushError(err));
	},
	2500,
	{ trailing: true },
);

function openOrClose() {
	menu_opened = !menu_opened;
	setPanel(menu_opened ? last_opened_menu : "close");
}

function openTab(name: string) {
	last_opened_menu = name;
	menu_opened = true;
	setPanel(name);
}

// init
setPanel(menu_opened ? last_opened_menu : "close");
</script>

<nav class="w-full bg-brown-900 text-sand-100 flex flex-row justify-around">
    <button class="p-1" aria-label="Afficher / Cacher le menu" onclick={openOrClose}>
        {#if menu_opened}
            <i class="fa fa-chevron-up fa-lg"></i>
        {:else}
            <i class="fa fa-chevron-down fa-lg"></i>
        {/if}
    </button>
    <button class="p-1" aria-label="Accès à la librairie de personnages" onclick={() => {openTab("characters")}}>
        <i class="fa fa-users fa-lg"></i>
    </button>
    <button class="p-1" aria-label="Accès au succès / achievements" onclick={() => {openTab("achievements")}}>
        <i class="fa fa-trophy fa-lg"></i>
    </button>
    <button class="p-1" aria-label="Accès aux parties précédantes" onclick={() => {openTab("saves")}}>
        <i class="fa fa-floppy-disk fa-lg"></i>
    </button>
    <button class="p-1" aria-label="Options" onclick={() => {openTab("options")}}>
        <i class="fa fa-gears fa-lg"></i>
    </button>
</nav>

{#if menu_opened && last_opened_menu === "options"}
    <div
        class="w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center p-4 md:p-8"
    >
        <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
            Options et paramètres
        </div>
        <div class="mb-2 w-full max-w-lg">
            <input
                id="consent_email_newsletter"
                type="checkbox"
                class="p-2 bg-gray-100"
				value="newsletter"
                bind:group={consent_email}
                onchange={saveConsentOnChange}
            />
            <label
                for="consent_email_newsletter"
                class="text-gray-800"
                >Je souhaite recevoir des emails concernant la sortie du jeu<br/>
                <span class="text-sm text-gray-700">(entre 2 et 4 mails par an) [optionnel]</span></label
            >
        </div>
        <div class="mb-4 max-w-lg">
            <input
                id="consent_email_beta_contact"
                type="checkbox"
                class="p-2 bg-gray-100"
				value="beta_contact"
                bind:group={consent_email}
                onchange={saveConsentOnChange}
            />
            <label
                for="consent_email_beta_contact"
                class="text-gray-800"
                >J'accepte d'être contacté par email afin de donner mon avis sur la bêta du jeu<br/>
                <span class="text-sm text-gray-700">(un email dans les prochaines semaines) [optionnel]</span></label
            >
        </div>
        <div class="mb-4 max-w-lg">
            Besoin d'aide ou envie de discuter ? Vous pouvez contacter @kenshiata sur <a href="https://t.me/kenshiata" target="_blank" class="underline">telegram</a> ou sur <a href="https://discordapp.com/users/274576041199140865" target="_blank" class="underline">discord</a>. Vous pouvez égallement envoyé un mail à l'adresse <a href="mailto:contact@kenshiata.studio" class="underline">contact@kenshiata.studio</a>.
        </div>
        <button class="bg-red-700/60 hover:bg-red-700/80 text-white px-4 py-2 rounded-lg" onclick={disconnect}>
            Se déconnecter
            <i class="fa fa-right-from-bracket fa-lg"></i>
        </button>
    </div>
{/if}
