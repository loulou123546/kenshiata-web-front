<script lang="ts">
import { persistentAtom } from "@nanostores/persistent";
import LoginForm from "./loginForm.svelte";
import SignupForm from "./signupForm.svelte";

const mode = persistentAtom<"login" | "signup">("login-mode", "login");

function switchMode() {
	$mode = $mode === "login" ? "signup" : "login";
}
</script>

<main class="w-full h-full flex items-center justify-center md:p-8">
    <section class="bg-sand-300/80 p-3 xs:p-6 rounded-lg w-full max-w-[512px] shadow-md lg:shadow-lg">
        {#if $mode === "login"}
            <h2 class="text-2xl font-semibold text-center">Connexion à votre compte</h2>
            <div class="w-full text-center pt-4 pb-8">
                <button class="bg-cactus-800/80 hover:bg-cactus-900 text-white px-4 py-2 rounded-lg" onclick={switchMode}>Pas de compte ? Inscription</button>
            </div>
            
            <LoginForm />
        {:else}
            <h2 class="text-2xl font-semibold text-center">Créer votre compte</h2>
            <div class="w-full text-center pt-4 pb-8">
                <button class="bg-cactus-800/80 hover:bg-cactus-900 text-white px-4 py-2 rounded-lg" onclick={switchMode}>Déjà un compte ? Connexion</button>
            </div>
            <SignupForm />
        {/if}
    </section>
</main>
