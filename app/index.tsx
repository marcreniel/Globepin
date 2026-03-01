import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { styled } from 'nativewind';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FindMyPin from '@/components/FindMyPin';
import { HelloWave } from '@/components/hello-wave';
import usePinClusters from '@/hooks/usePinClusters';
import { type TrueSheet } from '@lodev09/react-native-true-sheet';
import { ReanimatedTrueSheet, useReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated';
import { GlassView } from 'expo-glass-effect';
import Reanimated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const StyledMapView = styled(MapView, { className: 'style' });

const isAndroid = Platform.OS === 'android';
type MapStyle = 'standard' | 'hybridFlyover' | 'satellite';

const STILL_DELAY_MS = 400;
const ZOOM_SPEED = 0.45; // zoom per second (lower = faster zoom)
const PAN_MULTIPLIER = 2.75; // pan toward pin multiplier
const DECEL_START = 1; // gentle decel begins here
const DECEL_AGGRO = 0.05; // aggressive decel kicks in here

const INITIAL_REGION: Region = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 100,
    longitudeDelta: 100,
};

interface Pin {
    id: string;
    latitude: number;
    longitude: number;
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [pins, setPins] = useState<Pin[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [mapStyle, setMapStyle] = useState<MapStyle>(isAndroid ? 'satellite' : 'hybridFlyover');
    const [region, setRegion] = useState<Region>(INITIAL_REGION);
    const [liveRegion, setLiveRegion] = useState<Region>(INITIAL_REGION);
    const [isAtUserLocation, setIsAtUserLocation] = useState(false);
    const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current; // tracks finger screen position
    const dragScale = useRef(new Animated.Value(0)).current;
    const wiggleRotation = useRef(new Animated.Value(0)).current;
    const dragOpacity = useRef(new Animated.Value(0)).current;
    const pinColorAnim = useRef(new Animated.Value(0)).current; // 0=gray, 1=red
    const mapRef = useRef<MapView>(null);
    const clusters = usePinClusters(pins, liveRegion);
    const { height: screenHeight } = useWindowDimensions();

    const sheetRef = useRef<TrueSheet>(null);
    const { animatedPosition } = useReanimatedTrueSheet();

    const floatingStyle = useAnimatedStyle(() => {
        // Only read value on UI thread to prevent Reanimated warning during JS render
        const y = _WORKLET ? animatedPosition?.value : screenHeight;
        const validY = (y !== undefined && y > 0) ? y : screenHeight;

        // the 0.33 detent is at y = screenHeight * 0.67. 
        // We want the inset at detent 0 (auto, y ~ 0.85H) to be 32, and it should reach 12
        // right as the sheet reaches detent 1 (0.33) at 0.67H.
        const horizontalInset = interpolate(
            validY,
            [screenHeight * 0.67, screenHeight * 0.85],
            [12, 32],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY: validY - 100 }],
            left: horizontalInset,
            right: horizontalInset,
        };
    });

    const welcomeStyle = useAnimatedStyle(() => {
        // Only read value on UI thread to prevent Reanimated warning
        const y = _WORKLET ? animatedPosition?.value : screenHeight;
        const validY = (y !== undefined && y > 0) ? y : screenHeight;

        // Hide completely before hitting the `auto` detent (which is ~0.85H). 
        // 0.33 detent is at 0.67H. Fade out quickly over the initial drag down from 0.67H to 0.75H.
        const opacity = interpolate(
            validY,
            [screenHeight * 0.67, screenHeight * 0.75],
            [1, 0],
            Extrapolation.CLAMP
        );

        // Slide up by 20px as it fades in
        const translateY = interpolate(
            validY,
            [screenHeight * 0.67, screenHeight * 0.75],
            [0, 20],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const handleDetentChange = useCallback((e: any) => {
        const { index, position } = e.nativeEvent;
        console.log('Sheet snapped to detent:', index, position);
    }, []);

    const handleSearchFocus = useCallback(() => {
        // Programmatically expand the sheet to its maximum detent (index 2 which is 0.8)
        sheetRef.current?.resize(2);
    }, []);

    const fingerPos = useRef({ x: 0, y: 0 });
    const stillnessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafId = useRef<number | null>(null);
    const lastFrameTime = useRef(0);
    const zoomActivated = useRef(false);
    const regionRef = useRef<Region>(INITIAL_REGION);
    const dragVisualsStarted = useRef(false);

    const zoomFrame = useCallback(async (timestamp: number) => {
        if (!zoomActivated.current) return;

        // Calculate delta time for frame-rate-independent zoom
        const dt = lastFrameTime.current ? (timestamp - lastFrameTime.current) / 1000 : 1 / 60;
        lastFrameTime.current = timestamp;

        const pos = fingerPos.current;
        try {
            const coord = await mapRef.current?.coordinateForPoint({
                x: pos.x,
                y: pos.y,
            });
            if (coord && zoomActivated.current) {
                const r = regionRef.current;
                // Piecewise decel: full speed > 1.0, gentle 1.0-0.05, aggressive < 0.05
                // Gentle zone's speed at the boundary (ensures continuity)
                const gentleEndSpeed = ZOOM_SPEED + (1 - ZOOM_SPEED) * 0.65;
                let speed = ZOOM_SPEED;
                if (r.latitudeDelta < DECEL_AGGRO) {
                    // Aggressive zone: starts where gentle left off, brakes to ~1.0
                    const ratio = r.latitudeDelta / DECEL_AGGRO;
                    speed = gentleEndSpeed + (1 - gentleEndSpeed) * Math.pow(1 - ratio, 7.5);
                } else if (r.latitudeDelta < DECEL_START) {
                    // Gentle zone: light decel from ZOOM_SPEED to gentleEndSpeed
                    const ratio = (r.latitudeDelta - DECEL_AGGRO) / (DECEL_START - DECEL_AGGRO);
                    speed = ZOOM_SPEED + (1 - ZOOM_SPEED) * 0.65 * (1 - ratio);
                }
                const frameFactor = Math.pow(speed, dt);
                const panFactor = (1 - frameFactor) * PAN_MULTIPLIER;
                const newRegion: Region = {
                    latitude: r.latitude + (coord.latitude - r.latitude) * panFactor,
                    longitude: r.longitude + (coord.longitude - r.longitude) * panFactor,
                    latitudeDelta: r.latitudeDelta * frameFactor,
                    longitudeDelta: r.longitudeDelta * frameFactor,
                };
                regionRef.current = newRegion;
                setRegion(newRegion);
            }
        } catch {
            // ignore
        }

        if (zoomActivated.current) {
            rafId.current = requestAnimationFrame(zoomFrame);
        }
    }, []);

    const handleZoomIn = useCallback(() => {
        if (!mapRef.current) return;
        mapRef.current.getCamera().then((camera) => {
            if (camera && camera.zoom !== undefined) {
                camera.zoom += 0.5;
                mapRef.current?.animateCamera(camera, { duration: 100 });
            }
        });
    }, []);

    const goToUserLocation = useCallback(async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
        setLiveRegion(newRegion);
        setIsAtUserLocation(true);
    }, []);

    const cleanup = useCallback(() => {
        if (stillnessTimer.current) {
            clearTimeout(stillnessTimer.current);
            stillnessTimer.current = null;
        }
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        zoomActivated.current = false;
        lastFrameTime.current = 0;
    }, []);

    const startZoom = useCallback(() => {
        if (zoomActivated.current) return;
        zoomActivated.current = true;
        lastFrameTime.current = 0;
        rafId.current = requestAnimationFrame(zoomFrame);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_evt, gestureState) => {
                dragVisualsStarted.current = false;
                dragPosition.setValue({ x: gestureState.x0, y: gestureState.y0 });
                dragScale.setValue(0);
                dragOpacity.setValue(0);

                // Smoothly animate pin icon to red
                Animated.timing(pinColorAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: false,
                }).start();

                fingerPos.current = { x: gestureState.x0, y: gestureState.y0 };
            },
            onPanResponderMove: (_evt, gestureState) => {
                dragPosition.setValue({ x: gestureState.moveX, y: gestureState.moveY });
                fingerPos.current = { x: gestureState.moveX, y: gestureState.moveY };

                // Show the dragged pin only on first actual movement
                if (!dragVisualsStarted.current) {
                    dragVisualsStarted.current = true;
                    setIsDragging(true);

                    // Fade the pin icon back to gray as the floating pin takes over
                    Animated.timing(pinColorAnim, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: false,
                    }).start();

                    // Animate the dragged pin in: scale spring + linear opacity fade
                    Animated.parallel([
                        Animated.spring(dragScale, {
                            toValue: 1,
                            friction: 4,
                            tension: 200,
                            useNativeDriver: false,
                        }),
                        Animated.timing(dragOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                    ]).start();

                    // Start wiggle animation
                    wiggleRotation.setValue(0);
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(wiggleRotation, { toValue: 1, duration: 80, useNativeDriver: false }),
                            Animated.timing(wiggleRotation, { toValue: -1, duration: 160, useNativeDriver: false }),
                            Animated.timing(wiggleRotation, { toValue: 0, duration: 80, useNativeDriver: false }),
                        ])
                    ).start();
                }

                // If zoom is already activated, do nothing — it keeps going
                if (zoomActivated.current) return;

                // Reset stillness timer on every move event.
                // Zoom only activates when move events STOP for STILL_DELAY_MS.
                if (stillnessTimer.current) {
                    clearTimeout(stillnessTimer.current);
                }
                stillnessTimer.current = setTimeout(() => {
                    stillnessTimer.current = null;
                    startZoom();
                }, STILL_DELAY_MS);
            },
            onPanResponderRelease: async (_evt, gestureState) => {
                setIsDragging(false);
                cleanup();
                wiggleRotation.stopAnimation();
                wiggleRotation.setValue(0);
                dragOpacity.setValue(0);

                // Smoothly fade pin icon back to gray
                Animated.timing(pinColorAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }).start();

                const screenX = gestureState.moveX;
                const screenY = gestureState.moveY;
                if (screenX === 0 && screenY === 0) return;

                try {
                    const coordinate = await mapRef.current?.coordinateForPoint({
                        x: screenX,
                        y: screenY,
                    });
                    if (coordinate) {
                        setPins((prev) => [...prev, {
                            id: Date.now().toString(),
                            latitude: coordinate.latitude,
                            longitude: coordinate.longitude,
                        }]);
                    }
                } catch (error) {
                    console.log('Could not place pin:', error);
                }
                dragPosition.setValue({ x: 0, y: 0 });
            },
        }),
    ).current;

    return (
        <View className="flex-1 bg-black">
            <StyledMapView
                ref={mapRef}
                className="w-full h-full"
                mapType={mapStyle}
                region={region}
                onRegionChange={(r) => {
                    regionRef.current = r;
                    setLiveRegion(r);
                }}
                onRegionChangeComplete={(r) => {
                    regionRef.current = r;
                    setLiveRegion(r);
                    setIsAtUserLocation(false);
                    if (!zoomActivated.current) {
                        setRegion(r);
                    }
                }}
            >
                {clusters.map((cluster) => (
                    <Marker
                        key={cluster.id}
                        coordinate={{
                            latitude: cluster.latitude,
                            longitude: cluster.longitude,
                        }}
                        anchor={{ x: 0.5, y: 1 }}
                        centerOffset={{ x: 0, y: -28 }}
                        onPress={() => {
                            if (cluster.count > 1) {
                                mapRef.current?.fitToCoordinates(
                                    cluster.pins.map((p) => ({
                                        latitude: p.latitude,
                                        longitude: p.longitude,
                                    })),
                                    {
                                        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                                        animated: true,
                                    }
                                );
                            }
                        }}
                    >
                        <FindMyPin
                            count={cluster.count}
                            latitude={cluster.latitude}
                            longitude={cluster.longitude}
                            region={liveRegion}
                        />
                    </Marker>
                ))}
            </StyledMapView>

            {/* Top Left Profile Button */}
            <View className="absolute left-4 shadow-sm shadow-black/50" style={{ top: insets.top + 8 }}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    className="w-10 h-10 rounded-full overflow-hidden border border-gray-700/50 items-center justify-center"
                >
                    <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
                    <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Floating Controls — Pin (Left) & Map Tools (Right) */}
            <Reanimated.View
                className="absolute flex-row justify-between items-end"
                style={[{ top: 0, zIndex: 10 }, floatingStyle as any]}
                pointerEvents="box-none"
            >
                {/* Drag Pin */}
                <View className="shadow-sm shadow-black/50">
                    <View
                        className="w-12 h-12 rounded-full border border-gray-700/50 overflow-hidden items-center justify-center"
                        {...panResponder.panHandlers}
                    >
                        <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
                        <Animated.View style={{ opacity: pinColorAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                            <Ionicons name="location-outline" size={24} color="#9CA3AF" />
                        </Animated.View>
                        <Animated.View style={{ position: 'absolute', opacity: pinColorAnim }}>
                            <Ionicons name="location" size={24} color="#EF4444" />
                        </Animated.View>
                    </View>
                </View>

                {/* Map Controls Pill */}
                <View className="w-12 border border-gray-700/50 rounded-[24px] overflow-hidden shadow-sm shadow-black/50">
                    <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setMapStyle(prev => prev === 'standard' ? 'hybridFlyover' : 'standard')}
                        className="w-12 h-12 items-center justify-center"
                    >
                        <Ionicons
                            name={mapStyle === 'standard' ? 'map-outline' : 'globe-outline'}
                            size={22}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>

                    <View style={{ height: 0.5, backgroundColor: 'rgba(75,85,99,0.5)' }} />

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={goToUserLocation}
                        className="w-12 h-12 items-center justify-center"
                    >
                        <Ionicons name={isAtUserLocation ? 'navigate' : 'navigate-outline'} size={22} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </Reanimated.View>

            <ReanimatedTrueSheet
                ref={sheetRef}
                name="search-sheet"
                detents={['auto', 0.33, 0.75]}
                initialDetentIndex={0}
                dismissible={false}
                detached={true}
                cornerRadius={24}
                dimmed={false}
                grabber={true}
                grabberOptions={{ color: '#4B5563' }}
                onDetentChange={handleDetentChange}
            >
                <View className="px-4 py-4">
                    <View className="flex-row items-center bg-gray-700/50 border border-gray-600/50 rounded-[20px] px-4 py-3">
                        <Ionicons name="search" size={18} color="#9CA3AF" />
                        <TextInput
                            style={{ flex: 1, color: '#fff', fontSize: 16, marginLeft: 8 }}
                            placeholder="Search..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onFocus={handleSearchFocus}
                        />
                        <TouchableOpacity activeOpacity={0.7}>
                            <Ionicons name="mic" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <Animated.View className="absolute top-[80px] left-6 right-6" style={welcomeStyle} pointerEvents="none">
                        <View className="flex-row items-center mb-1">
                            <Text className="text-white text-xl font-bold mr-2">Welcome Back, Marc</Text>
                            <HelloWave />
                        </View>
                        <Text className="text-gray-400 text-sm font-medium">Pin past journeys or explore new ones!</Text>
                    </Animated.View>
                </View>
            </ReanimatedTrueSheet>

            {
                isDragging && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                left: Animated.subtract(dragPosition.x, 28),
                                top: Animated.subtract(dragPosition.y, 60),
                                zIndex: 999,
                                opacity: dragOpacity,
                            },
                            {
                                transform: [
                                    { scale: dragScale },
                                    {
                                        rotate: wiggleRotation.interpolate({
                                            inputRange: [-1, 0, 1],
                                            outputRange: ['-3deg', '0deg', '3deg'],
                                        })
                                    },
                                ],
                            },
                        ]}
                    >
                        <FindMyPin size={56} />
                    </Animated.View>
                )
            }
        </View >
    );
}
