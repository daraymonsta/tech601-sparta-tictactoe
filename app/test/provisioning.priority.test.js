const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const readmePath = path.join(repoRoot, 'README.md');
const provDbPath = path.join(repoRoot, 'ops', 'provisioning', 'prov-db.sh');
const provAppPath = path.join(repoRoot, 'ops', 'provisioning', 'prov-app.sh');

function readText(filePath) {
	return readFileSync(filePath, 'utf8');
}

test('README documents the two-tier provisioning scripts and EC2 user-data usage', () => {
	const readme = readText(readmePath);

	assert.match(readme, /ops\/provisioning\/prov-db\.sh/);
	assert.match(readme, /ops\/provisioning\/prov-app\.sh/);
	assert.match(readme, /user data/i);
	assert.match(readme, /APP_REPO_URL/);
	assert.match(readme, /DB_HOST/);
});

test('prov-db.sh provisions MongoDB with app-scoped credentials and enables auth', () => {
	assert.equal(existsSync(provDbPath), true, 'expected ops/provisioning/prov-db.sh to exist');
	const script = readText(provDbPath);

	assert.match(script, /^#!\/usr\/bin\/env bash/m);
	assert.match(script, /set -euo pipefail/);
	assert.match(script, /DEBIAN_FRONTEND=noninteractive/);
	assert.match(script, /mongodb-org/);
	assert.match(script, /db\.createUser\(/);
	assert.match(script, /APPUSER/);
	assert.match(script, /ABC321/);
	assert.match(script, /readWrite/);
	assert.match(script, /authorization: enabled/);
	assert.match(script, /tee -a \/var\/log\//);
	assert.doesNotMatch(script, /\bsudo\b/);
	assert.doesNotMatch(script, /read -p/);
});

test('prov-app.sh provisions Node, Nginx, pm2, and a reverse-proxied app deployment', () => {
	assert.equal(existsSync(provAppPath), true, 'expected ops/provisioning/prov-app.sh to exist');
	const script = readText(provAppPath);

	assert.match(script, /^#!\/usr\/bin\/env bash/m);
	assert.match(script, /set -euo pipefail/);
	assert.match(script, /DEBIAN_FRONTEND=noninteractive/);
	assert.match(script, /apt-get install -y .*nginx/);
	assert.match(script, /apt-get install -y .*git/);
	assert.match(script, /npm install -g pm2/);
	assert.match(script, /git clone/);
	assert.match(script, /\/opt\/sparta-app-v2/);
	assert.match(script, /proxy_pass http:\/\/127\.0\.0\.1:(?:3000|\$\{?APP_PORT\}?)/);
	assert.match(script, /pm2 startup/);
	assert.match(script, /pm2 save/);
	assert.match(script, /tee -a \/var\/log\//);
	assert.doesNotMatch(script, /\bsudo\b/);
	assert.doesNotMatch(script, /read -p/);
});