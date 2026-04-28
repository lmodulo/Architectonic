import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';

export interface AutomationRule {
  _id:            ObjectId;
  userId:         ObjectId;
  name:           string;
  order:          number;
  active:         boolean;
  conditionLogic: 'all' | 'any';
  conditions:     RuleCondition[];
  actions:        RuleAction[];
  createdAt:      Date;
  updatedAt:      Date;
}

export interface RuleCondition {
  field:    'merchant_name' | 'category' | 'amount' | 'description';
  operator: 'contains' | 'equals' | 'starts_with' | 'greater_than' | 'less_than';
  value:    string | number;
}

export interface RuleAction {
  type:  'set_category' | 'add_tag' | 'set_note' | 'flag';
  value: string;
}

function matchesCondition(tx: Record<string, unknown>, cond: RuleCondition): boolean {
  const raw = tx[cond.field];

  if (cond.operator === 'greater_than' || cond.operator === 'less_than') {
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (isNaN(num)) return false;
    return cond.operator === 'greater_than'
      ? num > (cond.value as number)
      : num < (cond.value as number);
  }

  const str  = typeof raw === 'string' ? raw.toLowerCase() : String(raw ?? '').toLowerCase();
  const val  = String(cond.value).toLowerCase();

  switch (cond.operator) {
    case 'equals':      return str === val;
    case 'contains':    return str.includes(val);
    case 'starts_with': return str.startsWith(val);
    default:            return false;
  }
}

function applyAction(tx: Record<string, unknown>, action: RuleAction): void {
  switch (action.type) {
    case 'set_category': tx.userCategory = action.value; break;
    case 'set_note':     tx.userNote     = action.value; break;
    case 'flag':         tx.flagged      = true;         break;
    case 'add_tag': {
      const tags = Array.isArray(tx.userTags) ? (tx.userTags as string[]) : [];
      if (!tags.includes(action.value)) tags.push(action.value);
      tx.userTags = tags;
      break;
    }
  }
}

/**
 * Load the user's active rules (ordered) and apply them to the given transactions in-memory.
 * Returns the same array with fields mutated where rules matched.
 * Caller is responsible for persisting the changes.
 */
export async function applyRules(
  db: Db,
  userId: string,
  transactions: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const rules = await db
    .collection<AutomationRule>('budget_automation_rules')
    .find({ userId: new ObjectId(userId), active: true })
    .sort({ order: 1 })
    .toArray();

  for (const tx of transactions) {
    for (const rule of rules) {
      const matched = rule.conditionLogic === 'all'
        ? rule.conditions.every(c => matchesCondition(tx, c))
        : rule.conditions.some(c  => matchesCondition(tx, c));

      if (matched) {
        for (const action of rule.actions) applyAction(tx, action);
      }
    }
  }

  return transactions;
}
