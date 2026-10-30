import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storyFrame, sceneAt, processAt, damp, range} from '../motion/math.js';
test('story unfolds, dims to 95%, and gathers at the exit', () => {
  assert.equal(storyFrame(0,0).spread,0);
  assert.equal(storyFrame(.25,0).spread,1);
  assert.equal(storyFrame(.6,0).dim,.95);
  assert.equal(storyFrame(1,0).spread,0);
  assert.equal(storyFrame(1,0).dim,0);
});
test('reverse scroll reconstructs exactly the same scenes and transforms', () => {
  const p=[0,.1,.31,.33,.6,.78,.93,1];
  const forward=p.map(n=>[sceneAt(n),storyFrame(n,3)]);
  assert.deepEqual(p.toReversed().map(n=>[sceneAt(n),storyFrame(n,3)]).toReversed(),forward);
});
test('step boundaries clamp and scroll damping cannot overshoot', () => {
  assert.equal(processAt(-1),0);assert.equal(processAt(1),3);
  assert.equal(range(-10,0,1),0);assert.equal(range(10,0,1),1);
  assert.ok(damp(0,100,10)>0 && damp(0,100,10)<100);
});
