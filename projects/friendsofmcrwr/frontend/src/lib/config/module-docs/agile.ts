import { Milestone, Clock } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'agile', label: 'Agile', icon: Milestone, order: 10, description: 'Milestones, sprints, jobs, and tasks with boards, timelines, and reports.' },
  { slug: 'time',  label: 'Time Tracking', icon: Clock, order: 11, description: 'Log hours against tasks, run timers, and review weekly time.' },
] satisfies DocsPage[];
