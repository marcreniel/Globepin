import SuggestionRow from '@/components/SuggestionRow';
import { MapboxSuggestion } from '@/hooks/useMapboxSearch';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PinDetailContentProps {
    coordinate: { latitude: number; longitude: number } | null;
    name: string;
    setName: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    dateVisited: string;
    setDateVisited: (value: string) => void;
    photos: string[];
    onPickPhotos: () => void;
    onRemovePhoto: (index: number) => void;
    onSave: () => void;
    onCancel: () => void;
    nameSuggestions: MapboxSuggestion[];
    isNameSearching: boolean;
    onSelectNameSuggestion: (suggestion: MapboxSuggestion) => void;
}

export default function PinDetailContent({
    coordinate,
    name,
    setName,
    notes,
    setNotes,
    dateVisited,
    setDateVisited,
    photos,
    onPickPhotos,
    onRemovePhoto,
    onSave,
    onCancel,
    nameSuggestions,
    isNameSearching,
    onSelectNameSuggestion,
}: PinDetailContentProps) {
    const [isNameFocused, setIsNameFocused] = useState(false);
    const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNameFocus = () => {
        if (blurTimeout.current) clearTimeout(blurTimeout.current);
        setIsNameFocused(true);
    };

    const handleNameBlur = () => {
        // Delay so a tap on a suggestion row still registers before the list unmounts.
        blurTimeout.current = setTimeout(() => setIsNameFocused(false), 150);
    };

    const handleSelectSuggestion = (suggestion: MapboxSuggestion) => {
        if (blurTimeout.current) clearTimeout(blurTimeout.current);
        setIsNameFocused(false);
        onSelectNameSuggestion(suggestion);
    };

    const showNameDropdown = isNameFocused && name.trim().length >= 2;

    return (
        <View>
            {/* Header row */}
            <View className="flex-row items-center justify-between mb-5">
                <TouchableOpacity
                    onPress={onCancel}
                    activeOpacity={0.7}
                    className="w-8 h-8 items-center justify-center"
                >
                    <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>

                <Text className="text-white text-base font-semibold">Drop a Pin</Text>

                <TouchableOpacity
                    onPress={onSave}
                    activeOpacity={0.7}
                    className="bg-blue-500 px-4 py-1.5 rounded-full"
                >
                    <Text className="text-white text-sm font-semibold">Save</Text>
                </TouchableOpacity>
            </View>

            {/* Coordinate badge */}
            {coordinate && (
                <View className="flex-row items-center gap-1.5 mb-4">
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-xs">
                        {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
                    </Text>
                </View>
            )}

            {/* Place name */}
            <View className="mb-3 relative z-20">
                <Text className="text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                    Place Name
                </Text>
                <View className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3.5">
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        onFocus={handleNameFocus}
                        onBlur={handleNameBlur}
                        placeholder="e.g. Eiffel Tower"
                        placeholderTextColor="#4B5563"
                        style={{ color: '#fff', fontSize: 15 }}
                        returnKeyType="next"
                        autoCapitalize="words"
                    />
                </View>

                {showNameDropdown && (
                    <View
                        className="absolute left-0 right-0 top-full mt-1.5 bg-gray-900 border border-gray-700/75 rounded-2xl overflow-hidden"
                        style={{ maxHeight: 240 }}
                    >
                        {isNameSearching && nameSuggestions.length === 0 && (
                            <View className="flex-row items-center px-3 py-3">
                                <ActivityIndicator size="small" color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs ml-2">Searching...</Text>
                            </View>
                        )}
                        {!isNameSearching && nameSuggestions.length === 0 && (
                            <Text className="text-gray-500 text-xs px-3 py-3">No matches found</Text>
                        )}
                        {nameSuggestions.map((suggestion) => (
                            <SuggestionRow
                                key={suggestion.id}
                                suggestion={suggestion}
                                onPress={() => handleSelectSuggestion(suggestion)}
                            />
                        ))}
                    </View>
                )}
            </View>

            {/* Date visited */}
            <View className="mb-3">
                <Text className="text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                    Date Visited
                </Text>
                <View className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3.5 flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <TextInput
                        value={dateVisited}
                        onChangeText={setDateVisited}
                        placeholder="e.g. Feb 28, 2026"
                        placeholderTextColor="#4B5563"
                        style={{ color: '#fff', fontSize: 15, flex: 1 }}
                        returnKeyType="next"
                    />
                </View>
            </View>

            {/* Notes */}
            <View className="mb-3">
                <Text className="text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                    Notes
                </Text>
                <View className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3.5">
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any memories about this place..."
                        placeholderTextColor="#4B5563"
                        style={{ color: '#fff', fontSize: 15, minHeight: 72, textAlignVertical: 'top' }}
                        multiline
                        returnKeyType="done"
                        blurOnSubmit
                    />
                </View>
            </View>

            {/* Photos */}
            <View>
                <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                        Photos
                    </Text>
                    <Text className="text-gray-600 text-xs">{photos.length}/10</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                >
                    {photos.map((uri, index) => (
                        <View key={uri + index} className="relative">
                            <Image
                                source={{ uri }}
                                style={{ width: 80, height: 80, borderRadius: 12 }}
                            />
                            <TouchableOpacity
                                onPress={() => onRemovePhoto(index)}
                                activeOpacity={0.8}
                                style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: 10,
                                    width: 20,
                                    height: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {photos.length < 10 && (
                        <TouchableOpacity
                            onPress={onPickPhotos}
                            activeOpacity={0.7}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: '#374151',
                                borderStyle: 'dashed',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                            }}
                        >
                            <Ionicons name="camera-outline" size={22} color="#4B5563" />
                            <Text style={{ color: '#4B5563', fontSize: 10 }}>Add</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}
