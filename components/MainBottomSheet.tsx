import { HelloWave } from '@/components/hello-wave';
import { HStack } from '@/components/ui/hstack';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated';
import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const RECENTLY_VISITED = [
    {
        name: 'Tokyo',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop',
    },
    {
        name: 'Istanbul',
        image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=400&fit=crop',
    },
    {
        name: 'Taipei',
        image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&h=400&fit=crop',
    },
    {
        name: 'Paris',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop',
    },
];

const MOST_POPULAR = [
    {
        name: 'New York',
        image: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=400&h=400&fit=crop',
    },
    {
        name: 'Rome',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=400&fit=crop',
    },
    {
        name: 'Bangkok',
        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=400&fit=crop',
    },
    {
        name: 'Sydney',
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=400&fit=crop',
    },
];

interface MainBottomSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearchFocus: () => void;
    handleDetentChange: (e: any) => void;
    welcomeStyle: any; // Animated Style
    currentDetentIndex: number;
}

export default function MainBottomSheet({
    sheetRef,
    searchQuery,
    setSearchQuery,
    handleSearchFocus,
    handleDetentChange,
    welcomeStyle,
    currentDetentIndex
}: MainBottomSheetProps) {
    return (
        <ReanimatedTrueSheet
            ref={sheetRef}
            name="search-sheet"
            detents={['auto', 0.33, 0.75]}
            initialDetentIndex={1}
            dismissible={false}
            detached={true}
            dimmed={false}
            grabber={true}
            grabberOptions={{ color: '#4B5563' }}
            className="border border-gray-700/75"
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

                {currentDetentIndex > 0 && (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                        <Animated.View className="px-2 mt-4" style={welcomeStyle} pointerEvents="none">
                            <View className="flex-row items-center mb-1">
                                <Text className="text-white text-xl font-bold mr-2">Welcome Back, Marc</Text>
                                <HelloWave />
                            </View>
                            <Text className="text-gray-400 text-sm font-medium">Pin past journeys or explore new ones!</Text>
                        </Animated.View>

                        {/* Recently Visited */}
                        <View className="mt-5 px-2">
                            <Text className="text-white text-l font-bold mb-3">
                                Recently Visited &rsaquo;
                            </Text>
                            <HStack space="sm">
                                {RECENTLY_VISITED.map((city) => (
                                    <TouchableOpacity key={city.name} activeOpacity={0.8} className="flex-1">
                                        <View className="aspect-square rounded-xl overflow-hidden">
                                            <Image
                                                source={{ uri: city.image }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text className="text-white text-xs font-medium mt-1.5">{city.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </HStack>
                        </View>

                        {currentDetentIndex === 2 && (
                            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                                {/* Your Favorites */}
                                <View className="mt-6 px-2">
                                    <Text className="text-white text-l font-bold mb-3">
                                        Your Favorites &rsaquo;
                                    </Text>
                                    <View className="aspect-4/1 rounded-xl items-center justify-center gap-0.5">
                                        <Ionicons name="star-outline" size={28} color="#6B7280" />
                                        <Text className="text-white text-sm font-semibold">No Favorites Found</Text>
                                        <Text className="text-gray-400 text-xs text-center px-6">Click on the star on your pins to favorite them!</Text>
                                    </View>
                                </View>

                                {/* Most Popular */}
                                <View className="mt-6 px-2">
                                    <Text className="text-white text-l font-bold mb-3">
                                        Most Popular &rsaquo;
                                    </Text>
                                    <HStack space="sm">
                                        {MOST_POPULAR.map((city) => (
                                            <TouchableOpacity key={city.name} activeOpacity={0.8} className="flex-1">
                                                <View className="aspect-square rounded-xl overflow-hidden">
                                                    <Image
                                                        source={{ uri: city.image }}
                                                        className="w-full h-full"
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                                <Text className="text-white text-xs font-medium mt-1.5">{city.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </HStack>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                )}
            </View>
        </ReanimatedTrueSheet>
    );
}
