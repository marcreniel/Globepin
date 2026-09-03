import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

export default function FeedScreen() {
    return (
        <View className="flex-1 bg-black items-center justify-center gap-2">
            <Ionicons name="newspaper-outline" size={32} color="#6B7280" />
            <Text className="text-white text-base font-semibold">Feed</Text>
            <Text className="text-gray-400 text-xs">Coming soon</Text>
        </View>
    );
}
