import type SocketAPI from "./websockets.ts";
import type { NetworkUser } from "./networkSync";

export default class WebRTCAPI {
	private peerConn: RTCPeerConnection;
	private dataChannel: RTCDataChannel | undefined = undefined;
	private listeners: ((data: any) => void)[] = [];
	private onIceCandidate: (candidate: RTCIceCandidate) => void;
	private iceCandidates: RTCIceCandidate[] | false;
	private ready = false;

	constructor(
		isHost: boolean,
		onIceCandidate: (candidate: RTCIceCandidate) => void,
	) {
		this.peerConn = new RTCPeerConnection();
		this.onIceCandidate = onIceCandidate;
		this.iceCandidates = [];

		this.peerConn.onicecandidate = (event) => {
			if (event.candidate) {
				console.log("New ICE candidate:", event.candidate);
				this.onIceCandidate(event.candidate);
			}
		};

		if (isHost) {
			this.registerDataChannel(this.peerConn.createDataChannel("sendChannel"));
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

	public async createOffer(): Promise<RTCSessionDescription> {
		const offer = await this.peerConn.createOffer();
		await this.peerConn.setLocalDescription(offer);
		return this.peerConn.localDescription as RTCSessionDescription;
	}

	public async createAnswer(): Promise<RTCSessionDescription> {
		const answer = await this.peerConn.createAnswer();
		await this.peerConn.setLocalDescription(answer);
		return this.peerConn.localDescription as RTCSessionDescription;
	}

	public async saveRemoteDescription(data: RTCSessionDescription) {
		const description = new RTCSessionDescription(data);
		await this.peerConn.setRemoteDescription(description);
	}

	public async addIceCandidate(candidate: RTCIceCandidate) {
		if (this.iceCandidates === false) {
			await this.peerConn.addIceCandidate(new RTCIceCandidate(candidate))
		} else {
			this.iceCandidates.push(candidate);
		}
	}

	public async flushIceCandidates() {
		if (this.iceCandidates === false) return;
		const condidates = this.iceCandidates;
		this.iceCandidates = false;
		for (const candidate of condidates) {
			await this.peerConn.addIceCandidate(new RTCIceCandidate(candidate));
		}
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
