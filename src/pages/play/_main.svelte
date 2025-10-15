<script lang="ts">
import CharacterLibrary from "../../components/Characters/MyLibrary.svelte";
import GameSessionPage from "../../components/GameSession/index.svelte";
import LoginSignup from "../../components/Login-Signup/index.svelte";
import MatchMaking from "../../components/MatchMaking.svelte";
import type { GameSession } from "../../models/GameSession.ts";
import { authWarning, currentUser } from "../../services/auth.ts";

let okLogin: boolean = $state(false);
let gameSession: GameSession | undefined = $state(undefined);

currentUser.subscribe((value) => {
	okLogin = Boolean(value.id && value.username);
});

function onJoinSession(session: GameSession) {
	gameSession = session;
}
</script>

<main class="p-2 xs:p-8 bg-sand-200 min-h-full">
    {#if !okLogin}
        <LoginSignup />
    {:else}
    {#if $authWarning}
        <div class="p-4 rounded-lg m-8 bg-amber-700 text-white">
            Warning : {$authWarning}
        </div>
    {/if}
        <CharacterLibrary />
        {#if gameSession}
            <h1>
                Game {gameSession.name} running with {gameSession.players
                    .map((p) => p.username)
                    .join(", ")} !
            </h1>
            <GameSessionPage {gameSession} />
        {:else}
            <MatchMaking {onJoinSession} />
        {/if}
    {/if}
</main>
