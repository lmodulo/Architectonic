// Forked from modules/agile's lib/agile.ts so modules/crm has no build-time
// dependency on modules/agile — degrades to an empty rollup if the agile
// module (and its agile_* collections) aren't installed.
//
// Aggregation pipeline for agile_milestones with rollup stats. Joins
// sprints → jobs → tasks to compute effort and completion, and looks up
// crm_companies to resolve clientName.
export function milestoneRollupPipeline(matchStage: Record<string, unknown>) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'agile_sprints', localField: '_id', foreignField: 'milestoneId', as: '_sprints',
      },
    },
    {
      $lookup: {
        from: 'agile_jobs',
        let: { sprintIds: '$_sprints._id' },
        pipeline: [{ $match: { $expr: { $in: ['$sprintId', '$$sprintIds'] } } }],
        as: '_jobs',
      },
    },
    {
      $lookup: {
        from: 'agile_tasks',
        let: { jobIds: '$_jobs._id' },
        pipeline: [{ $match: { $expr: { $in: ['$jobId', '$$jobIds'] } } }],
        as: '_tasks',
      },
    },
    {
      $lookup: {
        from: 'crm_companies',
        localField: 'clientId',
        foreignField: '_id',
        as: '_client',
      },
    },
    {
      $addFields: {
        totalEstimatedHours: { $sum: '$_tasks.estimateHours' },
        totalActualHours:    { $sum: '$_tasks.actualHours'   },
        completionPct: {
          $cond: [
            { $gt: [{ $sum: '$_tasks.estimateHours' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $sum: { $map: { input: '$_tasks', as: 't', in: { $cond: [{ $eq: ['$$t.status', 'Done'] }, '$$t.estimateHours', 0] } } } },
                    { $sum: '$_tasks.estimateHours' },
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
        sprintCount: { $size: '$_sprints' },
        jobCount:    { $size: '$_jobs'    },
        taskCount:   { $size: '$_tasks'   },
        clientName:  { $ifNull: [{ $arrayElemAt: ['$_client.name', 0] }, null] },
      },
    },
    { $project: { _sprints: 0, _jobs: 0, _tasks: 0, _client: 0 } },
  ];
}
