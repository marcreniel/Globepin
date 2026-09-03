import ProfileContent from '@/components/ProfileContent';
import React from 'react';
import { View } from 'react-native';

export default function ProfileScreen() {
    return (
        <View className="flex-1 bg-black px-4 pt-4">
            <ProfileContent />
        </View>
    );
}
