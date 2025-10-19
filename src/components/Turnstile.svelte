<script lang="ts">
import notyf from "../services/notyf";

const { action, onSuccess, onError } = $props<{
	action: string;
	onSuccess: (token: string) => void;
	onError: (error: Error) => void;
}>();

const TURNSTILE_CLIENT_ID = import.meta.env.PUBLIC_TURNSTILE_SITE;

function transformCallback(event: CustomEvent) {
	if (typeof event.detail?.token === "string") onSuccess(event.detail?.token);
	else {
		onError(new Error("Got a successfull callback but without token"));
		notyf.error(
			"Problème lors du contrôle anti-robot, veuillez recharger la page",
		);
	}
}
function transformError(event: CustomEvent | Event) {
	// @ts-expect-error detail don't exist on Event
	onError(event?.detail?.error ?? new Error("Internal error"));
	notyf.error(
		"Problème lors du contrôle anti-robot, veuillez recharger la page",
	);
}

let loaded: boolean = $state(false);

function setLoaded() {
	loaded = true;
}
</script>
<div>
    <div data-action={action} data-site={TURNSTILE_CLIENT_ID} oncustomcallback={transformCallback} onerror={transformError} class="text-center" id="turnstile-container"></div>
    <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onload={setLoaded}
        async defer
    ></script>
    {#if loaded}
        <script>
            (() => {
                const turnstile_container = document.querySelector("#turnstile-container")
                const widgetId = turnstile.render("#turnstile-container", {
                    sitekey: turnstile_container.dataset.site,
                    size: "flexible",
                    theme: "light",
                    action: turnstile_container.dataset.action,
                    callback: function (token) {
                        turnstile_container.dispatchEvent(new CustomEvent('customcallback', {detail: {token}}))
                    },
                    "error-callback": function (error) {
                        turnstile_container.dispatchEvent(new CustomEvent('error', {detail: {error}}))
                    }
                });
            })()
        </script>
    {/if}
</div>