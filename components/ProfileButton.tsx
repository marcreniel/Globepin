import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileButton() {
    const insets = useSafeAreaInsets();
    return (
        <View className="absolute left-4 shadow-sm shadow-black/50" style={{ top: insets.top + 8 }}>
            <TouchableOpacity
                activeOpacity={0.7}
                className="w-10 h-10 rounded-full overflow-hidden border border-gray-700/50 items-center justify-center"
            >
                <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
                <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
            </TouchableOpacity>
        </View>
    );
}
