<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { persistentAtom } from "@nanostores/persistent";
import LoginForm from "./loginForm.svelte";
import SignupForm from "./signupForm.svelte";

const mode = persistentAtom<"login" | "signup">("login-mode", "login");

function switchMode() {
	$mode = $mode === "login" ? "signup" : "login";
}
</script>

<section class="bg-gray-300 p-6 rounded-lg shadow-md w-full max-w-[512px]">
    {#if $mode === "login"}
        <h2 class="text-2xl font-semibold mb-4 text-center">Connexion à votre compte</h2>
        <button class="text-blue-600 hover:text-blue-900 w-full mb-4" onclick={switchMode}>Je n'ai pas de compte : M'inscrire</button>
        <LoginForm />
    {:else}
        <h2 class="text-2xl font-semibold mb-4 text-center">Créer votre compte</h2>
        <button class="text-blue-600 hover:text-blue-900 w-full mb-4" onclick={switchMode}>J'ai déjà un compte : Me connecter</button>
        <SignupForm />
    {/if}
</section>
