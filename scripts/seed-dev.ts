--- FILE: scripts/seed-dev.ts
import 'dotenv/config';
const base = process.env.API_BASE || 'http://localhost:3001';

async function main() {
  const r = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'operator', password:'operator'})});
  if (!r.ok) { console.log('login failed'); return; }
  const {access_token} = await r.json();
  const h = { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' };
  const rq = await fetch(base + '/api/requests', {method:'POST', headers:h, body: JSON.stringify({terminal_number:'TST-0001', vessel_name:'M/V TESTER', mmsi:'273123456', owner_email:'owner@example.com'})});
  const jr = await rq.json(); console.log('[seed] request id:', jr.id);
}
main();
