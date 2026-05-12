import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export async function sendWelcomeMessage(
  db: Db,
  customerId: ObjectId,
  companyName: string,
  customerName: string
): Promise<void> {
  const sender = await db.collection('users').findOne({
    role: { $in: ['owner', 'admin'] }
  });
  if (!sender) return;

  const now = new Date();
  const msgId = new ObjectId();

  const subject = `Welcome to the Client Portal — ${companyName}`;
  const body = `
    <p>Hi ${customerName},</p>
    <p>Welcome to the Client Portal! Your account has been set up and you're ready to get started.</p>
    <p>Through the portal you can:</p>
    <ul>
      <li>View your invoices and payment history</li>
      <li>Make secure payments online</li>
      <li>Send messages directly to our team</li>
    </ul>
    <p>If you have any questions, simply reply to this message and we'll get back to you.</p>
    <p>Best regards,<br />${sender.firstName ? sender.firstName + ' ' + (sender.lastName ?? '') : sender.username}</p>
  `.trim();

  await db.collection('messages').insertOne({
    _id:         msgId,
    threadId:    msgId,
    parentId:    null,
    from:        sender._id,
    to:          [customerId],
    cc:          [],
    subject,
    body,
    attachments: [],
    createdAt:   now,
  });

  await db.collection('message_state').insertMany([
    { messageId: msgId, userId: sender._id, read: true,  readAt: now,  archived: false, deleted: false },
    { messageId: msgId, userId: customerId, read: false, readAt: null, archived: false, deleted: false },
  ]);
}
