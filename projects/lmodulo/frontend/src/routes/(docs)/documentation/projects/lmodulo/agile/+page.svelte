<svelte:head>
  <title>Agile Module — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Agile Module</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The agile tracker organizes work into a four-level hierarchy: milestones contain sprints, sprints contain jobs, and jobs contain tasks. Each level rolls up completion percentages, effort hours, and counts from its children so you can track progress at any granularity.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Hierarchy</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>Milestone  ← strategic goal or product version (e.g. "v1.1 Agile Tracker")
  └── Sprint  ← time-boxed iteration (e.g. "Sprint 1 — Mar 1–14")
        └── Job  ← a deliverable unit of work (e.g. "Design kanban board UI")
              └── Task  ← atomic work item assigned to a person</code></pre>
  </div>

  <!-- Milestones -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Milestones</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A milestone represents a major strategic goal or product release. It groups sprints and provides a top-level view of progress across a theme of work.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Short name for the milestone (e.g. "v1.1 Agile Tracker")</td></tr>
          <tr><td class="font-mono text-xs">description</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Detailed description of the goal</td></tr>
          <tr><td class="font-mono text-xs">strategicGoal</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">The business objective this milestone advances</td></tr>
          <tr><td class="font-mono text-xs">priority</td><td class="text-xs opacity-60">Low | Medium | High | Critical</td><td class="text-sm opacity-70">Importance relative to other milestones</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">Planning | Active | On Hold | Completed | Cancelled</td><td class="text-sm opacity-70">Current lifecycle state</td></tr>
          <tr><td class="font-mono text-xs">startDate / endDate</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Planned date range</td></tr>
          <tr><td class="font-mono text-xs">completionPct</td><td class="text-xs opacity-60">number (computed)</td><td class="text-sm opacity-70">Rolled up from task completion across all child sprints</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Sprints -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Sprints</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Sprints are time-boxed iterations within a milestone. Each sprint has a capacity (in hours) that reflects how much work the team can realistically commit to. Sprint numbers auto-increment within their parent milestone.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">milestoneId</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Parent milestone</td></tr>
          <tr><td class="font-mono text-xs">sprintNumber</td><td class="text-xs opacity-60">number (auto)</td><td class="text-sm opacity-70">Auto-incremented per milestone (Sprint 1, Sprint 2, …)</td></tr>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Short descriptive name</td></tr>
          <tr><td class="font-mono text-xs">capacity</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Available team hours for this sprint</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">Planning | Active | Review | Completed | Cancelled</td><td class="text-sm opacity-70">Sprint phase</td></tr>
          <tr><td class="font-mono text-xs">velocity</td><td class="text-xs opacity-60">number (computed)</td><td class="text-sm opacity-70">Actual hours completed in this sprint</td></tr>
          <tr><td class="font-mono text-xs">committedEffort</td><td class="text-xs opacity-60">number (computed)</td><td class="text-sm opacity-70">Total estimated hours across all jobs</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Jobs -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Jobs</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A job is a discrete deliverable within a sprint — the equivalent of a user story or feature ticket. Jobs can depend on other jobs, and the system validates that no circular dependencies exist. A job marked as blocked requires a reason.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">sprintId</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Parent sprint</td></tr>
          <tr><td class="font-mono text-xs">category</td><td class="text-xs opacity-60">Feature | Bug | Tech Debt | Research</td><td class="text-sm opacity-70">Type of work</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">Backlog | In Progress | Blocked | Review | Done | Cancelled</td><td class="text-sm opacity-70">Current state</td></tr>
          <tr><td class="font-mono text-xs">blocked</td><td class="text-xs opacity-60">boolean</td><td class="text-sm opacity-70">Quick flag for blocked status (also reflected in status field)</td></tr>
          <tr><td class="font-mono text-xs">dependencyIds</td><td class="text-xs opacity-60">string[]</td><td class="text-sm opacity-70">IDs of jobs that must complete before this one can start</td></tr>
          <tr><td class="font-mono text-xs">estimatedHours</td><td class="text-xs opacity-60">number (computed)</td><td class="text-sm opacity-70">Sum of task estimate hours</td></tr>
          <tr><td class="font-mono text-xs">actualHours</td><td class="text-xs opacity-60">number (computed)</td><td class="text-sm opacity-70">Sum of task actual hours logged</td></tr>
          <tr><td class="font-mono text-xs">attachments</td><td class="text-xs opacity-60">array</td><td class="text-sm opacity-70">Uploaded files associated with this job</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tasks -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Tasks</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Tasks are atomic work items assigned to individual team members. They track estimated, actual, and remaining hours, enabling accurate burndown calculations.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">jobId</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Parent job</td></tr>
          <tr><td class="font-mono text-xs">assignedTo</td><td class="text-xs opacity-60">string (userId)</td><td class="text-sm opacity-70">Required when status is "In Progress"</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">Backlog | Ready | In Progress | Blocked | Review | Done</td><td class="text-sm opacity-70">Task workflow state</td></tr>
          <tr><td class="font-mono text-xs">priority</td><td class="text-xs opacity-60">Low | Medium | High | Critical</td><td class="text-sm opacity-70">Task urgency</td></tr>
          <tr><td class="font-mono text-xs">estimateHours</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Up-front effort estimate</td></tr>
          <tr><td class="font-mono text-xs">actualHours</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Hours logged against this task</td></tr>
          <tr><td class="font-mono text-xs">remainingHours</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Remaining effort — feeds the sprint burndown chart</td></tr>
          <tr><td class="font-mono text-xs">blockedReason</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Required when status is "Blocked"</td></tr>
          <tr><td class="font-mono text-xs">dueDate</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Optional task deadline</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Views -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Views</h2>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Kanban Board</p>
        <p class="text-sm opacity-60 leading-relaxed">Tasks organized into six columns by status: Backlog, Ready, In Progress, Blocked, Review, Done. Drag tasks between columns to update status. Filter by assignee or job. Available at <code class="bg-base-300 px-1 rounded text-xs">/agile/board</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Timeline (Gantt)</p>
        <p class="text-sm opacity-60 leading-relaxed">Jobs rendered as horizontal bars on a time axis, drawn with pure SVG. Visualizes overlapping work and schedule gaps. Available at <code class="bg-base-300 px-1 rounded text-xs">/agile/timeline</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Sprint Detail</p>
        <p class="text-sm opacity-60 leading-relaxed">Per-sprint view with a burndown chart, effort summary, job list, and task board. Access via the Agile Overview page or <code class="bg-base-300 px-1 rounded text-xs">/agile/sprints/:id</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Job Detail</p>
        <p class="text-sm opacity-60 leading-relaxed">Full job view with task list, dependency graph, comment feed, attachments panel, and effort bar. Access at <code class="bg-base-300 px-1 rounded text-xs">/agile/jobs/:id</code>.</p>
      </div>
    </div>
  </div>

  <!-- Statuses -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Status Workflows</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Level</th><th>Statuses</th></tr></thead>
        <tbody>
          <tr><td>Milestone</td><td class="text-sm opacity-70">Planning → Active → On Hold / Completed / Cancelled</td></tr>
          <tr><td>Sprint</td><td class="text-sm opacity-70">Planning → Active → Review → Completed / Cancelled</td></tr>
          <tr><td>Job</td><td class="text-sm opacity-70">Backlog → In Progress → Blocked → Review → Done / Cancelled</td></tr>
          <tr><td>Task</td><td class="text-sm opacity-70">Backlog → Ready → In Progress → Blocked → Review → Done</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
