import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { interpolate, getField } from './template.js';
import { executeAction } from './actions.js';

export interface Condition {
  field: string;
  op:    '==' | '!=' | 'contains';
  value: unknown;
}

export interface AutomationAction {
  type:   'notification.send' | 'message.send' | 'calendar.event.create';
  params: Record<string, unknown>;
}

export interface AutomationRule {
  _id:       ObjectId;
  name:      string;
  trigger:   { event: string; conditions: Condition[] };
  actions:   AutomationAction[];
  enabled:   boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function evaluateConditions(conditions: Condition[], payload: Record<string, unknown>): boolean {
  return conditions.every(c => {
    const val = getField(payload, c.field);
    switch (c.op) {
      case '==':       return String(val) === String(c.value);
      case '!=':       return String(val) !== String(c.value);
      case 'contains': return typeof val === 'string' && val.includes(String(c.value));
      default:         return false;
    }
  });
}

const SENSITIVE = new Set(['passwordHash', 'password', 'resetToken', 'inviteToken']);

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([k]) => !SENSITIVE.has(k)));
}

export async function processEvent(
  app:     FastifyInstance,
  rules:   AutomationRule[],
  event:   string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = app.mongo.db!;

  for (const rule of rules) {
    if (!evaluateConditions(rule.trigger.conditions ?? [], payload)) continue;

    const executedAt = new Date();
    let success = true;
    let errorMsg: string | null = null;

    try {
      for (const action of rule.actions) {
        const interpolatedParams = JSON.parse(interpolate(JSON.stringify(action.params), payload)) as Record<string, unknown>;
        await executeAction(app, action.type, interpolatedParams);
      }
    } catch (err) {
      success  = false;
      errorMsg = err instanceof Error ? err.message : String(err);
      app.log.error({ ruleId: rule._id, event, error: errorMsg }, '[automation] action failed');
    }

    await db.collection('automation_logs').insertOne({
      ruleId:     rule._id,
      ruleName:   rule.name,
      event,
      payload:    sanitizePayload(payload),
      success,
      error:      errorMsg,
      executedAt,
    });
  }
}
