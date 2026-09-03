import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    PanResponder,
    Platform,
    useWindowDimensions,
    View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { withUniwind } from 'uniwind';

import DraggedPinOverlay from '@/components/DraggedPinOverlay';
import FindMyPin from '@/components/FindMyPin';
import MainBottomSheet from '@/components/MainBottomSheet';
import MapFloatingControls from '@/components/MapFloatingControls';
import ProfileButton from '@/components/ProfileButton';
import useMapboxSearch, { MapboxSuggestion } from '@/hooks/useMapboxSearch';
import usePinClusters from '@/hooks/usePinClusters';
import { type TrueSheet } from '@lodev09/react-native-true-sheet';
import { useReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const StyledMapView = withUniwind(MapView);

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
    name?: string;
    notes?: string;
    dateVisited?: string;
    photos?: string[];
}

interface LocationFilter {
    name: string;
    latitude: number;
    longitude: number;
}

const DEFAULT_LOCATION_LABEL = 'Current Location';

export default function HomeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentDetentIndex, setCurrentDetentIndex] = useState(1);
    const [pins, setPins] = useState<Pin[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [mapStyle, setMapStyle] = useState<MapStyle>(isAndroid ? 'satellite' : 'hybridFlyover');
    const [region, setRegion] = useState<Region>(INITIAL_REGION);
    const [liveRegion, setLiveRegion] = useState<Region>(INITIAL_REGION);
    const [isAtUserLocation, setIsAtUserLocation] = useState(false);
    const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(null);
    const [isLocationPickerActive, setIsLocationPickerActive] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [isPinDetailActive, setIsPinDetailActive] = useState(false);
    const [pinCoordinate, setPinCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
    const [pinName, setPinName] = useState('');
    const [pinNotes, setPinNotes] = useState('');
    const [pinDateVisited, setPinDateVisited] = useState('');
    const [pinPhotos, setPinPhotos] = useState<string[]>([]);
    const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current; // tracks finger screen position
    const dragScale = useRef(new Animated.Value(0)).current;
    const wiggleRotation = useRef(new Animated.Value(0)).current;
    const dragOpacity = useRef(new Animated.Value(0)).current;
    const pinColorAnim = useRef(new Animated.Value(0)).current; // 0=gray, 1=red
    const mapRef = useRef<MapView>(null);
    const clusters = usePinClusters(pins, liveRegion);
    const { suggestions: searchSuggestions, isLoading: isSearching, retrieve } = useMapboxSearch(searchQuery, {
        proximity: locationFilter,
    });
    const { suggestions: locationSuggestions, isLoading: isLocationSearching, retrieve: retrieveLocation } = useMapboxSearch(locationQuery, {
        types: 'place,locality',
    });
    const { suggestions: nameSuggestions, isLoading: isNameSearching } = useMapboxSearch(pinName, {
        proximity: pinCoordinate,
    });
    const { height: screenHeight } = useWindowDimensions();

    const sheetRef = useRef<TrueSheet>(null);
    const currentDetentIndexRef = useRef(1);
    const preDropDetentIndex = useRef(1);
    const { animatedPosition } = useReanimatedTrueSheet();

    useEffect(() => {
        (async () => {
            // Only use the device's location if permission was already granted elsewhere
            // (e.g. the "find me" control) — don't prompt just to fill in the pill's default.
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return;

            try {
                const currentPosition = await Location.getCurrentPositionAsync({});
                const [place] = await Location.reverseGeocodeAsync({
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                });
                setLocationFilter({
                    name: place?.city || place?.subregion || place?.region || DEFAULT_LOCATION_LABEL,
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                });
            } catch {
                // ignore — pill just keeps showing the default label
            }
        })();
    }, []);

    const floatingStyle = useAnimatedStyle(() => {
        const y = animatedPosition ? animatedPosition.value : screenHeight;
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
            transform: [{ translateY: Math.min(validY - 116, screenHeight * 0.90 - 116) }],
            left: horizontalInset,
            right: horizontalInset,
        };
    });

    const welcomeStyle = useAnimatedStyle(() => {
        const y = animatedPosition ? animatedPosition.value : screenHeight;
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
        currentDetentIndexRef.current = index;
        setCurrentDetentIndex(index);
    }, []);

    const handleSearchFocus = useCallback(() => {
        // Programmatically expand the sheet to its maximum detent (index 2 which is 0.8)
        sheetRef.current?.resize(2);
    }, []);

    const handleSelectSearchResult = useCallback(async (suggestion: MapboxSuggestion) => {
        const result = await retrieve(suggestion.id);
        if (!result) return;

        const newRegion: Region = {
            latitude: result.latitude,
            longitude: result.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
        setLiveRegion(newRegion);
        setIsAtUserLocation(false);
        setSearchQuery('');
        Keyboard.dismiss();
        sheetRef.current?.resize(1);
    }, [retrieve]);

    const handleOpenLocationPicker = useCallback(() => {
        setIsLocationPickerActive(true);
        sheetRef.current?.resize(2);
    }, []);

    const handleCloseLocationPicker = useCallback(() => {
        setIsLocationPickerActive(false);
        setLocationQuery('');
        Keyboard.dismiss();
    }, []);

    const handleSelectLocation = useCallback(async (suggestion: MapboxSuggestion) => {
        const result = await retrieveLocation(suggestion.id);
        if (!result) return;

        setLocationFilter({
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
        });
        setIsLocationPickerActive(false);
        setLocationQuery('');
        Keyboard.dismiss();
        sheetRef.current?.resize(1);
    }, [retrieveLocation]);

    const handleUseCurrentLocation = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access location was denied');
            return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync({
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
        });
        setLocationFilter({
            name: place?.city || place?.subregion || place?.region || DEFAULT_LOCATION_LABEL,
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
        });
        setIsLocationPickerActive(false);
        setLocationQuery('');
        Keyboard.dismiss();
        sheetRef.current?.resize(1);
    }, []);

    const handlePinDropped = useCallback((coordinate: { latitude: number; longitude: number }) => {
        preDropDetentIndex.current = currentDetentIndexRef.current;
        setPinCoordinate(coordinate);
        setPinName('');
        setPinNotes('');
        setPinPhotos([]);
        setPinDateVisited(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        setIsPinDetailActive(true);
        sheetRef.current?.resize(0);

        // Best-effort autofill from the coordinate — never overwrite if the user has already typed.
        Location.reverseGeocodeAsync(coordinate)
            .then(([place]) => {
                const guess = place?.name || [place?.street, place?.city].filter(Boolean).join(', ');
                if (!guess) return;
                setPinName((current) => (current === '' ? guess : current));
            })
            .catch(() => {
                // ignore — user can type a name manually
            });
    }, []);

    const handleSelectNameSuggestion = useCallback((suggestion: MapboxSuggestion) => {
        setPinName(suggestion.name);
    }, []);

    const handleCancelPinDetail = useCallback(() => {
        setIsPinDetailActive(false);
        Keyboard.dismiss();
        sheetRef.current?.resize(preDropDetentIndex.current);
    }, []);

    const handleSavePinDetail = useCallback(() => {
        if (!pinCoordinate) return;
        setPins((prev) => [...prev, {
            id: Date.now().toString(),
            latitude: pinCoordinate.latitude,
            longitude: pinCoordinate.longitude,
            name: pinName.trim() || 'Untitled Pin',
            notes: pinNotes.trim(),
            dateVisited: pinDateVisited,
            photos: pinPhotos,
        }]);
        setIsPinDetailActive(false);
        Keyboard.dismiss();
        sheetRef.current?.resize(preDropDetentIndex.current);
    }, [pinCoordinate, pinName, pinNotes, pinDateVisited, pinPhotos]);

    const handlePickPinPhotos = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const remaining = 10 - pinPhotos.length;
        if (remaining <= 0) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.8,
            orderedSelection: true,
        });

        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setPinPhotos((prev) => [...prev, ...uris].slice(0, 10));
        }
    }, [pinPhotos.length]);

    const handleRemovePinPhoto = useCallback((index: number) => {
        setPinPhotos((prev) => prev.filter((_, i) => i !== index));
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
                        handlePinDropped(coordinate);
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
                onRegionChange={(r: Region) => {
                    regionRef.current = r;
                    setLiveRegion(r);
                }}
                onRegionChangeComplete={(r: Region) => {
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

            <ProfileButton />

            <MapFloatingControls
                floatingStyle={floatingStyle}
                panHandlers={panResponder.panHandlers}
                pinColorAnim={pinColorAnim}
                mapStyle={mapStyle}
                setMapStyle={setMapStyle}
                isAtUserLocation={isAtUserLocation}
                goToUserLocation={goToUserLocation}
            />

            <MainBottomSheet
                sheetRef={sheetRef}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearchFocus={handleSearchFocus}
                handleDetentChange={handleDetentChange}
                welcomeStyle={welcomeStyle}
                currentDetentIndex={currentDetentIndex}
                searchSuggestions={searchSuggestions}
                isSearching={isSearching}
                onSelectSearchResult={handleSelectSearchResult}
                locationLabel={locationFilter?.name ?? DEFAULT_LOCATION_LABEL}
                onPressLocationPill={handleOpenLocationPicker}
                isLocationPickerActive={isLocationPickerActive}
                onCloseLocationPicker={handleCloseLocationPicker}
                locationQuery={locationQuery}
                setLocationQuery={setLocationQuery}
                locationSuggestions={locationSuggestions}
                isLocationSearching={isLocationSearching}
                onSelectLocation={handleSelectLocation}
                onUseCurrentLocation={handleUseCurrentLocation}
                isPinDetailActive={isPinDetailActive}
                pinCoordinate={pinCoordinate}
                pinName={pinName}
                setPinName={setPinName}
                pinNotes={pinNotes}
                setPinNotes={setPinNotes}
                pinDateVisited={pinDateVisited}
                setPinDateVisited={setPinDateVisited}
                pinPhotos={pinPhotos}
                onPickPinPhotos={handlePickPinPhotos}
                onRemovePinPhoto={handleRemovePinPhoto}
                onSavePinDetail={handleSavePinDetail}
                onCancelPinDetail={handleCancelPinDetail}
                nameSuggestions={nameSuggestions}
                isNameSearching={isNameSearching}
                onSelectNameSuggestion={handleSelectNameSuggestion}
            />

            {isDragging && (
                <DraggedPinOverlay
                    dragPosition={dragPosition}
                    dragOpacity={dragOpacity}
                    dragScale={dragScale}
                    wiggleRotation={wiggleRotation}
                />
            )}
        </View>
    );
}
