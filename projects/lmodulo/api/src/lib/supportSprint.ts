import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';

const SYSTEM_USER = new ObjectId('000000000000000000000000');

export async function getSupportSprint(db: Db): Promise<{ milestoneId: ObjectId; sprintId: ObjectId }> {
  const now = new Date();

  let milestone = await db.collection('agile_milestones').findOne({ title: 'Support' });
  if (!milestone) {
    const res = await db.collection('agile_milestones').insertOne({
      title:           'Support',
      description:     'Customer support tickets',
      strategicGoal:   'Track and resolve customer-reported issues.',
      priority:        'High',
      status:          'Active',
      startDate:       new Date('2020-01-01'),
      endDate:         new Date('2099-12-31'),
      calendarEventIds: [],
      createdBy:       SYSTEM_USER,
      updatedBy:       null,
      createdAt:       now,
      updatedAt:       now,
    });
    milestone = { _id: res.insertedId };
  }
  const milestoneId = milestone._id as ObjectId;

  let sprint = await db.collection('agile_sprints').findOne({ title: 'Support', milestoneId });
  if (!sprint) {
    const res = await db.collection('agile_sprints').insertOne({
      milestoneId,
      sprintNumber:    1,
      title:           'Support',
      description:     'Ongoing customer support queue',
      capacity:        0,
      status:          'Active',
      teamId:          null,
      startDate:       new Date('2020-01-01'),
      endDate:         new Date('2099-12-31'),
      calendarEventIds: [],
      createdBy:       SYSTEM_USER,
      updatedBy:       null,
      createdAt:       now,
      updatedAt:       now,
    });
    sprint = { _id: res.insertedId };
  }

  return { milestoneId, sprintId: sprint._id as ObjectId };
}
