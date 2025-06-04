<script lang="ts">
    import { Peer } from "https://esm.sh/peerjs@1.5.4?bundle-deps";
    import { Story } from "inkjs";
    // https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api

    let texts: string[] = $state([]);
    let choices: { title: string; index: number }[] = $state([]);

    let story: Story;

    function runStory(selectIndex?: number) {
        if (!story) return;
        if (selectIndex !== undefined) {
            story.ChooseChoiceIndex(selectIndex);
        }

        while (story.canContinue) {
            choices = [];
            const txt = story.Continue();
            if (txt) {
                texts.push(txt);
            }
        }
        if (story.currentChoices.length > 0) {
            choices.push(
                ...story.currentChoices.map((choice, index) => ({
                    title: choice.text,
                    index: index,
                })),
            );
        }
    }

    fetch("/intercept.json")
        .then(function (response) {
            return response.text();
        })
        .then(function (storyContent) {
            story = new Story(storyContent);
            runStory();
        });

    function exportState() {
        localStorage.setItem("storyContent", JSON.stringify(texts.slice(-10)));
        localStorage.setItem("storyState", story.state.toJson());
    }
    function restoreState() {
        texts = [
            "[...]",
            ...JSON.parse(localStorage.getItem("storyContent") || "[]"),
        ];
        choices = [];
        const savedState = localStorage.getItem("storyState");
        if (savedState) {
            story.state.LoadJson(savedState);
            runStory();
        }
    }

    let peerID = $state("");
    const peer = new Peer();
    peer.on("open", function (id: string) {
        console.log("My peer ID is: " + id);
    });
    let conn;
    function connect() {
        console.log("Connecting to peer:", peerID);
        conn = peer.connect(peerID);
        conn.on("open", () => {
            console.time("pingpong");
            conn.send("ping");
            console.log("sent ping!");
        });
        conn.on("data", (data: any) => {
            console.log(data);
            if (data === "ping") {
                conn.send("pong");
            } else if (data === "pong") {
                console.timeEnd("pingpong");
            }
        });
    }

    peer.on("connection", function (conn2) {
        console.log("Received connection from:", conn2.peer);
        conn2.on("data", (data: any) => {
            console.log(data);
            if (data === "ping") {
                conn2.send("pong");
            } else if (data === "pong") {
                console.timeEnd("pingpong");
            }
        });
    });
</script>

<div>
    <button onclick={exportState}> Save state </button>
    <button onclick={restoreState}> Restore state </button>
</div>
<div>
    <input type="text" placeholder="Connect to an ID" bind:value={peerID} />
    <button onclick={connect}>Connect !</button>
</div>
<div class="p-8 bg-gray-300">
    {#each texts as text}
        <p class="mb-2">{text}</p>
    {/each}

    <div class="flex flex-row flex-wrap">
        {#each choices as choice}
            <button
                class="m-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                onclick={() => runStory(choice.index)}
            >
                {choice.title}
            </button>
        {/each}
    </div>
</div>
