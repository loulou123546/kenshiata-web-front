import type { Player } from "./players";
import type SocketAPI from "./websockets.ts";

export default class WebRTCAPI {
	private peerConn: RTCPeerConnection;
	private dataChannel: RTCDataChannel | undefined = undefined;
	private listeners: ((data: any) => void)[] = [];
	private from: Player;
	private target: Player;
	private socket: SocketAPI;
	private ready = false;

	constructor(
		isHost: boolean,
		socket: SocketAPI,
		from: Player,
		target: Player,
	) {
		this.socket = socket;
		this.from = from;
		this.target = target;
		this.peerConn = new RTCPeerConnection();

		this.peerConn.onicecandidate = (event) => {
			if (event.candidate) {
				console.log("New ICE candidate:", event.candidate);
				this.socket.sendData("webrtc-send-ice-candidate", {
					candidate: event.candidate,
					from: this.from,
					target: this.target,
				});
			}
		};
		this.socket.addListener("webrtc-send-ice-candidate", (data: any) => {
			console.log("Received ICE candidate from socket:", data);
			this.peerConn
				.addIceCandidate(new RTCIceCandidate(data.candidate))
				.then(() => {
					console.log("ICE candidate added successfully");
				})
				.catch((error) => {
					console.error("Error adding ICE candidate:", error);
				});
		});
		this.socket.addListener("webrtc-send-description", (data: any) => {
			console.log("Received description from socket:", data);
			const description = new RTCSessionDescription(data.description);
			this.peerConn
				.setRemoteDescription(description)
				.then(() => {
					console.log("Remote description set successfully");
				})
				.catch((error) => {
					console.error("Error setting remote description:", error);
				});
			if (!isHost) {
				this.createAnswer();
			}
		});

		if (isHost) {
			this.registerDataChannel(this.peerConn.createDataChannel("sendChannel"));
			this.createOffer();
		} else {
			this.peerConn.ondatachannel = (event) => {
				this.registerDataChannel(event.channel);
			};
		}
	}

	private registerDataChannel(channel: RTCDataChannel) {
		this.dataChannel = channel;
		channel.onopen = () => {
			console.log("Data channel is open");
			this.ready = true;
			this.sendMessage(JSON.stringify({ action: "ping" }));
		};
		channel.onclose = () => {
			this.ready = false;
			console.log("Data channel is closed");
		};
		channel.onmessage = (event) => {
			console.log("Received message:", event.data);
			try {
				this.listeners.forEach((callback) => {
					callback(event.data);
				});
			} catch {
				console.error("Error processing received message:", event.data);
			}
		};
	}

	private createOffer() {
		this.peerConn
			.createOffer()
			.then((offer) => {
				return this.peerConn.setLocalDescription(offer);
			})
			.then(() => {
				console.log("Local description set:", this.peerConn.localDescription);
				this.socket.sendData("webrtc-send-description", {
					description: this.peerConn.localDescription,
					from: this.from,
					target: this.target,
				});
			})
			.catch((error) => {
				console.error("Error creating offer:", error);
			});
	}

	private createAnswer() {
		this.peerConn
			.createAnswer()
			.then((answer) => {
				return this.peerConn.setLocalDescription(answer);
			})
			.then(() => {
				console.log(
					"Local description set after answer:",
					this.peerConn.localDescription,
				);
				this.socket.sendData("webrtc-send-description", {
					description: this.peerConn.localDescription,
					from: this.from,
					target: this.target,
				});
			})
			.catch((error) => {
				console.error("Error creating answer:", error);
			});
	}

	public sendMessage(message: string) {
		if (!this.dataChannel || !this.ready)
			throw new Error("Data channel is not ready");
		this.dataChannel.send(message);
	}

	public onMessage(callback: (message: string) => void) {
		this.listeners.push(callback);
	}
}
