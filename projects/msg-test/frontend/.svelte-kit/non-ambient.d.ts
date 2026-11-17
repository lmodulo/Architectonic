
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(public)" | "/(docs)" | "/" | "/403" | "/(public)/accept-invite" | "/api" | "/api/auth" | "/api/auth/avatar" | "/api/auth/profile" | "/api/automation" | "/api/automation/[...path]" | "/api/chat" | "/api/events" | "/api/events/public" | "/api/events/[id]" | "/api/health" | "/api/messages" | "/api/messages/archived" | "/api/messages/sent" | "/api/messages/unread-count" | "/api/messages/[threadId]" | "/api/messages/[threadId]/reply" | "/api/messages/[threadId]/state" | "/api/notifications" | "/api/notifications/[...path]" | "/api/search" | "/api/settings" | "/api/settings/logo" | "/api/settings/[key]" | "/api/teams" | "/api/teams/mine" | "/api/teams/[id]" | "/api/teams/[id]/members" | "/api/teams/[id]/members/[userId]" | "/api/users" | "/api/users/me" | "/api/users/me/preferences" | "/api/users/[id]" | "/api/users/[id]/role" | "/api/workspaces" | "/api/workspaces/[...path]" | "/audit-log" | "/dashboard" | "/(docs)/documentation" | "/(docs)/documentation/administration" | "/(docs)/documentation/api" | "/(docs)/documentation/architecture" | "/(docs)/documentation/authentication" | "/(docs)/documentation/automation" | "/(docs)/documentation/getting-started" | "/(docs)/documentation/messaging" | "/(docs)/documentation/rbac" | "/(docs)/documentation/workspaces" | "/(public)/forgot-password" | "/(public)/login" | "/logout" | "/messages" | "/messages/compose" | "/messages/[threadId]" | "/notifications" | "/notifications/settings" | "/profile" | "/(public)/register" | "/(public)/reset-password" | "/settings" | "/settings/automation" | "/settings/workspaces" | "/upcoming-events" | "/uploads" | "/uploads/[...path]" | "/user-management";
		RouteParams(): {
			"/api/automation/[...path]": { path: string };
			"/api/events/[id]": { id: string };
			"/api/messages/[threadId]": { threadId: string };
			"/api/messages/[threadId]/reply": { threadId: string };
			"/api/messages/[threadId]/state": { threadId: string };
			"/api/notifications/[...path]": { path: string };
			"/api/settings/[key]": { key: string };
			"/api/teams/[id]": { id: string };
			"/api/teams/[id]/members": { id: string };
			"/api/teams/[id]/members/[userId]": { id: string; userId: string };
			"/api/users/[id]": { id: string };
			"/api/users/[id]/role": { id: string };
			"/api/workspaces/[...path]": { path: string };
			"/messages/[threadId]": { threadId: string };
			"/uploads/[...path]": { path: string }
		};
		LayoutParams(): {
			"/(public)": Record<string, never>;
			"/(docs)": Record<string, never>;
			"/": { path?: string; id?: string; threadId?: string; key?: string; userId?: string };
			"/403": Record<string, never>;
			"/(public)/accept-invite": Record<string, never>;
			"/api": { path?: string; id?: string; threadId?: string; key?: string; userId?: string };
			"/api/auth": Record<string, never>;
			"/api/auth/avatar": Record<string, never>;
			"/api/auth/profile": Record<string, never>;
			"/api/automation": { path?: string };
			"/api/automation/[...path]": { path: string };
			"/api/chat": Record<string, never>;
			"/api/events": { id?: string };
			"/api/events/public": Record<string, never>;
			"/api/events/[id]": { id: string };
			"/api/health": Record<string, never>;
			"/api/messages": { threadId?: string };
			"/api/messages/archived": Record<string, never>;
			"/api/messages/sent": Record<string, never>;
			"/api/messages/unread-count": Record<string, never>;
			"/api/messages/[threadId]": { threadId: string };
			"/api/messages/[threadId]/reply": { threadId: string };
			"/api/messages/[threadId]/state": { threadId: string };
			"/api/notifications": { path?: string };
			"/api/notifications/[...path]": { path: string };
			"/api/search": Record<string, never>;
			"/api/settings": { key?: string };
			"/api/settings/logo": Record<string, never>;
			"/api/settings/[key]": { key: string };
			"/api/teams": { id?: string; userId?: string };
			"/api/teams/mine": Record<string, never>;
			"/api/teams/[id]": { id: string; userId?: string };
			"/api/teams/[id]/members": { id: string; userId?: string };
			"/api/teams/[id]/members/[userId]": { id: string; userId: string };
			"/api/users": { id?: string };
			"/api/users/me": Record<string, never>;
			"/api/users/me/preferences": Record<string, never>;
			"/api/users/[id]": { id: string };
			"/api/users/[id]/role": { id: string };
			"/api/workspaces": { path?: string };
			"/api/workspaces/[...path]": { path: string };
			"/audit-log": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/(docs)/documentation": Record<string, never>;
			"/(docs)/documentation/administration": Record<string, never>;
			"/(docs)/documentation/api": Record<string, never>;
			"/(docs)/documentation/architecture": Record<string, never>;
			"/(docs)/documentation/authentication": Record<string, never>;
			"/(docs)/documentation/automation": Record<string, never>;
			"/(docs)/documentation/getting-started": Record<string, never>;
			"/(docs)/documentation/messaging": Record<string, never>;
			"/(docs)/documentation/rbac": Record<string, never>;
			"/(docs)/documentation/workspaces": Record<string, never>;
			"/(public)/forgot-password": Record<string, never>;
			"/(public)/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/messages": { threadId?: string };
			"/messages/compose": Record<string, never>;
			"/messages/[threadId]": { threadId: string };
			"/notifications": Record<string, never>;
			"/notifications/settings": Record<string, never>;
			"/profile": Record<string, never>;
			"/(public)/register": Record<string, never>;
			"/(public)/reset-password": Record<string, never>;
			"/settings": Record<string, never>;
			"/settings/automation": Record<string, never>;
			"/settings/workspaces": Record<string, never>;
			"/upcoming-events": Record<string, never>;
			"/uploads": { path?: string };
			"/uploads/[...path]": { path: string };
			"/user-management": Record<string, never>
		};
		Pathname(): "/" | "/403" | "/accept-invite" | "/api/auth/avatar" | "/api/auth/profile" | `/api/automation/${string}` & {} | "/api/chat" | "/api/events" | "/api/events/public" | `/api/events/${string}` & {} | "/api/health" | "/api/messages" | "/api/messages/archived" | "/api/messages/sent" | "/api/messages/unread-count" | `/api/messages/${string}` & {} | `/api/messages/${string}/reply` & {} | `/api/messages/${string}/state` & {} | `/api/notifications/${string}` & {} | "/api/search" | "/api/settings" | "/api/settings/logo" | `/api/settings/${string}` & {} | "/api/teams" | "/api/teams/mine" | `/api/teams/${string}` & {} | `/api/teams/${string}/members` & {} | `/api/teams/${string}/members/${string}` & {} | "/api/users" | "/api/users/me/preferences" | `/api/users/${string}` & {} | `/api/users/${string}/role` & {} | `/api/workspaces/${string}` & {} | "/audit-log" | "/dashboard" | "/documentation" | "/documentation/administration" | "/documentation/api" | "/documentation/architecture" | "/documentation/authentication" | "/documentation/automation" | "/documentation/getting-started" | "/documentation/messaging" | "/documentation/rbac" | "/documentation/workspaces" | "/forgot-password" | "/login" | "/logout" | "/messages" | "/messages/compose" | `/messages/${string}` & {} | "/notifications" | "/notifications/settings" | "/profile" | "/register" | "/reset-password" | "/settings" | "/settings/automation" | "/settings/workspaces" | "/upcoming-events" | `/uploads/${string}` & {} | "/user-management";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/logo.svg" | string & {};
	}
}