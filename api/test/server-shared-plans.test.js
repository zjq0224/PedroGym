import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boundPort } from './helpers.mjs';

const API = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECRET = crypto.randomBytes(32).toString('hex');
const ADMIN = 'u-admin', ALICE = 'u-alice', BOB = 'u-bob';

function mintSession(uid) {
  const payload = `${uid}:${Date.now() + 86400000}:0`;
  return payload + '.' + crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}
const headers = uid => ({ Cookie: `gymsid=${mintSession(uid)}`, 'Content-Type': 'application/json' });

async function startServer(t) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-shared-plan-'));
  fs.writeFileSync(path.join(dataDir, 'secret'), SECRET, { mode: 0o600 });
  fs.writeFileSync(path.join(dataDir, 'db.json'), JSON.stringify({
    users: [
      { id: ADMIN, name: 'Ada', admin: true, owner: true },
      { id: ALICE, name: 'Alice' },
      { id: BOB, name: 'Bob' },
    ], creds: [], subs: [], invites: []
  }));
  const child = spawn(process.execPath, ['server.js'], {
    cwd: API, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '0', DATA_DIR: dataDir, ORIGIN: 'http://localhost:8080', RP_ID: 'localhost' }
  });
  let log = '';
  child.stdout.on('data', d => log += d);
  child.stderr.on('data', d => log += d);
  t.after(() => { child.kill('SIGKILL'); fs.rmSync(dataDir, { recursive: true, force: true }); });
  const port = await boundPort(child, () => log);
  const call = async (uid, route, body) => {
    const r = await fetch(`http://127.0.0.1:${port}${route}`, {
      ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
      headers: headers(uid),
    });
    return { status: r.status, body: await r.json() };
  };
  return { call, dataDir, base: `http://127.0.0.1:${port}` };
}

const bundle = {
  opengym_plan: 1,
  exported: '2026-10-29',
  name: 'Three day strength',
  unit: 'kg',
  week: { 1: ['r1'], 3: ['r1'], 5: ['r1'] },
  routines: [{
    id: 'r1', name: 'Full body', emoji: 'dumbbell', privateProfileNote: 'drop me',
    ex: [{ id: '0001', sets: 3, reps: 5, weight: 60, privateSetNote: 'drop me too' }]
  }],
  customEx: [],
  workouts: [{ id: 'secret-workout' }],
  bodyweight: [{ d: '2026-10-01', w: 80 }],
};

test('shared plans are opt-in, sanitized, forkable and admin-curated', async t => {
  const h = await startServer(t);

  const anonymous = await fetch(h.base + '/api/shared-plans');
  assert.equal(anonymous.status, 401);

  const made = await h.call(ALICE, '/api/shared-plans/publish', { title: 'Three day strength', summary: 'Start light.', bundle });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  assert.equal(made.body.plan.owner.name, 'Alice');
  assert.equal(made.body.plan.routineCount, 1);
  assert.equal(made.body.plan.exerciseCount, 1);
  assert.equal(made.body.plan.template, false);
  assert.equal('bundle' in made.body.plan, false, 'gallery metadata stays small');
  const id = made.body.plan.id;

  const list = await h.call(BOB, '/api/shared-plans');
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.plans.map(p => p.id), [id]);

  const detail = await h.call(BOB, '/api/shared-plan?id=' + id);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.plan.bundle.routines[0].ex[0].weight, 60);
  assert.equal(JSON.stringify(detail.body).includes('secret-workout'), false);
  assert.equal(JSON.stringify(detail.body).includes('privateProfileNote'), false);
  assert.equal(JSON.stringify(detail.body).includes('privateSetNote'), false);
  assert.equal('bodyweight' in detail.body.plan.bundle, false);

  const stranger = await h.call(BOB, '/api/shared-plans/update', { id, title: 'Taken over' });
  assert.equal(stranger.status, 403);
  const cannotTemplate = await h.call(ALICE, '/api/shared-plans/update', { id, template: true });
  assert.equal(cannotTemplate.status, 403);

  const curated = await h.call(ADMIN, '/api/shared-plans/update', { id, summary: 'Admin note: use a spotter.', template: true });
  assert.equal(curated.status, 200, JSON.stringify(curated.body));
  assert.equal(curated.body.plan.template, true);
  assert.equal(curated.body.plan.summary, 'Admin note: use a spotter.');

  // Removing the account removes what it published as part of the same durable db write.
  const removed = await h.call(ADMIN, '/api/admin/user/delete', { id: ALICE });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  assert.deepEqual((await h.call(BOB, '/api/shared-plans')).body.plans, []);
  const saved = JSON.parse(fs.readFileSync(path.join(h.dataDir, 'db.json'), 'utf8'));
  assert.deepEqual(saved.sharedPlans, []);
});

test('an empty or non-plan payload is refused', async t => {
  const h = await startServer(t);
  for (const bad of [null, {}, { opengym_plan: 1, routines: [] }, { opengym_plan: 1, routines: [{ id: 'r', ex: [] }] }]) {
    const r = await h.call(ALICE, '/api/shared-plans/publish', { title: 'Bad', bundle: bad });
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal(r.body.code, 'shared-plan-invalid');
  }
});
