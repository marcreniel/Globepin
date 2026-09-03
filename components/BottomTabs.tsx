import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type AppTab = 'home' | 'feed' | 'profile';

const TABS: { key: AppTab; label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { key: 'feed', label: 'Feed', icon: 'newspaper', iconOutline: 'newspaper-outline' },
    { key: 'profile', label: 'Profile', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

interface BottomTabsProps {
    activeTab: AppTab;
    onSelectTab: (tab: AppTab) => void;
}

export default function BottomTabs({ activeTab, onSelectTab }: BottomTabsProps) {
    return (
        <View className="flex-row items-center rounded-full overflow-hidden border border-white/10 mt-4">
            <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
            {TABS.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.7}
                        className="flex-1 items-center py-2"
                        onPress={() => onSelectTab(tab.key)}
                    >
                        <Ionicons
                            name={isActive ? tab.icon : tab.iconOutline}
                            size={20}
                            color={isActive ? '#fff' : '#9CA3AF'}
                        />
                        <Text
                            className={isActive ? 'text-white text-[10px] font-semibold mt-0.5' : 'text-gray-400 text-[10px] mt-0.5'}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
