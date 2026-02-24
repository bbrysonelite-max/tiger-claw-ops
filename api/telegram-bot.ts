// telegram-bot.ts — Tiger Claw Scout Telegram delivery service
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';

const TIGER_EMOJI = '🐯';

interface ProspectRow {
  id: string;
  name: string;
  source: string;
  notes: string;
  ai_score: number;
  status: string;
  created_at: string;
  signal_text: string;
  platform_link: string;
}

interface ScriptFeedback {
  id: string;
  tenant_id: string;
  prospect_id: string;
  script_text: string;
  script_type: string;
  feedback: 'no_response' | 'got_reply' | 'converted' | null;
  feedback_at: Date | null;
  created_at: Date;
}

// Feedback button labels
const FEEDBACK_OPTIONS = {
  no_response: { label: '👎 No Response', value: 'no_response' },
  got_reply: { label: '👍 Got Reply', value: 'got_reply' },
  converted: { label: '🎯 Converted!', value: 'converted' }
};

export function startTelegramBot(db: Pool) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
    return null;
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

  // Allowed Telegram user IDs (comma-separated in env)
  const allowedUsers = (process.env.TELEGRAM_ALLOWED_USERS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Use webhook mode — polling causes ETIMEDOUT crashes every ~10 min and restarts the whole process
  const bot = new TelegramBot(token, { polling: false });

  // Register the admin bot webhook with Telegram
  const adminWebhookUrl = `${process.env.GATEWAY_URL || 'https://api.botcraftwrks.ai'}/admin-bot/webhook`;
  fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: adminWebhookUrl, allowed_updates: ['message', 'callback_query'] }),
  })
    .then(r => r.json())
    .then((d: any) => {
      if (d.ok) console.log(`${TIGER_EMOJI} Admin bot webhook registered: ${adminWebhookUrl}`);
      else console.error(`${TIGER_EMOJI} Admin bot webhook registration failed:`, d.description);
    })
    .catch((e: Error) => console.error(`${TIGER_EMOJI} Failed to register admin bot webhook:`, e.message));

  console.log(`${TIGER_EMOJI} Tiger Claw Scout Telegram connected (webhook mode)`);

  function isAllowed(chatId: number): boolean {
    if (allowedUsers.length === 0) return true; // no whitelist = allow all
    return allowedUsers.includes(String(chatId));
  }

  // ---- /start ----
  bot.onText(/\/start/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id,
      `${TIGER_EMOJI} *Tiger Claw Scout* — Your AI Recruiting Partner\n\n` +
      `I find prospects while you sleep and deliver them with personalized approach scripts.\n\n` +
      `*Commands:*\n` +
      `/report — Today's prospect report\n` +
      `/pipeline — Your prospect pipeline summary\n` +
      `/script <name> — Get approach script for a prospect\n` +
      `/objection <text> — Handle an objection\n` +
      `/stats — Your weekly stats\n` +
      `/help — Show this menu`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/help/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id,
      `${TIGER_EMOJI} *Tiger Claw Scout Commands*\n\n` +
      `/report — Get today's prospect report\n` +
      `/pipeline — Pipeline overview (new/contacted/qualified)\n` +
      `/script <name> — AI approach script for a prospect\n` +
      `/objection <their objection> — Get objection handling response\n` +
      `/stats — Weekly performance stats\n` +
      `/recent — Last 5 prospects found`,
      { parse_mode: 'Markdown' }
    );
  });

  // ---- /report — Daily prospect report ----
  bot.onText(/\/report/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    try {
      const report = await generateDailyReport(db, anthropic);
      bot.sendMessage(msg.chat.id, report, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Report error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error generating report. Try again shortly.');
    }
  });

  // ---- /pipeline ----
  bot.onText(/\/pipeline/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    try {
      const counts = await db.query(`
        SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY count DESC
      `);
      const total = await db.query(`SELECT COUNT(*) as total FROM leads`);
      const highScore = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ai_score >= 70`);

      let text = `${TIGER_EMOJI} *Pipeline Summary*\n\n`;
      text += `Total prospects: *${total.rows[0].total}*\n`;
      text += `Qualified (70+): *${highScore.rows[0].count}*\n\n`;

      if (counts.rows.length > 0) {
        text += `*By Status:*\n`;
        for (const row of counts.rows) {
          const emoji = row.status === 'new' ? '🆕' : row.status === 'contacted' ? '📨' : row.status === 'qualified' ? '✅' : row.status === 'converted' ? '🎯' : '📋';
          text += `${emoji} ${row.status}: ${row.count}\n`;
        }
      } else {
        text += `_No prospects yet. Agent Zero is scanning..._`;
      }

      bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Pipeline error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error fetching pipeline.');
    }
  });

  // ---- /recent ----
  bot.onText(/\/recent/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    try {
      const result = await db.query(`
        SELECT name, source, ai_score, notes, created_at
        FROM leads ORDER BY created_at DESC LIMIT 5
      `);

      if (result.rows.length === 0) {
        bot.sendMessage(msg.chat.id, `${TIGER_EMOJI} No prospects found yet. Agent Zero is on it.`);
        return;
      }

      let text = `${TIGER_EMOJI} *Last 5 Prospects*\n\n`;
      for (const p of result.rows) {
        const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        text += `*${p.name}* — Score: ${p.ai_score}/100\n`;
        text += `Source: ${p.source} | ${date}\n`;
        if (p.notes) text += `_${p.notes.substring(0, 100)}_\n`;
        text += `\n`;
      }

      bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Recent error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error fetching recent prospects.');
    }
  });

  // ---- /script <name> — AI approach script ----
  bot.onText(/\/script (.+)/, async (msg, match) => {
    if (!isAllowed(msg.chat.id)) return;
    const searchName = match![1].trim();

    try {
      const result = await db.query(
        `SELECT * FROM leads WHERE LOWER(name) LIKE LOWER($1) ORDER BY ai_score DESC LIMIT 1`,
        [`%${searchName}%`]
      );

      if (result.rows.length === 0) {
        bot.sendMessage(msg.chat.id, `No prospect found matching "${searchName}".`);
        return;
      }

      const prospect = result.rows[0];

      if (!anthropic) {
        bot.sendMessage(msg.chat.id, `Found *${prospect.name}* (Score: ${prospect.ai_score})\nSource: ${prospect.source}\nNotes: ${prospect.notes}\n\n_Set ANTHROPIC_API_KEY to generate AI scripts._`, { parse_mode: 'Markdown' });
        return;
      }

      bot.sendMessage(msg.chat.id, `Generating approach script for *${prospect.name}*...`, { parse_mode: 'Markdown' });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are an expert network marketing recruiter. Generate a personalized approach message for this prospect.

Prospect: ${prospect.name}
Source: ${prospect.source}
Signal/Notes: ${prospect.notes}
Score: ${prospect.ai_score}/100

Write:
1. A warm, natural opening message (2-3 sentences, like texting — not salesy)
2. A follow-up message if they respond positively
3. Top 2 likely objections and how to handle each

Keep it conversational and authentic. This is for Nu Skin wellness/health products in the Thai market. Messages should feel like they're from a real person, not a bot.`
        }]
      });

      const script = response.content[0].type === 'text' ? response.content[0].text : '';

      // Store script in database for feedback tracking
      const scriptRecord = await db.query(
        `INSERT INTO script_feedback (prospect_id, script_text, script_type, tenant_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [prospect.id, script, 'approach', process.env.DEFAULT_TENANT_ID || 'default']
      ).catch(() => null);

      const scriptId = scriptRecord?.rows[0]?.id || 'unknown';

      // Send script with feedback buttons
      bot.sendMessage(msg.chat.id,
        `${TIGER_EMOJI} *Approach Script — ${prospect.name}*\nScore: ${prospect.ai_score}/100 | Source: ${prospect.source}\n\n${script}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: FEEDBACK_OPTIONS.no_response.label, callback_data: `feedback:${scriptId}:no_response` },
              { text: FEEDBACK_OPTIONS.got_reply.label, callback_data: `feedback:${scriptId}:got_reply` },
              { text: FEEDBACK_OPTIONS.converted.label, callback_data: `feedback:${scriptId}:converted` }
            ]]
          }
        }
      );
    } catch (err) {
      console.error('Script error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error generating script.');
    }
  });

  // ---- /objection <text> ----
  bot.onText(/\/objection (.+)/, async (msg, match) => {
    if (!isAllowed(msg.chat.id)) return;
    const objection = match![1].trim();

    if (!anthropic) {
      bot.sendMessage(msg.chat.id, '_Set ANTHROPIC_API_KEY for AI objection handling._', { parse_mode: 'Markdown' });
      return;
    }

    try {
      bot.sendMessage(msg.chat.id, 'Thinking...');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are an expert network marketing recruiter for Nu Skin wellness products. A prospect just said:

"${objection}"

Give a natural, empathetic response that:
1. Acknowledges their concern genuinely
2. Reframes it
3. Moves the conversation forward

Keep it conversational, 2-4 sentences max. Like texting a friend, not a sales pitch.`
        }]
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : '';
      bot.sendMessage(msg.chat.id, `${TIGER_EMOJI} *Suggested Response:*\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Objection error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error generating response.');
    }
  });

  // ---- Feedback callback handler ----
  bot.on('callback_query', async (query) => {
    if (!query.data?.startsWith('feedback:')) return;
    if (!query.message) return;
    if (!isAllowed(query.message.chat.id)) return;

    const [, scriptId, feedbackType] = query.data.split(':');

    try {
      // Update feedback in database
      await db.query(
        `UPDATE script_feedback SET feedback = $1, feedback_at = NOW() WHERE id = $2`,
        [feedbackType, scriptId]
      );

      // If successful (got_reply or converted), add to hive learnings
      if (feedbackType === 'got_reply' || feedbackType === 'converted') {
        const scriptRecord = await db.query(
          `SELECT sf.script_text, sf.script_type, l.source, l.notes
           FROM script_feedback sf
           LEFT JOIN leads l ON sf.prospect_id = l.id
           WHERE sf.id = $1`,
          [scriptId]
        );

        if (scriptRecord.rows.length > 0) {
          const { script_text, script_type, source, notes } = scriptRecord.rows[0];
          await db.query(
            `INSERT INTO hive_learnings (learning_type, content, context, success_count)
             VALUES ($1, $2, $3, 1)
             ON CONFLICT (content) DO UPDATE SET success_count = hive_learnings.success_count + 1`,
            [
              `winning_${script_type}`,
              script_text,
              JSON.stringify({ source, signal: notes, feedback: feedbackType })
            ]
          );
          console.log(`${TIGER_EMOJI} Hive learning added: ${feedbackType} script`);
        }
      }

      // Acknowledge the callback
      const emoji = feedbackType === 'converted' ? '🎯' : feedbackType === 'got_reply' ? '👍' : '👎';
      const message = feedbackType === 'converted'
        ? 'Awesome! 🎉 Script marked as converted. Added to Hive learnings!'
        : feedbackType === 'got_reply'
        ? 'Great! Script marked as successful. Added to Hive learnings!'
        : 'Thanks for the feedback. We\'ll improve!';

      bot.answerCallbackQuery(query.id, { text: `${emoji} Feedback recorded!` });
      bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      });
      bot.sendMessage(query.message.chat.id, message);

    } catch (err) {
      console.error('Feedback error:', err);
      bot.answerCallbackQuery(query.id, { text: '❌ Error saving feedback' });
    }
  });

  // ---- /stats ----
  bot.onText(/\/stats/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thisWeek = await db.query(
        `SELECT COUNT(*) as count FROM leads WHERE created_at >= $1`, [weekAgo]
      );
      const qualified = await db.query(
        `SELECT COUNT(*) as count FROM leads WHERE created_at >= $1 AND ai_score >= 70`, [weekAgo]
      );
      const total = await db.query(`SELECT COUNT(*) as count FROM leads`);
      const avgScore = await db.query(
        `SELECT COALESCE(AVG(ai_score), 0) as avg FROM leads WHERE created_at >= $1`, [weekAgo]
      );

      let text = `${TIGER_EMOJI} *Weekly Stats*\n\n`;
      text += `Prospects found this week: *${thisWeek.rows[0].count}*\n`;
      text += `Qualified (70+): *${qualified.rows[0].count}*\n`;
      text += `Average score: *${Math.round(avgScore.rows[0].avg)}*/100\n`;
      text += `All-time total: *${total.rows[0].count}*\n`;

      bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Stats error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error fetching stats.');
    }
  });

  // ---- Free text messages → AI chat ----
  bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return; // skip commands
    if (!isAllowed(msg.chat.id)) return;

    if (!anthropic) {
      bot.sendMessage(msg.chat.id, 'AI chat requires ANTHROPIC_API_KEY to be configured.');
      return;
    }

    try {
      // Fetch recent prospects for context
      const recent = await db.query(
        `SELECT name, source, ai_score, notes FROM leads ORDER BY created_at DESC LIMIT 10`
      );
      const prospectContext = recent.rows.map(p =>
        `- ${p.name} (${p.source}, score ${p.ai_score}): ${p.notes || 'no notes'}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You are Tiger Claw Scout, an AI recruiting assistant for Nu Skin network marketing. You help the user manage prospects, create approach scripts, handle objections, and strategize. You have access to these recent prospects:\n\n${prospectContext}\n\nBe concise, practical, and conversational.`,
        messages: [{ role: 'user', content: msg.text || '' }]
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : '';
      bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Chat error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error processing message.');
    }
  });

  // ---- Scheduled daily report (7 AM Bangkok time = 0:00 UTC) ----
  const reportChatId = process.env.TELEGRAM_REPORT_CHAT_ID;
  if (reportChatId) {
    // 7 AM Bangkok = midnight UTC
    cron.schedule('0 0 * * *', async () => {
      console.log(`${TIGER_EMOJI} Sending scheduled daily report...`);
      try {
        const report = await generateDailyReport(db, anthropic);
        bot.sendMessage(parseInt(reportChatId), report, { parse_mode: 'Markdown' });
        console.log(`${TIGER_EMOJI} Daily report sent to ${reportChatId}`);
      } catch (err) {
        console.error('Scheduled report error:', err);
      }
    }, { timezone: 'Asia/Bangkok' });

    // Also schedule for 7 AM Bangkok explicitly
    cron.schedule('0 7 * * *', async () => {
      console.log(`${TIGER_EMOJI} Sending morning report...`);
      try {
        const report = await generateDailyReport(db, anthropic);
        bot.sendMessage(parseInt(reportChatId), report, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Morning report error:', err);
      }
    }, { timezone: 'Asia/Bangkok' });

    console.log(`${TIGER_EMOJI} Daily reports scheduled for 7:00 AM Bangkok time → chat ${reportChatId}`);
  } else {
    console.log('⚠️  TELEGRAM_REPORT_CHAT_ID not set — auto-reports disabled. Use /report manually.');
  }

  return bot;
}

