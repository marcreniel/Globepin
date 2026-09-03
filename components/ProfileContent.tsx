import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const MOCK_PINS = [
    { id: '1', name: 'Shibuya Crossing', country: 'Japan', emoji: '🇯🇵', date: 'Mar 2024' },
    { id: '2', name: 'Hagia Sophia', country: 'Turkey', emoji: '🇹🇷', date: 'Jan 2024' },
    { id: '3', name: 'Colosseum', country: 'Italy', emoji: '🇮🇹', date: 'Nov 2023' },
    { id: '4', name: 'Eiffel Tower', country: 'France', emoji: '🇫🇷', date: 'Sep 2023' },
    { id: '5', name: 'Santorini Caldera', country: 'Greece', emoji: '🇬🇷', date: 'Jul 2023' },
    { id: '6', name: 'Angkor Wat', country: 'Cambodia', emoji: '🇰🇭', date: 'Apr 2023' },
];

// Presentational only — no sheet of its own. Lives inside MainBottomSheet's
// Profile tab, so it scrolls within whatever height that sheet gives it.
export default function ProfileContent() {
    return (
        <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
        >
            {/* Header */}
            <View className="pt-2 pb-5">
                <View className="absolute top-0 right-0 z-10">
                    <TouchableOpacity activeOpacity={0.7} className="w-8 h-8 rounded-full items-center justify-center">
                        <Ionicons name="settings-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View className="items-center">
                    <View className="w-20 h-20 rounded-full bg-gray-600 items-center justify-center mb-4 border-2 border-gray-500/20">
                        <Ionicons name="person-circle-outline" size={56} color="#9CA3AF" />
                    </View>

                    <Text className="text-white text-xl font-bold mb-0.5">Marc Explorer</Text>
                    <Text className="text-gray-400 text-sm">@marcexplorer</Text>
                </View>
            </View>

            {/* Stats row */}
            <View className="flex-row mb-6 rounded-2xl bg-white/8 border border-white/10 overflow-hidden">
                <View className="flex-1 items-center py-4">
                    <Text className="text-white text-2xl font-bold">47</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Places Pinned</Text>
                </View>

                <View className="w-px bg-gray-700 my-3" />

                <View className="flex-1 items-center py-4">
                    <Text className="text-white text-2xl font-bold">23</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Countries</Text>
                </View>

                <View className="w-px bg-gray-700 my-3" />

                <View className="flex-1 items-center py-4">
                    <Text className="text-white text-2xl font-bold">8</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Continents</Text>
                </View>
            </View>

            {/* Recent Pins */}
            <Text className="text-white text-base font-semibold mb-3">Recent Pins</Text>

            <View className="rounded-2xl bg-white/8 border border-white/10 overflow-hidden">
                {MOCK_PINS.map((pin, index) => (
                    <View key={pin.id}>
                        <View className="flex-row items-center px-4 py-3">
                            <Text className="text-2xl mr-3">{pin.emoji}</Text>
                            <View className="flex-1">
                                <Text className="text-white text-sm font-medium">{pin.name}</Text>
                                <Text className="text-gray-400 text-xs">{pin.country}</Text>
                            </View>
                            <Text className="text-gray-500 text-xs">{pin.date}</Text>
                        </View>
                        {index < MOCK_PINS.length - 1 && (
                            <View className="h-px bg-gray-700/60 ml-14" />
                        )}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
