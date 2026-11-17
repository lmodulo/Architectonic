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
	() => import('./nodes/23')
];

export const server_loads = [0,3];

export const dictionary = {
		"/": [4],
		"/403": [10],
		"/(public)/accept-invite": [~5,[2]],
		"/audit-log": [~11],
		"/dashboard": [~12],
		"/(public)/forgot-password": [6,[2]],
		"/(public)/login": [7,[2]],
		"/messages": [13,[3]],
		"/messages/compose": [15,[3]],
		"/messages/[threadId]": [~14,[3]],
		"/notifications": [~16],
		"/notifications/settings": [~17],
		"/profile": [~18],
		"/(public)/register": [~8,[2]],
		"/(public)/reset-password": [~9,[2]],
		"/settings": [~19],
		"/settings/automation": [~20],
		"/settings/workspaces": [~21],
		"/upcoming-events": [~22],
		"/user-management": [~23]
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