async function generateDailyReport(db: Pool, anthropic: Anthropic | null): Promise<string> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get today's new prospects
  const newProspects = await db.query(
    `SELECT name, source, ai_score, notes, created_at
     FROM leads WHERE created_at >= $1 ORDER BY ai_score DESC`,
    [oneDayAgo]
  );

  // Get total pipeline
  const total = await db.query(`SELECT COUNT(*) as count FROM leads`);
  const qualified = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ai_score >= 70`);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  let report = `${TIGER_EMOJI} *Tiger Claw Daily Report*\n${today}\n\n`;

  if (newProspects.rows.length === 0) {
    report += `_No new prospects in the last 24 hours._\n`;
    report += `Agent Zero is scanning — check back tomorrow.\n\n`;
  } else {
    report += `*${newProspects.rows.length} new prospect(s) found:*\n\n`;

    for (let i = 0; i < newProspects.rows.length; i++) {
      const p = newProspects.rows[i];
      const scoreBar = p.ai_score >= 80 ? '🔥' : p.ai_score >= 70 ? '✅' : '📋';

      report += `*${i + 1}. ${p.name}* ${scoreBar}\n`;
      report += `Score: ${p.ai_score}/100 | Source: ${p.source}\n`;
      if (p.notes) {
        report += `Signal: _${p.notes.substring(0, 150)}_\n`;
      }
      report += `\n`;
    }

    // Generate approach scripts for top prospects if AI is available
    if (anthropic && newProspects.rows.length > 0) {
      const topProspects = newProspects.rows.filter((p: ProspectRow) => p.ai_score >= 70).slice(0, 3);
      if (topProspects.length > 0) {
        report += `---\n*Suggested Approaches:*\n\n`;
        for (const p of topProspects) {
          try {
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 150,
              messages: [{
                role: 'user',
                content: `Write a 2-sentence casual, warm opening message to ${p.name} who was found on ${p.source}. Their signal: "${p.notes}". For Nu Skin wellness products in Thailand. Like texting, not a sales pitch.`
              }]
            });
            const script = response.content[0].type === 'text' ? response.content[0].text : '';
            report += `*${p.name}:* ${script}\n\n`;
          } catch {
            // skip if AI fails for one prospect
          }
        }
      }
    }
  }

  report += `---\n`;
  report += `Pipeline: ${total.rows[0].count} total | ${qualified.rows[0].count} qualified\n`;
  report += `Use /script <name> for full approach scripts`;

  return report;
}
