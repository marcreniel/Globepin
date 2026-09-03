import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Region } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';

interface FindMyPinProps {
    size?: number;
    emoji?: string;
    count?: number;
    latitude?: number;
    longitude?: number;
    region?: Region;
}

function getEdgeScale(lat: number, lng: number, region: Region): number {
    const latHalf = region.latitudeDelta / 2;
    const lngHalf = region.longitudeDelta / 2;
    const latDist = Math.abs(lat - region.latitude) / latHalf;
    const lngDist = Math.abs(lng - region.longitude) / lngHalf;
    const maxDist = Math.max(latDist, lngDist);

    if (maxDist < 0.75) return 1;
    if (maxDist > 1.0) return 0;
    const t = (maxDist - 0.75) / 0.25;
    return 1 - t * t;
}

export default function FindMyPin({ size = 52, emoji = '📍', count, latitude, longitude, region }: FindMyPinProps) {
    const isCluster = count !== undefined && count > 1;
    const bubbleSize = size * 0.82;
    const emojiSize = size * 0.4;
    const height = size * (56 / 52);
    // Head circle matches the SVG's r=24 in a 52-wide viewBox. The tail is a square
    // rotated 45°, placed so its lower vertex sits on the tip at y = 55/56.
    const headSize = size * (48 / 52);
    const tailSize = size * 0.34;
    const tailCenterY = height * (55 / 56) - (tailSize * Math.SQRT2) / 2;
    // Checked lazily, not at module scope: evaluating this at import time can run
    // before the native module is ready and report false, dropping the whole session
    // back to the SVG shape. Liquid Glass is iOS 26+; elsewhere the SVG is the fallback.
    const liquidGlass = useMemo(() => isLiquidGlassAvailable(), []);
    const animScale = useRef(new Animated.Value(1)).current;
    // Subtler bouncy pulse on mount (merge = grow from 1.15, split = shrink from 0.8)
    const mergeScale = useRef(new Animated.Value(isCluster ? 1.15 : 0.8)).current;

    useEffect(() => {
        if (!region || latitude === undefined || longitude === undefined) return;

        const target = getEdgeScale(latitude, longitude, region);
        Animated.timing(animScale, {
            toValue: target,
            duration: 0,
            useNativeDriver: false,
        }).start();
    }, [region]);

    // Agar.io style spring on mount (softened)
    useEffect(() => {
        Animated.spring(mergeScale, {
            toValue: 1,
            friction: 5,
            tension: 250,
            useNativeDriver: false,
        }).start();
    }, []);

    return (
        <Animated.View style={[
            styles.container,
            {
                width: size,
                height,
                transform: [{ scale: animScale }],
                transformOrigin: 'center bottom',
            },
        ]}>
            <Animated.View style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', transform: [{ scale: mergeScale }] }
            ]}>
                {liquidGlass ? (
                    // The teardrop is a circle plus a point, so it's built from two
                    // glass shapes that GlassContainer merges into one fluid blob —
                    // the glass effect can't be clipped to an arbitrary SVG path.
                    <GlassContainer spacing={tailSize} style={StyleSheet.absoluteFill}>
                        <GlassView
                            colorScheme="dark"
                            style={{
                                position: 'absolute',
                                width: tailSize,
                                height: tailSize,
                                left: (size - tailSize) / 2,
                                top: tailCenterY - tailSize / 2,
                                borderRadius: tailSize * 0.2,
                                transform: [{ rotate: '45deg' }],
                            }}
                        />
                        <GlassView
                            colorScheme="dark"
                            style={{
                                position: 'absolute',
                                width: headSize,
                                height: headSize,
                                left: (size - headSize) / 2,
                                top: 0,
                                borderRadius: headSize / 2,
                            }}
                        />
                    </GlassContainer>
                ) : (
                    <Svg
                        width={size}
                        height={height}
                        viewBox="0 0 52 56"
                        style={StyleSheet.absoluteFill}
                    >
                        <Path
                            d="M26 55
                       C25.5 53 25 51 22 48
                       C8 45 2 36.5 2 26
                       C2 12.745 12.745 2 26 2
                       C39.255 2 50 12.745 50 26
                       C50 36.5 44 45 30 48
                       C27 51 26.5 53 26 55Z"
                            fill="rgba(30, 30, 30, 0.88)"
                            stroke="rgba(255, 255, 255, 0.12)"
                            strokeLinejoin="round"
                        />
                    </Svg>
                )}

                <View style={[styles.emojiContainer, { width: bubbleSize, height: bubbleSize, marginTop: size * 0.09 }]}>
                    {isCluster ? (
                        <Text style={[styles.countText, { fontSize: emojiSize * 0.9 }]}>
                            {count}
                        </Text>
                    ) : (
                        <Text style={{ fontSize: emojiSize }}>
                            {emoji}
                        </Text>
                    )}
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    emojiContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // Slight negative margin left/top can sometimes fix optical centering issues in custom SVGs
        // but here we just need to ensure the text itself is perfectly centered
    },
    countText: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
