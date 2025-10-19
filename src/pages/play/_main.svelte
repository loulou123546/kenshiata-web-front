<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import CharacterLibrary from "../../components/Characters/MyLibrary.svelte";
import GameSessionPage from "../../components/GameSession/index.svelte";
import LoginSignup from "../../components/Login-Signup/index.svelte";
import MatchMaking from "../../components/MatchMaking.svelte";
import type { GameSession } from "../../models/GameSession.ts";
import { currentUser, gameStatus } from "../../services/auth.ts";

let okLogin: boolean = $state(false);
let gameSession: GameSession | undefined = $state(undefined);

faro.api.setView({
	name: "auth",
});

currentUser.subscribe((value) => {
	okLogin = Boolean(value.id && value.username);
});

function onJoinSession(session: GameSession) {
	gameStatus.set("game");
	gameSession = session;
}
</script>

<main class="bg-sand-200 min-h-full">
    {#if !okLogin}
        <LoginSignup />
    {:else}
        <CharacterLibrary />
        <section class="p-2 xs:p-8">
            {#if gameSession}
                <!-- <h1>
                    Game {gameSession.name} running with {gameSession.players
                        .map((p) => p.username)
                        .join(", ")} !
                </h1> -->
                <GameSessionPage {gameSession} />
            {:else}
                <MatchMaking {onJoinSession} />
            {/if}
        </section>
    {/if}
</main>
