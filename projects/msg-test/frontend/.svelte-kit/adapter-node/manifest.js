export const manifest = (() => {
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
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js')),
			__memo(() => import('./nodes/19.js')),
			__memo(() => import('./nodes/20.js')),
			__memo(() => import('./nodes/21.js')),
			__memo(() => import('./nodes/22.js')),
			__memo(() => import('./nodes/23.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/auth/avatar/_server.ts.js'))
			},
			{
				id: "/api/auth/profile",
				pattern: /^\/api\/auth\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/profile/_server.ts.js'))
			},
			{
				id: "/api/automation/[...path]",
				pattern: /^\/api\/automation(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/automation/_...path_/_server.ts.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/_server.ts.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/events/_server.ts.js'))
			},
			{
				id: "/api/events/public",
				pattern: /^\/api\/events\/public\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/events/public/_server.ts.js'))
			},
			{
				id: "/api/events/[id]",
				pattern: /^\/api\/events\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/events/_id_/_server.ts.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/messages",
				pattern: /^\/api\/messages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/_server.ts.js'))
			},
			{
				id: "/api/messages/archived",
				pattern: /^\/api\/messages\/archived\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/archived/_server.ts.js'))
			},
			{
				id: "/api/messages/sent",
				pattern: /^\/api\/messages\/sent\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/sent/_server.ts.js'))
			},
			{
				id: "/api/messages/unread-count",
				pattern: /^\/api\/messages\/unread-count\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/unread-count/_server.ts.js'))
			},
			{
				id: "/api/messages/[threadId]",
				pattern: /^\/api\/messages\/([^/]+?)\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/_threadId_/_server.ts.js'))
			},
			{
				id: "/api/messages/[threadId]/reply",
				pattern: /^\/api\/messages\/([^/]+?)\/reply\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/_threadId_/reply/_server.ts.js'))
			},
			{
				id: "/api/messages/[threadId]/state",
				pattern: /^\/api\/messages\/([^/]+?)\/state\/?$/,
				params: [{"name":"threadId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/messages/_threadId_/state/_server.ts.js'))
			},
			{
				id: "/api/notifications/[...path]",
				pattern: /^\/api\/notifications(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/notifications/_...path_/_server.ts.js'))
			},
			{
				id: "/api/search",
				pattern: /^\/api\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/search/_server.ts.js'))
			},
			{
				id: "/api/settings",
				pattern: /^\/api\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/settings/_server.ts.js'))
			},
			{
				id: "/api/settings/logo",
				pattern: /^\/api\/settings\/logo\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/settings/logo/_server.ts.js'))
			},
			{
				id: "/api/settings/[key]",
				pattern: /^\/api\/settings\/([^/]+?)\/?$/,
				params: [{"name":"key","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/settings/_key_/_server.ts.js'))
			},
			{
				id: "/api/teams",
				pattern: /^\/api\/teams\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/teams/_server.ts.js'))
			},
			{
				id: "/api/teams/mine",
				pattern: /^\/api\/teams\/mine\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/teams/mine/_server.ts.js'))
			},
			{
				id: "/api/teams/[id]",
				pattern: /^\/api\/teams\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/teams/_id_/_server.ts.js'))
			},
			{
				id: "/api/teams/[id]/members",
				pattern: /^\/api\/teams\/([^/]+?)\/members\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/teams/_id_/members/_server.ts.js'))
			},
			{
				id: "/api/teams/[id]/members/[userId]",
				pattern: /^\/api\/teams\/([^/]+?)\/members\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"userId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/teams/_id_/members/_userId_/_server.ts.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_server.ts.js'))
			},
			{
				id: "/api/users/me/preferences",
				pattern: /^\/api\/users\/me\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/me/preferences/_server.ts.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_id_/_server.ts.js'))
			},
			{
				id: "/api/users/[id]/role",
				pattern: /^\/api\/users\/([^/]+?)\/role\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_id_/role/_server.ts.js'))
			},
			{
				id: "/api/workspaces/[...path]",
				pattern: /^\/api\/workspaces(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/workspaces/_...path_/_server.ts.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/logout/_server.ts.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/uploads/_...path_/_server.ts.js'))
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

export const prerendered = new Set([]);

export const base = "";