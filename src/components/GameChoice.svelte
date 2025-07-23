<script lang="ts">
import type { GameNetwork } from "../models/GameNetwork.ts";
import {
	type User,
	getAvatarSource,
	getPlayer,
	players,
	user,
} from "../models/user.ts";
export type VotesMode =
	| "host-win"
	| "majority-random"
	| "majority-host"
	| "all-must-approve"
	| "random";

const { gameNetwork, choices, voteMode, onValidated, provideResetFunction } =
	$props<{
		gameNetwork: GameNetwork;
		choices: { title: string; index: number }[];
		voteMode: VotesMode;
		onValidated: (choiceIndex: number) => void;
		provideResetFunction: (reset: () => void) => void;
	}>();

let votes: { [key: string]: number } = $state({});

provideResetFunction(() => {
	votes = {};
});

function computeVotes() {
	if (voteMode === "all-must-approve") {
		let approvedIndex: number | undefined = undefined;
		const didAllAggree = players.get().every((player: User) => {
			const vote = votes?.[player.username];
			if (vote === undefined) return false;
			if (approvedIndex === undefined) {
				approvedIndex = vote;
				return true;
			}
			if (approvedIndex === vote) return true;
			return false;
		});
		if (didAllAggree && approvedIndex !== undefined) {
			onValidated(approvedIndex);
		}
	}
}

function voteForChoice(choiceIndex: number) {
	gameNetwork.send("vote-choice", {
		index: choiceIndex,
		player: user.get(),
	});
	votes[user.get().username] = choiceIndex;
	if (voteMode === "host-win") {
		onValidated(choiceIndex); // if we are not the host, it does nothing
	} else {
		computeVotes();
	}
}

gameNetwork.addListener("vote-choice", (data: any) => {
	const { index, player } = data;
	votes[player.username] = index;
	computeVotes();
});
</script>

<div class="flex flex-row flex-wrap">
    {#each choices as choice}
        <button
            class="m-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onclick={() => voteForChoice(choice.index)}
        >
            <div class="flex flex-row items-center justify-center">
                <span class="px-2">{choice.title}</span>
                {#each Object.entries(votes) as [username, vote]}
                    {#if vote === choice.index}
                        <img
                            src={getAvatarSource(getPlayer(username)?.avatar)}
                            alt={username}
                            class="inline-block w-8 h-8 rounded-full -mr-3 last:mr-0"
                        />
                    {/if}
                {/each}
            </div>
        </button>
    {/each}
</div>
