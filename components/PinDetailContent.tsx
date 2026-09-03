import StarRating from '@/components/StarRating';
import SuggestionRow from '@/components/SuggestionRow';
import { MapboxSuggestion } from '@/hooks/useMapboxSearch';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export type PinVisibility = 'public' | 'private';

// The exact fill the FindMyPin marker uses (components/FindMyPin.tsx), so the
// dropdowns carry the same slight translucency the pin does. A plain color
// rather than GlassView: Liquid Glass's tint colors the blur without covering
// it, so text behind stayed readable at any alpha.
const DROPDOWN_SOLID_BG = 'rgba(30, 30, 30, 0.88)';

interface PinDetailContentProps {
    name: string;
    setName: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    dateVisited: string;
    setDateVisited: (value: string) => void;
    rating: number | null;
    setRating: (value: number | null) => void;
    visibility: PinVisibility;
    setVisibility: (value: PinVisibility) => void;
    photos: string[];
    onPickPhotos: () => void;
    onRemovePhoto: (index: number) => void;
    onSave: () => void;
    onCancel: () => void;
    nameSuggestions: MapboxSuggestion[];
    isNameSearching: boolean;
    onSelectNameSuggestion: (suggestion: MapboxSuggestion) => void;
}

function truncateTitle(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return 'Drop a Pin';
    if (trimmed.length <= 20) return trimmed;
    return `${trimmed.slice(0, 17)}...`;
}

export default function PinDetailContent({
    name,
    setName,
    notes,
    setNotes,
    dateVisited,
    setDateVisited,
    rating,
    setRating,
    visibility,
    setVisibility,
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
    const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
    const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNameFocus = () => {
        if (blurTimeout.current) clearTimeout(blurTimeout.current);
        setIsNameFocused(true);
        // Only one floating dropdown should ever be on screen at once.
        setIsVisibilityMenuOpen(false);
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

    const handleDismissOutside = () => {
        Keyboard.dismiss();
        setIsVisibilityMenuOpen(false);
    };

    const handleSelectVisibility = (value: PinVisibility) => {
        setVisibility(value);
        setIsVisibilityMenuOpen(false);
    };

    const handleToggleVisibilityMenu = () => {
        setIsVisibilityMenuOpen((isOpen) => {
            if (!isOpen) {
                // Only one floating dropdown should ever be on screen at once.
                Keyboard.dismiss();
            }
            return !isOpen;
        });
    };

    const handleToggleRating = () => {
        setRating(rating === null ? 0 : null);
    };

    const showNameDropdown = isNameFocused && name.trim().length >= 2;
    const hasRating = rating !== null;

    return (
        <View
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleDismissOutside}
        >
            {/* Header row. Explicit zIndex (inline, not a class) so the visibility
                dropdown paints above the sections declared after it — otherwise their
                translucent bg-white/8 boxes render on top and wash it out. */}
            <View className="flex-row items-center justify-between mb-5" style={{ zIndex: 30 }}>
                <TouchableOpacity
                    onPress={onCancel}
                    activeOpacity={0.7}
                    className="w-8 h-8 items-center justify-center"
                >
                    <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>

                <View className="relative">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center rounded-2xl overflow-hidden pl-2.5 pr-2 py-1.5"
                        onPress={handleToggleVisibilityMenu}
                    >
                        <GlassView style={StyleSheet.absoluteFill} colorScheme="dark" />
                        <Ionicons
                            name={visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                            size={14}
                            color="#9CA3AF"
                        />
                        <Text className="text-white text-sm font-semibold ml-1.5" numberOfLines={1}>
                            {truncateTitle(name)}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    {isVisibilityMenuOpen && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                            className="absolute top-full mt-1.5 rounded-2xl border border-gray-700/75 overflow-hidden"
                            style={{ minWidth: 150, left: 0, backgroundColor: DROPDOWN_SOLID_BG }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.7}
                                className="flex-row items-center py-3 px-2 border-b border-gray-700/50"
                                onPress={() => handleSelectVisibility('public')}
                            >
                                <Ionicons name="globe-outline" size={18} color="#9CA3AF" />
                                <Text className="text-white text-sm font-medium ml-3 flex-1">Public</Text>
                                {visibility === 'public' && (
                                    <Ionicons name="checkmark" size={14} color="#60A5FA" />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                className="flex-row items-center py-3 px-2"
                                onPress={() => handleSelectVisibility('private')}
                            >
                                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                                <Text className="text-white text-sm font-medium ml-3 flex-1">Private</Text>
                                {visibility === 'private' && (
                                    <Ionicons name="checkmark" size={14} color="#60A5FA" />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={onSave}
                    activeOpacity={0.7}
                    className="bg-blue-500 px-4 py-1.5 rounded-full"
                >
                    <Text className="text-white text-sm font-semibold">Save</Text>
                </TouchableOpacity>
            </View>

            {/* Place name */}
            <View className="mb-3 relative" style={{ zIndex: 20 }}>
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
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(150)}
                        className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl border border-gray-700/75 overflow-hidden"
                        style={{ maxHeight: 240, backgroundColor: DROPDOWN_SOLID_BG }}
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
                    </Animated.View>
                )}
            </View>

            {/* Date visited + Rating */}
            <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
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

                <View className="flex-1">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between mb-1.5"
                        onPress={handleToggleRating}
                    >
                        <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                            Rating
                        </Text>
                        <Ionicons
                            name={hasRating ? 'checkbox' : 'square-outline'}
                            size={15}
                            color={hasRating ? '#60A5FA' : '#6B7280'}
                        />
                    </TouchableOpacity>
                    <View className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3.5 items-center justify-center">
                        {hasRating ? (
                            <StarRating value={rating} onChange={setRating} size={17} />
                        ) : (
                            <View pointerEvents="none" style={{ opacity: 0.35 }}>
                                <StarRating value={0} onChange={() => {}} size={17} />
                            </View>
                        )}
                    </View>
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
                        placeholderTextColor="#9CA3AF"
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
                    <Text className="text-gray-400 text-xs">{photos.length}/10</Text>
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
                            className="bg-white/8 border border-white/10 rounded-2xl items-center justify-center"
                            style={{ width: 80, height: 80, gap: 4 }}
                        >
                            <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
                            <Text className="text-gray-400" style={{ fontSize: 10 }}>Add</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}
