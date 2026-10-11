import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterPins } from '../utils/clusterPins.ts';
const region = { latitude: 0, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };
const viewport = { width: 1000, height: 1000 };
const pin = (id, latitude, longitude) => ({ id, latitude, longitude });

test('empty input has no clusters', () => {
    assert.deepEqual(clusterPins([], region, viewport), []);
});
test('single pin retains location and membership', () => {
    const p = pin('a', 2, 3);
    assert.deepEqual(clusterPins([p], region, viewport), [{ ...p, pins: [p], count: 1 }]);
});
test('nearby pair uses midpoint while distant pin stays separate', () => {
    const result = clusterPins([pin('a', 0, 0), pin('b', 0, 1), pin('c', 0, 40)], region, viewport);
    assert.equal(result.length, 2);
    const pair = result.find(c => c.count === 2);
    assert.equal(pair.longitude, 0.5);
    assert.equal(pair.id, 'a-b');
});
test('strict 50-unit boundary leaves pins separate', () => {
    assert.equal(clusterPins([pin('a', 0, 0), pin('b', 0, 50)], region, { width: 100, height: 100 }).length, 2);
    assert.equal(clusterPins([pin('a', 0, 0), pin('b', 0, 49)], region, { width: 100, height: 100 }).length, 1);
});
test('clustering preserves every pin and does not mutate inputs', () => {
    const pins = Object.freeze([pin('c', 0, 4), pin('a', 0, 0), pin('b', 0, 1)].map(Object.freeze));
    const result = clusterPins(pins, region, viewport);
    assert.deepEqual(result.flatMap(c => c.pins.map(p => p.id)).sort(), ['a', 'b', 'c']);
    assert.ok(result.every(c => c.count === c.pins.length));
    assert.deepEqual(pins.map(p => p.id), ['c', 'a', 'b']);
});
