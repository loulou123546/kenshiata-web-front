<script lang="ts">
import { persistentAtom } from "@nanostores/persistent";
import ForgotPassword from "./forgotPassword.svelte";
import LoginForm from "./loginForm.svelte";
import SignupForm from "./signupForm.svelte";

const mode = persistentAtom<"login" | "signup" | "forgot-password">(
	"login-mode",
	"login",
);

function setMode(new_mode: "login" | "signup" | "forgot-password") {
	$mode = new_mode;
}
</script>

<main class="w-full h-full flex items-center justify-center p-2 xs:p-8">
    <section class="bg-sand-300/80 p-3 xs:p-6 rounded-lg w-full max-w-[512px] shadow-md lg:shadow-lg">
        {#if $mode === "login"}
            <h2 class="text-2xl font-semibold text-center">Connexion à votre compte</h2>
            <div class="w-full text-center pt-4 pb-8">
                <button class="bg-cactus-800/80 hover:bg-cactus-900 text-white px-4 py-2 rounded-lg" onclick={() => {setMode("signup")}}>Pas de compte ? Inscription</button>
            </div>
            
            <LoginForm />
            <button class="mt-4 text-center w-full text-night-800 hover:underline" onclick={() => {setMode("forgot-password")}}>Mot de passe oublié ?</button>
        {:else if $mode === "forgot-password"}
            <h2 class="text-2xl font-semibold text-center">Mot de passe oublié</h2>
            <div class="w-full text-center pt-4 pb-8">
                <button class="bg-cactus-800/80 hover:bg-cactus-900 text-white px-4 py-2 rounded-lg" onclick={() => {setMode("signup")}}>Pas de compte ? Inscription</button>
            </div>
            
            <ForgotPassword />
        {:else}
            <h2 class="text-2xl font-semibold text-center">Créer votre compte</h2>
            <div class="w-full text-center pt-4 pb-8">
                <button class="bg-cactus-800/80 hover:bg-cactus-900 text-white px-4 py-2 rounded-lg" onclick={() => {setMode("login")}}>Déjà un compte ? Connexion</button>
            </div>
            <SignupForm />
        {/if}
    </section>
</main>
