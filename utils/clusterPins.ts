export interface ClusterRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface Viewport {
    width: number;
    height: number;
}

export interface Pin {
    id: string;
    latitude: number;
    longitude: number;
}

export interface Cluster {
    id: string;
    latitude: number;
    longitude: number;
    pins: Pin[];
    count: number;
}

const CLUSTER_RADIUS_PX = 50;


function toScreen(lat: number, lng: number, region: ClusterRegion, viewport: Viewport) {
    return {
        x: ((lng - region.longitude) / region.longitudeDelta + 0.5) * viewport.width,
        y: ((region.latitude - lat) / region.latitudeDelta + 0.5) * viewport.height,
    };
}

function distScreen(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }, region: ClusterRegion, viewport: Viewport): number {
    const sa = toScreen(a.latitude, a.longitude, region, viewport);
    const sb = toScreen(b.latitude, b.longitude, region, viewport);
    const dx = sa.x - sb.x;
    const dy = sa.y - sb.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function mergeTwoClusters(a: Cluster, b: Cluster): Cluster {
    const allPins = [...a.pins, ...b.pins];
    const totalCount = allPins.length;
    const lat = (a.latitude * a.count + b.latitude * b.count) / totalCount;
    const lng = (a.longitude * a.count + b.longitude * b.count) / totalCount;
    return {
        id: allPins.map((p) => p.id).sort().join('-'),
        latitude: lat,
        longitude: lng,
        pins: allPins,
        count: totalCount,
    };
}

export function clusterPins(pins: Pin[], region: ClusterRegion, viewport: Viewport): Cluster[] {
    let items: Cluster[] = pins.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        pins: [p],
        count: 1,
    }));

    // Hierarchical: merge closest pair repeatedly
    let merged = true;
    while (merged) {
        merged = false;
        let bestDist = CLUSTER_RADIUS_PX;
        let bestI = -1;
        let bestJ = -1;

        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const d = distScreen(items[i], items[j], region, viewport);
                if (d < bestDist) {
                    bestDist = d;
                    bestI = i;
                    bestJ = j;
                }
            }
        }

        if (bestI >= 0 && bestJ >= 0) {
            const newCluster = mergeTwoClusters(items[bestI], items[bestJ]);
            items = items.filter((_, idx) => idx !== bestI && idx !== bestJ);
            items.push(newCluster);
            merged = true;
        }
    }

    return items;
}

