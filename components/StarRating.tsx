import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { GestureResponderEvent, View } from 'react-native';

interface StarRatingProps {
    value: number; // 0-5, in 0.5 increments
    onChange: (value: number) => void;
    size?: number;
    color?: string;
}

const STAR_COUNT = 5;

export default function StarRating({ value, onChange, size = 20, color = '#FBBF24' }: StarRatingProps) {
    const containerRef = useRef<View>(null);
    // pageX/width of the row on screen — measured (not locationX) because locationX is
    // relative to whichever star icon the touch actually lands on, not the row itself.
    const containerLayout = useRef({ x: 0, width: 0 });

    const measure = () => {
        containerRef.current?.measureInWindow((x, _y, width) => {
            containerLayout.current = { x, width };
        });
    };

    const updateFromEvent = (e: GestureResponderEvent) => {
        const { x, width } = containerLayout.current;
        if (width <= 0) return;
        const localX = e.nativeEvent.pageX - x;
        const ratio = Math.max(0, Math.min(1, localX / width));
        const stepped = Math.round(ratio * STAR_COUNT * 2) / 2;
        onChange(Math.max(0, Math.min(STAR_COUNT, stepped)));
    };

    return (
        <View
            ref={containerRef}
            className="flex-row"
            onLayout={measure}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={updateFromEvent}
            onResponderMove={updateFromEvent}
            hitSlop={8}
        >
            {Array.from({ length: STAR_COUNT }).map((_, i) => {
                const starValue = i + 1;
                const name = value >= starValue
                    ? 'star'
                    : value >= starValue - 0.5
                        ? 'star-half'
                        : 'star-outline';
                return (
                    <Ionicons key={i} name={name} size={size} color={color} style={{ marginRight: 2 }} />
                );
            })}
        </View>
    );
}
