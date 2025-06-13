<script lang="ts">
    import { GameNetwork } from "../models/GameNetwork.ts";

    const { gameNetwork } = $props<{
        gameNetwork: GameNetwork;
    }>();
</script>

<h1>Vous êtes désormais en jeu !</h1>
