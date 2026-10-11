import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import type { Region } from 'react-native-maps';
import { clusterPins, type Cluster, type Pin } from '@/utils/clusterPins';

export type { Cluster } from '@/utils/clusterPins';

const viewport = Dimensions.get('window');

export default function usePinClusters(pins: Pin[], region: Region): Cluster[] {
    return useMemo(() => clusterPins(pins, region, viewport), [pins, region]);
}
