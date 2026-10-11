import assert from 'node:assert/strict';
import test from 'node:test';
import { clusterPins } from '../utils/clusterPins.ts';

const region = { latitude: 0, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };
const viewport = { width: 1000, height: 1000 };
const pin = (id, latitude, longitude) => ({ id, latitude, longitude });

test('empty and single-pin inputs retain their meaning', () => {
    assert.deepEqual(clusterPins([], region, viewport), []);
    const p = pin('a', 2, 3);
    assert.deepEqual(clusterPins([p], region, viewport), [
        { id: 'a', latitude: 2, longitude: 3, pins: [p], count: 1 },
    ]);
});

test('merges nearby pins and keeps distant pins separate', () => {
    const result = clusterPins([pin('a', 0, 0), pin('b', 0, 1), pin('c', 0, 30)], region, viewport);
    assert.deepEqual(result.map(c => c.count).sort(), [1, 2]);
    assert.deepEqual(result.find(c => c.count === 2).pins.map(p => p.id).sort(), ['a', 'b']);
});

test('uses pin-weighted centers when merging unequal clusters', () => {
    const [cluster] = clusterPins([pin('a', 0, 0), pin('b', 0, 1), pin('c', 0, 4)], region, viewport);
    assert.equal(cluster.count, 3);
    assert.ok(Math.abs(cluster.longitude - 5 / 3) < 1e-12);
    assert.equal(cluster.latitude, 0);
    assert.equal(cluster.id, 'a-b-c');
});

test('preserves every pin once and does not mutate caller data', () => {
    const pins = Object.freeze([pin('c', 1, 1), pin('a', 0, 0), pin('b', 0, 30)].map(Object.freeze));
    const before = JSON.stringify(pins);
    const result = clusterPins(pins, Object.freeze(region), Object.freeze(viewport));
    assert.deepEqual(result.flatMap(c => c.pins.map(p => p.id)).sort(), ['a', 'b', 'c']);
    assert.ok(result.every(c => c.count === c.pins.length));
    assert.equal(JSON.stringify(pins), before);
});

test('keeps pins exactly 50 pixels apart separate and merges just inside', () => {
    assert.equal(clusterPins([pin('a', 0, 0), pin('b', 0, 50)], region, { width: 100, height: 100 }).length, 2);
    assert.equal(clusterPins([pin('a', 0, 0), pin('b', 0, 49)], region, { width: 100, height: 100 }).length, 1);
});
