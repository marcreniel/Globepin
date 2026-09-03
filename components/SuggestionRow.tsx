import { MapboxSuggestion } from '@/hooks/useMapboxSearch';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SuggestionRowProps {
    suggestion: MapboxSuggestion;
    onPress: () => void;
}

export default function SuggestionRow({ suggestion, onPress }: SuggestionRowProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-2 border-b border-gray-700/50"
            onPress={onPress}
        >
            <Ionicons name="location-outline" size={18} color="#9CA3AF" />
            <View className="ml-3 flex-1">
                <Text className="text-white text-sm font-medium" numberOfLines={1}>
                    {suggestion.name}
                </Text>
                {!!suggestion.placeFormatted && (
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                        {suggestion.placeFormatted}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}
