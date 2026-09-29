#!/usr/bin/env node
// Adds an encrypted task to inbox/tasks.json (then commit + push).
//
//   TASK_CODE="<code>" node tools/send-task.mjs --title "Beat mit Geige" \
//     --brief "Was genau zu tun ist …" [--genre "UK Afroswing"] [--effort 3] [--days 5]
//
// --effort = hours of work (deadline follows the weekly plan), --days = fixed
// deadline in days instead. The code is never written to the repo.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptTask, decryptTask } from '../web/js/inbox.js';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const m = /^--(\w+)$/.exec(process.argv[i]);
  if (m) args[m[1]] = process.argv[++i];
}
const code = process.env.TASK_CODE;
if (!code || !args.title || !args.brief) {
  console.error('Usage: TASK_CODE=… node tools/send-task.mjs --title "…" --brief "…" [--genre …] [--effort 3] [--days 5]');
  process.exit(1);
}
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'inbox', 'tasks.json');
const inbox = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { v: 1, tasks: [] };
const task = {
  title: args.title, brief: args.brief.replace(/\\n/g, '\n'),
  ...(args.genre && { genre: args.genre }),
  ...(args.effort && { effort: Number(args.effort) }),
  ...(args.days && { days: Number(args.days) }),
};
const at = Date.now();
const id = `${new Date(at).toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 7)}`;
const encd = await encryptTask(task, code);
if (!(await decryptTask(encd, code))) throw new Error('self-check failed');
inbox.tasks.push({ id, at, enc: encd });
writeFileSync(file, `${JSON.stringify(inbox, null, 1)}\n`);
console.log(`added ${id}: ${task.title}`);
