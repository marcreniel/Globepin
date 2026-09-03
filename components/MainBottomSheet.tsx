import { HelloWave } from '@/components/hello-wave';
import PinDetailContent, { PinVisibility } from '@/components/PinDetailContent';
import SuggestionRow from '@/components/SuggestionRow';
import { HStack } from '@/components/ui/hstack';
import { MapboxSuggestion } from '@/hooks/useMapboxSearch';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated';
import React from 'react';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

interface MainBottomSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearchFocus: () => void;
    handleDetentChange: (e: any) => void;
    welcomeStyle: any; // Animated Style
    currentDetentIndex: number;
    searchSuggestions: MapboxSuggestion[];
    isSearching: boolean;
    onSelectSearchResult: (suggestion: MapboxSuggestion) => void;
    locationLabel: string;
    onPressLocationPill: () => void;
    isLocationPickerActive: boolean;
    onCloseLocationPicker: () => void;
    locationQuery: string;
    setLocationQuery: (query: string) => void;
    locationSuggestions: MapboxSuggestion[];
    isLocationSearching: boolean;
    onSelectLocation: (suggestion: MapboxSuggestion) => void;
    onUseCurrentLocation: () => void;
    isPinDetailActive: boolean;
    pinName: string;
    setPinName: (value: string) => void;
    pinNotes: string;
    setPinNotes: (value: string) => void;
    pinDateVisited: string;
    setPinDateVisited: (value: string) => void;
    pinRating: number | null;
    setPinRating: (value: number | null) => void;
    pinVisibility: PinVisibility;
    setPinVisibility: (value: PinVisibility) => void;
    pinPhotos: string[];
    onPickPinPhotos: () => void;
    onRemovePinPhoto: (index: number) => void;
    onSavePinDetail: () => void;
    onCancelPinDetail: () => void;
    nameSuggestions: MapboxSuggestion[];
    isNameSearching: boolean;
    onSelectNameSuggestion: (suggestion: MapboxSuggestion) => void;
}

