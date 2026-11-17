export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34')
];

export const server_loads = [0,4];

export const dictionary = {
		"/": [~5],
		"/403": [21],
		"/(public)/accept-invite": [~16,[3]],
		"/audit-log": [~22],
		"/dashboard": [~23],
		"/(docs)/documentation": [6,[2]],
		"/(docs)/documentation/administration": [7,[2]],
		"/(docs)/documentation/api": [8,[2]],
		"/(docs)/documentation/architecture": [9,[2]],
		"/(docs)/documentation/authentication": [10,[2]],
		"/(docs)/documentation/automation": [11,[2]],
		"/(docs)/documentation/getting-started": [12,[2]],
		"/(docs)/documentation/messaging": [13,[2]],
		"/(docs)/documentation/rbac": [14,[2]],
		"/(docs)/documentation/workspaces": [15,[2]],
		"/(public)/forgot-password": [~17,[3]],
		"/(public)/login": [~18,[3]],
		"/messages": [24,[4]],
		"/messages/compose": [26,[4]],
		"/messages/[threadId]": [~25,[4]],
		"/notifications": [~27],
		"/notifications/settings": [~28],
		"/profile": [~29],
		"/(public)/register": [~19,[3]],
		"/(public)/reset-password": [~20,[3]],
		"/settings": [~30],
		"/settings/automation": [~31],
		"/settings/workspaces": [~32],
		"/upcoming-events": [~33],
		"/user-management": [~34]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';