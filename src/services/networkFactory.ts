
import WebRTCAPI from "../services/webrtc";
import { User } from "../models/user.ts";
import { NetworkUser } from "../models/networkUsers.ts";
import SocketAPI from "./socketAPI.ts";
import { GameNetwork } from "../models/GameNetwork.ts"; 

export type FactoryOptions = {
    isHost?: boolean;
    socket: SocketAPI;
    me: User;
    target: NetworkUser;
    onApproval: () => void;
    onRefusal: () => void;
    onConnection: (gameNet: GameNetwork) => void;
    onError: (error: Error) => void;
    onTimeout: () => void;
    onStepChange: (step: string) => void;
    logger: (...data: any[]) => void;
}

export function createGameNetwork(options: FactoryOptions): GameNetwork {
    const factory = new NetworkFactory(options);
    return factory.gameNetwork;
}

export class NetworkFactory {
    private isHost: boolean;
    private socket: SocketAPI;
    private me: NetworkUser;
    private target: NetworkUser;
    private webrtc: WebRTCAPI | undefined = undefined;
    private onApproval: () => void;
    private onRefusal: () => void;
    private onConnection: (gameNet: GameNetwork) => void;
    private onError: (error: Error) => void;
    private onTimeout: () => void;
    private onStepChange: (step: string) => void;
    private logger: (...data: any[]) => void;
    public gameNetwork: GameNetwork;

    constructor({
        isHost,
        socket,
        me,
        target,
        onApproval,
        onRefusal,
        onConnection,
        onError,
        onTimeout,
        onStepChange,
        logger = console.log,
    }: FactoryOptions) {
        if (!socket.ready) throw new Error("Socket is not ready");
        if (!socket.socketID) throw new Error("Socket is not authenticated");
        this.isHost = isHost || false;
        this.socket = socket;
        this.me = {
            socketId: socket.socketID,
            user: me,
        };
        this.target = target;
        this.onApproval = onApproval;
        this.onRefusal = onRefusal;
        this.onConnection = onConnection;
        this.onError = onError;
        this.onTimeout = onTimeout;
        this.onStepChange = onStepChange;
        this.logger = logger;
        this.gameNetwork = new GameNetwork();

        if (isHost) {
            this.listenForResponse();
            this.listenForIceCandidates();
            this.sendPlayRequest();
        } else {
            this.prepareWebRTCAsClient();
            this.listenForIceCandidates();
            this.sendPlayResponse();
        }
    }

    private listenForResponse() {
        this.socket.addListener("play-together-response", (data: any) => {
            this.logger("play-together-response", data);
            const { from, target, accept } = data;
            if (accept) {
                this.onApproval();
                this.startWebRTCAsHost();
            } else {
                this.onRefusal();
            }
        });
    }

    private sendPlayRequest() {
        this.onStepChange("game-request-sent");
        this.socket.send("play-together-request", {
            from: this.me,
            target: this.target,
        })
    }

    private sendPlayResponse() {
        // this.onStepChange("game-response-sent");
        this.socket.send("play-together-response", {
            from: this.me,
            target: this.target,
            accept: true,
        })
    }

    private startWebRTCAsHost() {
        this.onStepChange("sending-webrtc-descriptor");

        this.webrtc = new WebRTCAPI(
            this.isHost,
            (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)},
            (channel: RTCDataChannel) => {this.registerDataChannel(channel)}
        );

        this.socket.addListener("webrtc-send-description", (data: any) => {
            const { from, target, description } = data;
            // @ts-ignore
            this.webrtc.saveRemoteDescription(description).then(() => {
                this.onStepChange("exchanging-webrtc-ice");
                // @ts-ignore
                this.webrtc.flushIceCandidates();
            }).catch(this.onError);
        });

        this.webrtc.createOffer().then((offer) => {
            this.socket.send("webrtc-send-description", {
                from: this.me,
                target: this.target,
                description: offer,
            });
        }).catch(this.onError);
    }

    private prepareWebRTCAsClient() {
        this.onStepChange("waiting-for-webrtc-descriptor");

        this.socket.addListener("webrtc-send-description", (data: any) => {
            const { from, target, description } = data;
            if (!this.webrtc) {
                this.webrtc = new WebRTCAPI(
                    this.isHost,
                    (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)},
                    (channel: RTCDataChannel) => {this.registerDataChannel(channel)}
                );
            }
            this.webrtc.saveRemoteDescription(description).then(() => {
                // @ts-ignore
                this.webrtc.createAnswer().then((answer) => {
                    this.onStepChange("exchanging-webrtc-ice");
                    this.socket.send("webrtc-send-description", {
                        from: this.me,
                        target: from,

                        description: answer,
                    });
                    // @ts-ignore
                    this.webrtc.flushIceCandidates();
                }).catch(this.onError);
            }).catch(this.onError);
        });
    }

    private shareIceCandidate(candidate: RTCIceCandidate) {
        this.socket.send("webrtc-send-ice-candidate", {
            candidate: candidate,
            from: this.me,
            target: this.target,
        });
    }

    private listenForIceCandidates() {
        this.socket.addListener("webrtc-send-ice-candidate", (data: any) => {
			console.log("Received ICE candidate from socket:", data);
            if (!this.webrtc) {
                this.webrtc = new WebRTCAPI(
                    this.isHost,
                    (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)},
                    (channel: RTCDataChannel) => {this.registerDataChannel(channel)}
                );
            }
            this.webrtc?.addIceCandidate(new RTCIceCandidate(data.candidate))
            .then(() => {
                this.logger("Added ICE candidate", data.candidate);
            })
            .catch((error) => {
                this.logger("Error adding ICE candidate:", error);
            });
		});
    }

    private registerDataChannel(channel: RTCDataChannel) {
        channel.onopen = () => {
        	console.log("Data channel is open");
            channel.send(JSON.stringify({ action: "ping" }));
            this.gameNetwork.internal_registerSendfunction((action: string, data: any) => {
                channel.send(JSON.stringify({ ...data, action }));
            })
            this.onConnection(this.gameNetwork);
        };
        channel.onclose = () => {
        	console.log("Data channel is closed");
        };
        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.action) {
                    this.gameNetwork.internal_receivedMessage(data.action, data);
                } else {
                    this.gameNetwork.internal_receivedMessage("default", data);
                }
            } catch {
                this.gameNetwork.internal_receivedMessage("default", event.data);
            }
        };
    }
}
