import { HelloWave } from '@/components/hello-wave';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface MainBottomSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearchFocus: () => void;
    handleDetentChange: (e: any) => void;
    welcomeStyle: any; // Animated Style
}

export default function MainBottomSheet({
    sheetRef,
    searchQuery,
    setSearchQuery,
    handleSearchFocus,
    handleDetentChange,
    welcomeStyle
}: MainBottomSheetProps) {
    return (
        <ReanimatedTrueSheet
            ref={sheetRef}
            name="search-sheet"
            detents={['auto', 0.33, 0.75]}
            initialDetentIndex={1}
            dismissible={false}
            detached={true}
            cornerRadius={24}
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

                <Animated.View className="absolute top-[80px] left-6 right-6" style={welcomeStyle} pointerEvents="none">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-white text-xl font-bold mr-2">Welcome Back, Marc</Text>
                        <HelloWave />
                    </View>
                    <Text className="text-gray-400 text-sm font-medium">Pin past journeys or explore new ones!</Text>
                </Animated.View>
            </View>
        </ReanimatedTrueSheet>
    );
}
