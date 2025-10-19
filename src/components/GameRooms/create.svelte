<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import notyf from "../../services/notyf";
import type SocketAPI from "../../services/socketAPI";

const { socket } = $props<{
	socket: SocketAPI;
}>();

let roomName: string = $state("");
let roomType: "private" | "public" = $state("public");

function createGame() {
	if (roomName.trim().length < 3 || roomName.trim().length > 256) {
		notyf.error("Le nom de la partie doit contenir entre 3 et 256 caractères.");
		return;
	}

	socket.send("create-game-room", {
		name: roomName.trim(),
		is_public: roomType === "public",
	});
	roomName = "";
	roomType = "public";
	notyf.success("Création de la partie");
}
</script>

<div class="bg-sand-200/30 p-3 md:p-6 rounded-lg shadow-md">
    <h2 class="text-lg md:text-2xl font-semibold mb-4">Créer une nouvelle partie</h2>
    <p class="mb-4 text-sand-100">Choisissez un nom pour votre partie et créez-la.</p>

    <div class="mb-4">
        <label
            for="roomName"
            class="block text-sm font-medium text-sand-100 mb-2"
            >Nom de la partie</label
        >
        <input
            id="roomName"
            type="text"
            class="w-full p-2 rounded-lg bg-gray-100/70 text-black"
            placeholder="Entrez le nom de la partie"
            bind:value={roomName}
            required
            minlength="3"
            maxlength="256"
        />
    </div>
    <!-- <div class="mb-4">
        <label
            class="block text-sm font-medium text-gray-300 mb-2"
            for="roomType"
        >
            Type de partie
        </label>
        <select
            id="roomType"
            name="roomType"
            class="w-full p-2 border border-gray-300 rounded-lg bg-gray-200 text-black"
            bind:value={roomType}
            required
        >
            <option value="public">Publique</option>
            <option value="private" selected>Privée</option>
        </select>
    </div> -->
    <button
        class="px-4 py-2 rounded-lg bg-night-700 text-white w-full text-center hover:bg-night-800"
        onclick={createGame}
    >
        Créer une partie
    </button>
</div>
