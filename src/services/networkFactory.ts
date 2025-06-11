
import WebRTCAPI from "../services/webrtc";
import { User } from "../models/user.ts";
import { NetworkUser } from "../models/networkUsers.ts";
import SocketAPI from "./socketAPI.ts";

export type FactoryOptions = {
    isHost?: boolean;
    socket: SocketAPI;
    me: User;
    target: NetworkUser;
    onApproval: () => void;
    onRefusal: () => void;
    onConnection: (webrtc: WebRTCAPI) => void;
    onError: (error: Error) => void;
    onTimeout: () => void;
    onStepChange: (step: string) => void;
    logger: (...data: any[]) => void;
}

export class NetworkFactory {
    private isHost: boolean;
    private socket: SocketAPI;
    private me: NetworkUser;
    private target: NetworkUser;
    private webrtc: WebRTCAPI | undefined = undefined;
    private onApproval: () => void;
    private onRefusal: () => void;
    private onConnection: (webrtc: WebRTCAPI) => void;
    private onError: (error: Error) => void;
    private onTimeout: () => void;
    private onStepChange: (step: string) => void;
    private logger: (...data: any[]) => void;

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

        this.webrtc = new WebRTCAPI(this.isHost, (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)});

        this.socket.addListener("webrtc-send-description", (data: any) => {
            const { from, target, description } = data;
            this.webrtc.saveRemoteDescription(description).then(() => {
                this.onStepChange("exchanging-webrtc-ice");
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
                this.webrtc = new WebRTCAPI(this.isHost, (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)});
            }
            this.webrtc.saveRemoteDescription(description).then(() => {
                this.webrtc.createAnswer().then((answer) => {
                    this.onStepChange("exchanging-webrtc-ice");
                    this.socket.send("webrtc-send-description", {
                        from: this.me,
                        target: from,
                        description: answer,
                    });
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
                this.webrtc = new WebRTCAPI(this.isHost, (candidate: RTCIceCandidate) => {this.shareIceCandidate(candidate)});
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
}
