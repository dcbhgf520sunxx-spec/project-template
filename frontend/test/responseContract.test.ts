import assert from 'node:assert/strict';
import test from 'node:test';
import { arrayContract, objectContract } from '../src/api/responseContract.ts';

test('object contract rejects a response missing a required field', () => {
  const contract = objectContract(['id', 'problem_desc']);

  assert.equal(contract({ id: 1, problem_desc: 'ok' }), true);
  assert.equal(contract({ id: 1, problemDesc: 'wrong name' }), false);
});

test('array contract validates every record', () => {
  const contract = arrayContract(objectContract(['id']));

  assert.equal(contract([{ id: 1 }, { id: 2 }]), true);
  assert.equal(contract([{ id: 1 }, {}]), false);
});
