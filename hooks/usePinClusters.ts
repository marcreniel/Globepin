import { useMemo } from 'react';
import type { Region } from 'react-native-maps';
import { clusterPins, type Cluster, type Pin, type Viewport } from '@/utils/clusterPins';

export type { Cluster } from '@/utils/clusterPins';

export default function usePinClusters(pins: Pin[], region: Region, viewport: Viewport): Cluster[] {
    const { width, height } = viewport;
    return useMemo(() => clusterPins(pins, region, { width, height }), [pins, region, width, height]);
}
