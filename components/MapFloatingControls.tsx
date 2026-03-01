import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

interface MapFloatingControlsProps {
    floatingStyle: any; // Animated style
    panHandlers: any;
    pinColorAnim: Animated.Value;
    mapStyle: 'standard' | 'hybridFlyover' | 'satellite';
    setMapStyle: React.Dispatch<React.SetStateAction<'standard' | 'hybridFlyover' | 'satellite'>>;
    isAtUserLocation: boolean;
    goToUserLocation: () => void;
}

export default function MapFloatingControls({
    floatingStyle,
    panHandlers,
    pinColorAnim,
    mapStyle,
    setMapStyle,
    isAtUserLocation,
    goToUserLocation
}: MapFloatingControlsProps) {
    return (
        <Reanimated.View
            className="absolute flex-row justify-between items-end"
            style={[{ top: 0, zIndex: 10 }, floatingStyle as any]}
            pointerEvents="box-none"
        >
            {/* Drag Pin */}
            <View className="shadow-sm shadow-black/50">
                <View
                    className="w-12 h-12 rounded-full border border-gray-700/50 overflow-hidden items-center justify-center"
                    {...panHandlers}
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
    );
}
