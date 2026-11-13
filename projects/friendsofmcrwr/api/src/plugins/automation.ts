import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { AutomationRule } from '../lib/automation/engine.js';
import { processEvent } from '../lib/automation/engine.js';

type AutomationBus = {
  fire:        (event: string, payload: Record<string, unknown>) => void;
  reloadRules: () => Promise<void>;
};

export default fp(async function automationPlugin(app: FastifyInstance) {
  let ruleCache = new Map<string, AutomationRule[]>();

  async function loadRules(): Promise<void> {
    const rules = await app.mongo.db!
      .collection('automation_rules')
      .find({ enabled: true })
      .toArray() as unknown as AutomationRule[];

    const cache = new Map<string, AutomationRule[]>();
    for (const rule of rules) {
      const key = rule.trigger.event;
      if (!cache.has(key)) cache.set(key, []);
      cache.get(key)!.push(rule);
    }
    ruleCache = cache;
    app.log.info(`[automation] ${rules.length} rule(s) loaded`);
  }

  const bus: AutomationBus = {
    fire(event, payload) {
      const rules = ruleCache.get(event) ?? [];
      if (!rules.length) return;
      processEvent(app, rules, event, payload).catch(err =>
        app.log.error({ event, err }, '[automation] processEvent error')
      );
    },
    reloadRules: loadRules,
  };

  app.decorate('bus', bus);

  app.addHook('onReady', loadRules);
});
