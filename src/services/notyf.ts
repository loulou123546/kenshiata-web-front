import {
	type INotyfNotificationOptions,
	Notyf,
	type NotyfNotification,
} from "notyf";

export type ExtendedNotyf = Notyf & {
	warning: (
		payload: string | Partial<INotyfNotificationOptions>,
	) => NotyfNotification;
	info: (
		payload: string | Partial<INotyfNotificationOptions>,
	) => NotyfNotification;
};

const notyf = new Notyf({
	types: [
		{
			type: "success",
			background: "hsl(94 45% 40%)",
			message: "Succès",
			duration: 2000,
			icon: {
				className: "fa fa-circle-check",
				tagName: "i",
				color: "white",
			},
		},
		{
			type: "error",
			background: "hsl(15 100% 40%)",
			message: "Erreur",
			duration: 5000,
			dismissible: true,
			icon: {
				className: "fa fa-circle-xmark",
				tagName: "i",
				color: "white",
			},
		},
		{
			type: "warning",
			background: "hsl(35 90% 50%)",
			message: "Attention",
			duration: 5000,
			dismissible: true,
			icon: {
				className: "fa fa-triangle-exclamation",
				tagName: "i",
				color: "white",
			},
		},
		{
			type: "info",
			background: "hsl(205 40% 40%)",
			duration: 3000,
			icon: {
				className: "fa fa-circle-info",
				tagName: "i",
				color: "white",
			},
		},
	],
});

const extended: ExtendedNotyf = notyf as ExtendedNotyf;
extended.warning = (
	payload: string | Partial<INotyfNotificationOptions>,
): NotyfNotification => {
	if (typeof payload === "string") {
		return notyf.open({ type: "warning", message: payload });
	}
	return notyf.open({ type: "warning", ...payload });
};
extended.info = (
	payload: string | Partial<INotyfNotificationOptions>,
): NotyfNotification => {
	if (typeof payload === "string") {
		return notyf.open({ type: "info", message: payload });
	}
	return notyf.open({ type: "info", ...payload });
};

export default extended;
