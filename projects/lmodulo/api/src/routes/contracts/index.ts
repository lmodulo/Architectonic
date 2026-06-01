import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { randomUUID } from 'crypto';
import { logAudit } from '../../lib/audit.js';
import {
  sendContractSigningEmail,
  sendContractSignedEmail,
} from '../../lib/email.js';
import contractTemplateRoutes from './templates.js';

const COL         = 'contracts';
const SIGNERS_COL = 'contract_signers';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapContract(doc: Record<string, unknown>) {
  return {
    ...doc,
    id:          (doc._id as ObjectId).toString(),
    _id:         undefined,
    companyId:   doc.companyId   ? (doc.companyId   as ObjectId).toString() : null,
    dealId:      doc.dealId      ? (doc.dealId      as ObjectId).toString() : null,
    estimateId:  doc.estimateId  ? (doc.estimateId  as ObjectId).toString() : null,
    createdBy:   doc.createdBy   ? (doc.createdBy   as ObjectId).toString() : null,
    contactIds:  ((doc.contactIds as ObjectId[]) ?? []).map(id => id.toString()),
  };
}

export default async function contractRoutes(app: FastifyInstance) {

  // GET /contracts
  app.get('/', { preHandler: app.requirePermission('contracts', 'read') }, async (req) => {
    const db     = app.mongo.db!;
    const userId = req.session.userId!;
    const { status, companyId, type } = req.query as Record<string, string>;

    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const match: Record<string, unknown> = {};

    if (userDoc?.role === 'customer') {
      match['signers.email'] = userDoc.email;
    }

    if (status)    match.status    = status;
    if (companyId) match.companyId = parseOid(companyId, app);
    if (type)      match.type      = type;

    const docs = await db.collection(COL)
      .find(match)
      .sort({ createdAt: -1 })
      .toArray();

    const companyIds = [...new Set(
      docs.filter(d => d.companyId).map(d => (d.companyId as ObjectId).toString())
    )];
    const companies = companyIds.length
      ? await db.collection('crm_companies').find({ _id: { $in: companyIds.map(id => new ObjectId(id)) } }).toArray()
      : [];
    const companyMap = Object.fromEntries(companies.map((c: any) => [c._id.toString(), c.name]));

    return docs.map(d => ({
      ...mapContract(d as Record<string, unknown>),
      companyName: d.companyId ? (companyMap[(d.companyId as ObjectId).toString()] ?? null) : null,
    }));
  });

  // POST /contracts
  app.post('/', { preHandler: app.requirePermission('contracts', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      title, type = 'custom', content = '', companyId, contactIds = [],
      dealId, estimateId, value = null, currency = 'USD',
      effectiveDate, expiryDate,
    } = req.body as Record<string, unknown>;

    if (!title) throw app.httpErrors.badRequest('title is required');

    const doc = {
      title,
      type,
      content,
      status:        'draft',
      companyId:     companyId     ? parseOid(companyId as string, app)     : null,
      dealId:        dealId        ? parseOid(dealId as string, app)        : null,
      estimateId:    estimateId    ? parseOid(estimateId as string, app)    : null,
      contactIds:    ((contactIds as string[]) ?? []).map(id => parseOid(id, app)),
      value:         value != null ? Number(value) : null,
      currency,
      effectiveDate: effectiveDate ? new Date(effectiveDate as string) : null,
      expiryDate:    expiryDate    ? new Date(expiryDate as string)    : null,
      signers:       [],
      attachments:   [],
      createdBy:     new ObjectId(req.session.userId!),
      createdAt:     now,
      updatedAt:     now,
    };

    const result = await db.collection(COL).insertOne(doc);
    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'contracts.create', resourceId: result.insertedId.toString(), meta: { title, type }, ip: req.ip });

    reply.code(201);
    return mapContract({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /contracts/:id
  app.get('/:id', { preHandler: app.requirePermission('contracts', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Contract not found');

    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId!) });
    if (
      userDoc?.role === 'customer' &&
      !doc.signers?.some((s: any) => s.email === userDoc.email)
    ) {
      throw app.httpErrors.forbidden();
    }

    const signers = await db.collection(SIGNERS_COL)
      .find({ contractId: oid })
      .project({ token: 0 })
      .toArray();

    let companyName = null;
    if (doc.companyId) {
      const company = await db.collection('crm_companies').findOne({ _id: doc.companyId as ObjectId });
      companyName = company?.name ?? null;
    }

    return {
      ...mapContract(doc as Record<string, unknown>),
      companyName,
      signerDetails: signers.map((s: any) => ({
        ...s,
        id:         s._id.toString(),
        _id:        undefined,
        contractId: s.contractId.toString(),
      })),
    };
  });

  // PATCH /contracts/:id
  app.patch('/:id', { preHandler: app.requirePermission('contracts', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const now = new Date();

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Contract not found');
    if (!['draft', 'active'].includes(doc.status)) {
      throw app.httpErrors.badRequest('Only draft or active contracts can be edited');
    }

    const {
      title, type, content, companyId, contactIds, dealId, estimateId,
      value, currency, effectiveDate, expiryDate, status,
    } = req.body as Record<string, unknown>;

    const update: Record<string, unknown> = { updatedAt: now };
    if (title         != null) update.title         = title;
    if (type          != null) update.type           = type;
    if (content       != null) update.content        = content;
    if (currency      != null) update.currency       = currency;
    if (value         != null) update.value          = Number(value);
    if (status        != null) update.status         = status;
    if (companyId     != null) update.companyId      = parseOid(companyId as string, app);
    if (dealId        != null) update.dealId         = parseOid(dealId as string, app);
    if (estimateId    != null) update.estimateId     = parseOid(estimateId as string, app);
    if (contactIds    != null) update.contactIds     = (contactIds as string[]).map(id => parseOid(id, app));
    if (effectiveDate != null) update.effectiveDate  = new Date(effectiveDate as string);
    if (expiryDate    != null) update.expiryDate     = new Date(expiryDate as string);

    await db.collection(COL).updateOne({ _id: oid }, { $set: update });
    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'contracts.update', resourceId: oid.toString(), meta: update, ip: req.ip });

    const updated = await db.collection(COL).findOne({ _id: oid });
    return mapContract(updated as Record<string, unknown>);
  });

  // DELETE /contracts/:id
  app.delete('/:id', { preHandler: app.requirePermission('contracts', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Contract not found');
    if (doc.status !== 'draft') throw app.httpErrors.badRequest('Only draft contracts can be deleted');

    await db.collection(COL).deleteOne({ _id: oid });
    await db.collection(SIGNERS_COL).deleteMany({ contractId: oid });
    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'contracts.delete', resourceId: oid.toString(), meta: { title: doc.title }, ip: req.ip });

    reply.code(204).send();
  });

  // POST /contracts/:id/send — send for signature
  app.post('/:id/send', { preHandler: app.requirePermission('contracts', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const now = new Date();

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Contract not found');
    if (!['draft', 'active'].includes(doc.status)) {
      throw app.httpErrors.badRequest('Only draft or active contracts can be sent');
    }

    const { signers } = req.body as { signers?: Array<{ name: string; email: string; role?: string }> };
    if (!signers?.length) throw app.httpErrors.badRequest('At least one signer is required');

    const appUrl     = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
    const tokenExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.collection(SIGNERS_COL).deleteMany({ contractId: oid, status: 'pending' });

    const signerDocs = signers.map(s => ({
      contractId:     oid,
      name:           s.name,
      email:          s.email.toLowerCase(),
      role:           s.role ?? 'client',
      token:          randomUUID(),
      tokenExpiresAt: tokenExpiry,
      status:         'pending',
      signatureData:  null,
      signedAt:       null,
      declinedAt:     null,
      declinedReason: null,
      ipAddress:      null,
      userAgent:      null,
      createdAt:      now,
    }));

    await db.collection(SIGNERS_COL).insertMany(signerDocs);

    const embeddedSigners = signers.map(s => ({
      name: s.name, email: s.email.toLowerCase(), role: s.role ?? 'client', status: 'pending', signedAt: null,
    }));
    await db.collection(COL).updateOne({ _id: oid }, {
      $set: { status: 'pending_signature', signers: embeddedSigners, updatedAt: now },
    });

    for (const sd of signerDocs) {
      const signingUrl = `${appUrl}/contracts/sign/${sd.token}`;
      try {
        await sendContractSigningEmail(sd.email, {
          signerName:    sd.name,
          contractTitle: doc.title as string,
          signingUrl,
          expiryDays:    30,
        });
      } catch (err) {
        app.log.warn({ err }, `Failed to send signing email to ${sd.email}`);
      }
    }

    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'contracts.send_for_signature', resourceId: oid.toString(), meta: { signerCount: signers.length }, ip: req.ip });

    return { ok: true, signerCount: signers.length };
  });

  // POST /contracts/:id/void
  app.post('/:id/void', { preHandler: app.requirePermission('contracts', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const now = new Date();

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Contract not found');
    if (doc.status === 'voided') throw app.httpErrors.badRequest('Already voided');

    await db.collection(COL).updateOne({ _id: oid }, { $set: { status: 'voided', updatedAt: now } });
    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'contracts.void', resourceId: oid.toString(), ip: req.ip });

    return { ok: true };
  });

  // ── Public signing endpoints (no auth required) ──────────────────────────────

  // GET /contracts/sign/:token
  app.get('/sign/:token', async (req) => {
    const db    = app.mongo.db!;
    const token = (req.params as { token: string }).token;

    const signer = await db.collection(SIGNERS_COL).findOne({ token });
    if (!signer) throw app.httpErrors.notFound('Signing link not found');

    if (signer.tokenExpiresAt < new Date()) {
      return {
        expired:  true,
        signer:   { name: signer.name, email: signer.email, status: signer.status },
      };
    }

    if (signer.status !== 'pending') {
      return {
        alreadySigned: signer.status === 'signed',
        declined:      signer.status === 'declined',
        signer: {
          name:     signer.name,
          email:    signer.email,
          status:   signer.status,
          signedAt: signer.signedAt,
        },
      };
    }

    const contract = await db.collection(COL).findOne({ _id: signer.contractId as ObjectId });
    if (!contract) throw app.httpErrors.notFound('Contract not found');

    const brandSettings = await db.collection('settings')
      .find({ key: { $in: ['brand.name', 'brand.logo'] } })
      .toArray();
    const brandName = brandSettings.find((s: any) => s.key === 'brand.name')?.value ?? '';
    const brandLogo = brandSettings.find((s: any) => s.key === 'brand.logo')?.value ?? '';

    return {
      signer: { name: signer.name, email: signer.email, role: signer.role, status: signer.status },
      contract: {
        id:      contract._id.toString(),
        title:   contract.title,
        type:    contract.type,
        content: contract.content,
        signers: contract.signers,
      },
      brand: { name: brandName, logo: brandLogo },
    };
  });

  // POST /contracts/sign/:token — submit signature
  app.post('/sign/:token', async (req) => {
    const db    = app.mongo.db!;
    const token = (req.params as { token: string }).token;
    const now   = new Date();

    const signer = await db.collection(SIGNERS_COL).findOne({ token });
    if (!signer) throw app.httpErrors.notFound('Signing link not found');
    if (signer.tokenExpiresAt < now) throw app.httpErrors.badRequest('Signing link has expired');
    if (signer.status !== 'pending') throw app.httpErrors.badRequest('Already signed or declined');

    const { signatureData, consent } = req.body as { signatureData?: string; consent?: boolean };
    if (!signatureData) throw app.httpErrors.badRequest('signatureData is required');
    if (!consent)       throw app.httpErrors.badRequest('Consent is required');

    const ip        = req.ip;
    const userAgent = (req.headers['user-agent'] ?? '') as string;

    await db.collection(SIGNERS_COL).updateOne({ token }, {
      $set: { status: 'signed', signatureData, signedAt: now, ipAddress: ip, userAgent },
    });

    await db.collection(COL).updateOne(
      { _id: signer.contractId as ObjectId, 'signers.email': signer.email },
      { $set: { 'signers.$.status': 'signed', 'signers.$.signedAt': now, updatedAt: now } },
    );

    await db.collection('audit_logs').insertOne({
      userId:     null,
      username:   signer.email,
      action:     'contracts.signed',
      resourceId: signer.contractId,
      meta:       { signerEmail: signer.email, signerName: signer.name, ip },
      ip,
      createdAt:  now,
    });

    const allSigners = await db.collection(SIGNERS_COL)
      .find({ contractId: signer.contractId })
      .toArray();
    const allSigned = allSigners.every((s: any) =>
      s.status === 'signed' || (s._id as ObjectId).equals(signer._id as ObjectId)
    );

    if (allSigned) {
      await db.collection(COL).updateOne(
        { _id: signer.contractId as ObjectId },
        { $set: { status: 'signed', updatedAt: now } },
      );
    }

    const contract = await db.collection(COL).findOne({ _id: signer.contractId as ObjectId });
    if (contract?.createdBy) {
      const creator = await db.collection('users').findOne({ _id: contract.createdBy as ObjectId });
      if (creator?.email) {
        const appUrl = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
        try {
          await sendContractSignedEmail(creator.email, {
            signerName:    signer.name as string,
            contractTitle: contract.title as string,
            contractUrl:   `${appUrl}/contracts/${signer.contractId}`,
            fullyExecuted: allSigned,
          });
        } catch {}
      }
    }

    return { ok: true, fullyExecuted: allSigned };
  });

  // POST /contracts/sign/:token/decline
  app.post('/sign/:token/decline', async (req) => {
    const db    = app.mongo.db!;
    const token = (req.params as { token: string }).token;
    const now   = new Date();

    const signer = await db.collection(SIGNERS_COL).findOne({ token });
    if (!signer) throw app.httpErrors.notFound('Signing link not found');
    if (signer.tokenExpiresAt < now) throw app.httpErrors.badRequest('Signing link has expired');
    if (signer.status !== 'pending') throw app.httpErrors.badRequest('Already responded');

    const { reason = '' } = req.body as { reason?: string };

    await db.collection(SIGNERS_COL).updateOne({ token }, {
      $set: { status: 'declined', declinedAt: now, declinedReason: reason },
    });

    await db.collection(COL).updateOne(
      { _id: signer.contractId as ObjectId, 'signers.email': signer.email },
      { $set: { 'signers.$.status': 'declined', updatedAt: now } },
    );

    await db.collection('audit_logs').insertOne({
      userId:     null,
      username:   signer.email,
      action:     'contracts.declined',
      resourceId: signer.contractId,
      meta:       { signerEmail: signer.email, reason },
      ip:         req.ip,
      createdAt:  now,
    });

    return { ok: true };
  });

  await app.register(contractTemplateRoutes, { prefix: '/templates' });
}
