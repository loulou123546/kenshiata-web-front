<script lang="ts">
import CharacterLibrary from "../../components/Characters/MyLibrary.svelte";
import GameSessionPage from "../../components/GameSession/index.svelte";
import LoginWall from "../../components/LoginWall.svelte";
import MatchMaking from "../../components/MatchMaking.svelte";
import type { GameSession } from "../../models/GameSession.ts";

let okLogin: boolean = $state(false);
let gameSession: GameSession | undefined = $state(undefined);

function onJoinSession(session: GameSession) {
	gameSession = session;
}

function loginDone() {
	okLogin = true;
}
</script>

<main class="p-8">
    {#if !okLogin}
        <LoginWall whenLoginOK={loginDone} />
    {:else}
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
