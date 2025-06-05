<script lang="ts">
import { myPlayer } from "../services/players";
</script>

<div class="p-4 m-8 rounded-xl bg-gray-200 shadow-lg text-center">
    <h3 class="text-xl">Mon compte</h3>
    <input
        class="p-2 my-2 rounded-lg border border-gray-400 min-w-1/2"
        type="text"
        placeholder="Surnom"
        bind:value={
            () => myPlayer.get().username, (v) => myPlayer.setKey("username", v)
        }
    />
</div>
