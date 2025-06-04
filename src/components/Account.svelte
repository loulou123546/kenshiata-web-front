<script lang="ts">
const surname: string = $state(localStorage.getItem("surname") || "");
const others: { username: string; offers: string }[] = $state([]);

const localConnection = new RTCPeerConnection();
const sendChannel = localConnection.createDataChannel("sendChannel");
sendChannel.onopen = () => {
	console.log("Data channel is open");
};
sendChannel.onclose = () => {
	console.log("Data channel is closed");
};
localConnection.ondatachannel = (event) => {
	const receiveChannel = event.channel;
	receiveChannel.onmessage = (event) => {
		console.log("Received message:", event.data);
	};
};

localConnection.onicecandidate = (event) => {
	if (event.candidate) {
		console.log("New ICE candidate:", event.candidate);
	}
};

function connect() {
	if (!surname) {
		alert("Please enter a surname.");
		return;
	}
	localStorage.setItem("surname", surname);
	localConnection
		.createOffer()
		.then((offer) => {
			return localConnection.setLocalDescription(offer);
		})
		.then(() => {
			console.log("Local description set:", localConnection.localDescription);
			fetch("http://localhost:4200/webrtc/offer", {
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
</script>

<div>
    <input type="text" placeholder="Surnom" bind:value={surname} />
    <button onclick={connect}>Connect !</button>
</div>
