<script lang="ts">
	const surname: string = $state(localStorage.getItem("surname") || "");
	let others: { username: string; offer: string }[] = $state([]);
	let answer: { target: string; data: string } | undefined =
		$state(undefined);

	const localConnection = new RTCPeerConnection();
	let dataChannel: RTCDataChannel | undefined = undefined;
	localConnection.ondatachannel = (event) => {
		const receiveChannel = event.channel;
		receiveChannel.onopen = () => {
			console.log("A Joined Data channel is open");
		};
		receiveChannel.onclose = () => {
			console.log("A joined Data channel is closed");
		};
		receiveChannel.onmessage = (event) => {
			console.log("Received message on joined channel:", event.data);
		};
	};

	localConnection.onicecandidate = (event) => {
		if (event.candidate) {
			console.log("New ICE candidate:", event.candidate);
			localConnection.addIceCandidate(event.candidate).catch((error) => {
				console.error("Error adding ICE candidate:", error);
			});
		}
	};

	async function refreshOffers() {
		try {
			const response = await fetch(
				import.meta.env.PUBLIC_API_DOMAIN + "/webrtc/offers",
				{
					method: "GET",
					mode: "cors",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			if (!response.ok) {
				console.error(
					"Failed to fetch offers:",
					response.status,
					response.statusText,
				);
				others = [];
				return;
			}
			const data = await response.json();
			others = data
				.map((off) => ({
					username: off.username,
					offer: off.data,
				}))
				.filter((off) => off.username !== surname);
		} catch (error) {
			console.error("Error fetching offers:", error);
		}
	}

	setInterval(refreshOffers, 5000);
	refreshOffers();

	async function refreshAnswers() {
		if (!surname) {
			console.warn("Surname is not set, skipping answer refresh.");
			return;
		}
		try {
			const response = await fetch(
				import.meta.env.PUBLIC_API_DOMAIN + "/webrtc/answer/" + surname,
				{
					method: "GET",
					mode: "cors",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			if (!response.ok) {
				return;
			}
			const data = await response.json();
			if (
				answer &&
				answer.target === data.target &&
				answer.data === data.data
			) {
				return;
			}
			if (data.username === surname) {
				answer = {
					target: data.target,
					data: data.data,
				};
				const accept = confirm(
					`Accepter de jouer avec ${data.target} ?`,
				);
				if (!accept) {
					return;
				}
				const remoteAnswer = JSON.parse(data.data);
				localConnection
					.setRemoteDescription(
						new RTCSessionDescription(remoteAnswer),
					)
					.then(() => {
						console.log("Remote description set:", remoteAnswer);
					})
					.catch((error) => {
						console.error(
							"Error setting remote description:",
							error,
						);
					});
			}
		} catch (error) {
			console.error("Error fetching answers:", error);
		}
	}
	setInterval(refreshAnswers, 5000);

	function connect() {
		if (!surname) {
			alert("Please enter a surname.");
			return;
		}
		localStorage.setItem("surname", surname);
		dataChannel = localConnection.createDataChannel("sendChannel");
		dataChannel.onopen = () => {
			console.log("Data channel is open");
		};
		dataChannel.onclose = () => {
			console.log("Data channel is closed");
		};
		localConnection
			.createOffer()
			.then((offer) => {
				return localConnection.setLocalDescription(offer);
			})
			.then(() => {
				console.log(
					"Local description set:",
					localConnection.localDescription,
				);
				fetch(import.meta.env.PUBLIC_API_DOMAIN + "/webrtc/offer", {
					method: "POST",
					mode: "cors",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username: surname,
						data: JSON.stringify(localConnection.localDescription),
					}),
				});
				// Here you would typically send the offer to the remote peer
				// For example, using a signaling server or WebSocket
			})
			.catch((error) => {
				console.error("Error creating offer:", error);
			});
	}

	function join(other: { username: string; offer: string }) {
		if (!surname) {
			alert("Please enter a surname.");
			return;
		}
		localStorage.setItem("surname", surname);
		const remoteOffer = JSON.parse(other.offer);
		localConnection
			.setRemoteDescription(new RTCSessionDescription(remoteOffer))
			.then(() => {
				console.log("Remote description set:", remoteOffer);
				return localConnection.createAnswer();
			})
			.then((answer) => {
				return localConnection.setLocalDescription(answer);
			})
			.then(() => {
				console.log(
					"Local description set after joining:",
					localConnection.localDescription,
				);
				fetch(import.meta.env.PUBLIC_API_DOMAIN + "/webrtc/answer", {
					method: "POST",
					mode: "cors",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username: surname,
						data: JSON.stringify(localConnection.localDescription),
						target: other.username,
					}),
				});
			})
			.catch((error) => {
				console.error("Error joining offer:", error);
			});
	}
</script>

<div>
	<input type="text" placeholder="Surnom" bind:value={surname} />
	<button onclick={connect}>Connect !</button>
</div>

<div>
	{#if others.length > 0}
		<h2>Autres joueurs disponibles</h2>
		<ul>
			{#each others as other}
				<li>
					<button onclick={() => join(other)}>{other.username}</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<h3>Aucun autre joueurs disponibles.</h3>
	{/if}
</div>
