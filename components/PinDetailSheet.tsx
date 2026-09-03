import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export interface PinDetails {
    name: string;
    notes: string;
    dateVisited: string;
    latitude: number;
    longitude: number;
    photos: string[];
}

export interface PinDetailSheetHandle {
    present: (coordinate: { latitude: number; longitude: number }) => void;
    dismiss: () => void;
}

interface PinDetailSheetProps {
    onSave: (details: PinDetails) => void;
    onCancel?: () => void;
}

const PinDetailSheet = forwardRef<PinDetailSheetHandle, PinDetailSheetProps>(
    ({ onSave, onCancel }, ref) => {
        const sheetRef = useRef<TrueSheet>(null);
        const coordinateRef = useRef<{ latitude: number; longitude: number } | null>(null);

        const [name, setName] = useState('');
        const [notes, setNotes] = useState('');
        const [photos, setPhotos] = useState<string[]>([]);
        const [dateVisited, setDateVisited] = useState(() => {
            const now = new Date();
            return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        });

        useImperativeHandle(ref, () => ({
            present: (coordinate) => {
                coordinateRef.current = coordinate;
                setName('');
                setNotes('');
                setPhotos([]);
                setDateVisited(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                sheetRef.current?.present();
            },
            dismiss: () => sheetRef.current?.dismiss(),
        }));

        const handleSave = () => {
            if (!coordinateRef.current) return;
            Keyboard.dismiss();
            onSave({
                name: name.trim() || 'Untitled Pin',
                notes: notes.trim(),
                dateVisited,
                photos,
                latitude: coordinateRef.current.latitude,
                longitude: coordinateRef.current.longitude,
            });
            sheetRef.current?.dismiss();
        };

        const handleCancel = () => {
            Keyboard.dismiss();
            onCancel?.();
            sheetRef.current?.dismiss();
        };

        const handlePickPhotos = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;

            const remaining = 10 - photos.length;
            if (remaining <= 0) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: remaining,
                quality: 0.8,
                orderedSelection: true,
            });

            if (!result.canceled) {
                const uris = result.assets.map((a) => a.uri);
                setPhotos((prev) => [...prev, ...uris].slice(0, 10));
            }
        };

        const handleRemovePhoto = (index: number) => {
            setPhotos((prev) => prev.filter((_, i) => i !== index));
        };

        const coord = coordinateRef.current;

        return (
            <TrueSheet
                ref={sheetRef}
                detents={['auto']}
                cornerRadius={24}
                grabber
                grabberOptions={{ color: '#4B5563' }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View className="px-5 pt-4 pb-8">
                        {/* Header row */}
                        <View className="flex-row items-center justify-between mb-5">
                            <TouchableOpacity
                                onPress={handleCancel}
                                activeOpacity={0.7}
                                className="w-8 h-8 items-center justify-center"
                            >
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>

                            <Text className="text-white text-base font-semibold">Drop a Pin</Text>

                            <TouchableOpacity
                                onPress={handleSave}
                                activeOpacity={0.7}
                                className="bg-blue-500 px-4 py-1.5 rounded-full"
                            >
                                <Text className="text-white text-sm font-semibold">Save</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Coordinate badge */}
                        {coord && (
                            <View className="flex-row items-center gap-1.5 mb-4">
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <Text className="text-gray-500 text-xs">
                                    {coord.latitude.toFixed(5)}, {coord.longitude.toFixed(5)}
                                </Text>
                            </View>
                        )}

                        {/* Place name */}
                        <View className="mb-3">
                            <Text className="text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                                Place Name
                            </Text>
                            <View className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3.5">
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Eiffel Tower"
                                    placeholderTextColor="#4B5563"
                                    style={{ color: '#fff', fontSize: 15 }}
                                    returnKeyType="next"
                                    autoCapitalize="words"
                                />
                            </View>
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
                                            onPress={() => handleRemovePhoto(index)}
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
                                        onPress={handlePickPhotos}
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
                </KeyboardAvoidingView>
            </TrueSheet>
        );
    }
);

PinDetailSheet.displayName = 'PinDetailSheet';

export default PinDetailSheet;
