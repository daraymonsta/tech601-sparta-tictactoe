const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const readmePath = path.resolve(__dirname, '..', '..', 'README.md');

function getReadme() {
	return readFileSync(readmePath, 'utf8');
}

test('README documents manual MongoDB auth setup with least-privilege app credentials', () => {
	const readme = getReadme();

	assert.match(readme, /## Manual MongoDB authentication setup/i);
	assert.match(readme, /use admin/i);
	assert.match(readme, /APPUSER/);
	assert.match(readme, /ABC321/);
	assert.match(readme, /readWrite/i);
	assert.match(readme, /MONGODB_URI=.*mongodb:\/\/APPUSER:ABC321@/i);
	assert.match(readme, /authSource=admin/i);
});