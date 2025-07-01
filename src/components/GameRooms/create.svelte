<script lang="ts">
import type SocketAPI from "../../services/socketAPI";

const { socket } = $props<{
	socket: SocketAPI;
}>();

let roomName: string = $state("");
let roomType: "private" | "public" = $state("private");

function createGame() {
	if (roomName.trim().length < 3 || roomName.trim().length > 256) {
		alert("Le nom de la partie doit contenir entre 3 et 256 caractères.");
		return;
	}

	socket.send("create-game-room", {
		name: roomName.trim(),
		is_public: roomType === "public",
	});
	roomName = "";
	roomType = "private";
}
</script>

<div class="bg-gray-500 p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold mb-4">Créer une nouvelle partie</h2>
    <p class="mb-4">Choisissez un nom pour votre partie et créez-la.</p>

    <div class="mb-4">
        <label
            for="roomName"
            class="block text-sm font-medium text-gray-300 mb-2"
            >Nom de la partie</label
        >
        <input
            id="roomName"
            type="text"
            class="w-full p-2 border border-gray-300 rounded-lg bg-gray-200 text-black"
            placeholder="Entrez le nom de la partie"
            bind:value={roomName}
            required
            minlength="3"
            maxlength="256"
        />
    </div>
    <div class="mb-4">
        <!-- public or private -->
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
    </div>
    <button
        class="px-4 py-2 rounded-lg bg-blue-600 text-white w-full text-center hover:bg-blue-700"
        onclick={createGame}
    >
        Créer une partie
    </button>
</div>