export default function MainBottomSheet({
    sheetRef,
    searchQuery,
    setSearchQuery,
    handleSearchFocus,
    handleDetentChange,
    welcomeStyle,
    currentDetentIndex,
    searchSuggestions,
    isSearching,
    onSelectSearchResult,
    locationLabel,
    onPressLocationPill,
    isLocationPickerActive,
    onCloseLocationPicker,
    locationQuery,
    setLocationQuery,
    locationSuggestions,
    isLocationSearching,
    onSelectLocation,
    onUseCurrentLocation,
    isPinDetailActive,
    pinName,
    setPinName,
    pinNotes,
    setPinNotes,
    pinDateVisited,
    setPinDateVisited,
    pinRating,
    setPinRating,
    pinVisibility,
    setPinVisibility,
    pinPhotos,
    onPickPinPhotos,
    onRemovePinPhoto,
    onSavePinDetail,
    onCancelPinDetail,
    nameSuggestions,
    isNameSearching,
    onSelectNameSuggestion,
}: MainBottomSheetProps) {
    const isSearchActive = searchQuery.trim().length > 0;
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
                {isPinDetailActive && (
                    <PinDetailContent
                        name={pinName}
                        setName={setPinName}
                        notes={pinNotes}
                        setNotes={setPinNotes}
                        dateVisited={pinDateVisited}
                        setDateVisited={setPinDateVisited}
                        rating={pinRating}
                        setRating={setPinRating}
                        visibility={pinVisibility}
                        setVisibility={setPinVisibility}
                        photos={pinPhotos}
                        onPickPhotos={onPickPinPhotos}
                        onRemovePhoto={onRemovePinPhoto}
                        onSave={onSavePinDetail}
                        onCancel={onCancelPinDetail}
                        nameSuggestions={nameSuggestions}
                        isNameSearching={isNameSearching}
                        onSelectNameSuggestion={onSelectNameSuggestion}
                    />
                )}

                {!isPinDetailActive && (<>
                {isLocationPickerActive ? (
                    // Same treatment as the PinDetailContent fields (Place Name, Date, Notes).
                    // Deliberately not a nested GlassView: the sheet is already a glass
                    // surface, and a second blur stacked on it composites into a visibly
                    // different material. A flat tint stays consistent with the form fields.
                    <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/8 overflow-hidden px-4 py-3">
                        <TouchableOpacity activeOpacity={0.7} onPress={onCloseLocationPicker} hitSlop={8}>
                            <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        <TextInput
                            style={{ flex: 1, color: '#fff', fontSize: 16, marginLeft: 8 }}
                            placeholder="Search city or town..."
                            placeholderTextColor="#9CA3AF"
                            value={locationQuery}
                            onChangeText={setLocationQuery}
                            returnKeyType="search"
                            autoFocus
                        />
                    </View>
                ) : (
                    <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/8 overflow-hidden pl-1.5 pr-4 py-1.5">
                        <TouchableOpacity
                            activeOpacity={0.7}
                            className="flex-row items-center rounded-2xl overflow-hidden pl-2.5 pr-2 py-2 mr-2 bg-white/10"
                            onPress={onPressLocationPill}
                        >
                            <Ionicons name="location" size={14} color="#9CA3AF" />
                            <Text
                                className="text-white text-xs font-semibold ml-1"
                                numberOfLines={1}
                                style={{ maxWidth: 96 }}
                            >
                                {locationLabel}
                            </Text>
                            <Ionicons name="chevron-down" size={12} color="#9CA3AF" style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                        <View className="w-px h-5 bg-gray-600/50 mr-2" />
                        <TextInput
                            style={{ flex: 1, color: '#fff', fontSize: 16 }}
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
                )}

                {isLocationPickerActive && currentDetentIndex > 0 && (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} className="mt-3">
                        <TouchableOpacity
                            activeOpacity={0.7}
                            className="flex-row items-center py-3 px-2 border-b border-gray-700/50"
                            onPress={onUseCurrentLocation}
                        >
                            <Ionicons name="navigate" size={18} color="#60A5FA" />
                            <Text className="text-white text-sm font-medium ml-3">Use Current Location</Text>
                        </TouchableOpacity>

                        {locationQuery.trim().length > 0 && (
                            <>
                                {isLocationSearching && locationSuggestions.length === 0 && (
                                    <View className="flex-row items-center px-2 py-4">
                                        <ActivityIndicator size="small" color="#9CA3AF" />
                                        <Text className="text-gray-400 text-sm ml-2">Searching...</Text>
                                    </View>
                                )}
                                {!isLocationSearching && locationSuggestions.length === 0 && (
                                    <Text className="text-gray-400 text-sm px-2 py-4">No results found</Text>
                                )}
                                {locationSuggestions.map((suggestion) => (
                                    <SuggestionRow
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        onPress={() => onSelectLocation(suggestion)}
                                    />
                                ))}
                            </>
                        )}
                    </Animated.View>
                )}

                {!isLocationPickerActive && isSearchActive && currentDetentIndex > 0 && (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} className="mt-3">
                        {isSearching && searchSuggestions.length === 0 && (
                            <View className="flex-row items-center px-2 py-4">
                                <ActivityIndicator size="small" color="#9CA3AF" />
                                <Text className="text-gray-400 text-sm ml-2">Searching...</Text>
                            </View>
                        )}
                        {!isSearching && searchSuggestions.length === 0 && (
                            <Text className="text-gray-400 text-sm px-2 py-4">No results found</Text>
                        )}
                        {searchSuggestions.map((suggestion) => (
                            <SuggestionRow
                                key={suggestion.id}
                                suggestion={suggestion}
                                onPress={() => onSelectSearchResult(suggestion)}
                            />
                        ))}
                    </Animated.View>
                )}

                {!isLocationPickerActive && !isSearchActive && currentDetentIndex > 0 && (
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
                            </Animated.View>
                        )}
                    </Animated.View>
                )}
                </>)}
            </View>
        </ReanimatedTrueSheet>
    );
}
