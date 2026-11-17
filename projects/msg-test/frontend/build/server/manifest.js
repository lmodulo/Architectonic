const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","logo.svg"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.CYQUkmzh.js",app:"_app/immutable/entry/app.CDh1jFZJ.js",imports:["_app/immutable/entry/start.CYQUkmzh.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/entry/app.CDh1jFZJ.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/CS3GTii4.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-Caj07LBL.js')),
			__memo(() => import('./chunks/1-dFYgaF29.js')),
			__memo(() => import('./chunks/2-0inebR9j.js')),
			__memo(() => import('./chunks/3-DMdCsOGW.js')),
			__memo(() => import('./chunks/4-CEOjYqr1.js')),
			__memo(() => import('./chunks/5-TRf47Enj.js')),
			__memo(() => import('./chunks/6-DoahEGAr.js')),
			__memo(() => import('./chunks/7-Da3aKSH-.js')),
			__memo(() => import('./chunks/8-C38oC3Hq.js')),
			__memo(() => import('./chunks/9-CvoVvaR3.js')),
			__memo(() => import('./chunks/10-DWdAjySL.js')),
			__memo(() => import('./chunks/11-Bi9yRMqg.js')),
			__memo(() => import('./chunks/12-BiB5fll7.js')),
			__memo(() => import('./chunks/13-DYuVEvFg.js')),
			__memo(() => import('./chunks/14-CShqwNqi.js')),
			__memo(() => import('./chunks/15-DCY3Nfok.js')),
			__memo(() => import('./chunks/16-crZZ34IA.js')),
			__memo(() => import('./chunks/17-CI1lwRGb.js')),
			__memo(() => import('./chunks/18-CdQ-9Wfz.js')),
			__memo(() => import('./chunks/19-BTGIoZ_G.js')),
			__memo(() => import('./chunks/20-DK5yj32t.js')),
			__memo(() => import('./chunks/21-CsqqkaVZ.js')),
			__memo(() => import('./chunks/22-BrKEceVw.js')),
			__memo(() => import('./chunks/23-CC83_WEd.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/403",
				pattern: /^\/403\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(public)/accept-invite",
				pattern: /^\/accept-invite\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/api/auth/avatar",
				pattern: /^\/api\/auth\/avatar\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ha7OQmvb.js'))
			},
			{
				id: "/api/auth/profile",
				pattern: /^\/api\/auth\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CFCem8Ay.js'))
			},
			{
				id: "/api/automation/[...path]",
				pattern: /^\/api\/automation(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-GvXHbjyI.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CddRb5uA.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Byq3WNqa.js'))
			},
			{
				id: "/api/events/public",
				pattern: /^\/api\/events\/public\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DOaSfq3y.js'))
			},
			{
				id: "/api/events/[id]",
				pattern: /^\/api\/events\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DNgVMAIV.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CZiGWyPc.js'))
			},
			{
				id: "/api/messages",
				pattern: /^\/api\/messages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BbuHoOYC.js'))
			},
			{
				id: "/api/messages/archived",
				pattern: /^\/api\/messages\/archived\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-GIMTPoo3.js'))
			},
			{
				id: "/api/messages/sent",
				pattern: /^\/api\/messages\/sent\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BTTzFQkA.js'))
			},
			{
				id: "/api/messages/unread-count",
				pattern: /^\/api\/messages\/unread-count\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CsxJ_iCZ.js'))
			},
			{
				id: "/api/messages/[threadId]",
				pattern: /^\/api\/messages\/([^/]+?)\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-25DRGRXd.js'))
			},
			{
				id: "/api/messages/[threadId]/reply",
				pattern: /^\/api\/messages\/([^/]+?)\/reply\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CU_j5ANH.js'))
			},
			{
				id: "/api/messages/[threadId]/state",
				pattern: /^\/api\/messages\/([^/]+?)\/state\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-W4VAsSE1.js'))
			},
			{
				id: "/api/notifications/[...path]",
				pattern: /^\/api\/notifications(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-oOtIKc4w.js'))
			},
			{
				id: "/api/search",
				pattern: /^\/api\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dj_boOPF.js'))
			},
			{
				id: "/api/settings",
				pattern: /^\/api\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CiYW5WoV.js'))
			},
			{
				id: "/api/settings/logo",
				pattern: /^\/api\/settings\/logo\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DYpbbojL.js'))
			},
			{
				id: "/api/settings/[key]",
				pattern: /^\/api\/settings\/([^/]+?)\/?$/,
				params: [{"name":"key","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DyZ8aQVw.js'))
			},
			{
				id: "/api/teams",
				pattern: /^\/api\/teams\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-hNzNTucX.js'))
			},
			{
				id: "/api/teams/mine",
				pattern: /^\/api\/teams\/mine\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CgFWxeGk.js'))
			},
			{
				id: "/api/teams/[id]",
				pattern: /^\/api\/teams\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Jh408ave.js'))
			},
			{
				id: "/api/teams/[id]/members",
				pattern: /^\/api\/teams\/([^/]+?)\/members\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D0unhEyB.js'))
			},
			{
				id: "/api/teams/[id]/members/[userId]",
				pattern: /^\/api\/teams\/([^/]+?)\/members\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"userId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-uptE8NVw.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzgbwFOk.js'))
			},
			{
				id: "/api/users/me/preferences",
				pattern: /^\/api\/users\/me\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BHei1Lyo.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DmySyI6P.js'))
			},
			{
				id: "/api/users/[id]/role",
				pattern: /^\/api\/users\/([^/]+?)\/role\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-5BgXe6-o.js'))
			},
			{
				id: "/api/workspaces/[...path]",
				pattern: /^\/api\/workspaces(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CHlIS0xN.js'))
			},
			{
				id: "/audit-log",
				pattern: /^\/audit-log\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(public)/forgot-password",
				pattern: /^\/forgot-password\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(public)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BJK09IEp.js'))
			},
			{
				id: "/messages",
				pattern: /^\/messages\/?$/,
				params: [],
				page: { layouts: [0,3,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/messages/compose",
				pattern: /^\/messages\/compose\/?$/,
				params: [],
				page: { layouts: [0,3,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/messages/[threadId]",
				pattern: /^\/messages\/([^/]+?)\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/notifications",
				pattern: /^\/notifications\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/notifications/settings",
				pattern: /^\/notifications\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/profile",
				pattern: /^\/profile\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(public)/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(public)/reset-password",
				pattern: /^\/reset-password\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/settings/automation",
				pattern: /^\/settings\/automation\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/settings/workspaces",
				pattern: /^\/settings\/workspaces\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/upcoming-events",
				pattern: /^\/upcoming-events\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/uploads/[...path]",
				pattern: /^\/uploads(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CVIYPDco.js'))
			},
			{
				id: "/user-management",
				pattern: /^\/user-management\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
