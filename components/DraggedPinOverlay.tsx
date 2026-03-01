import FindMyPin from '@/components/FindMyPin';
import React from 'react';
import { Animated } from 'react-native';

interface DraggedPinOverlayProps {
    dragPosition: Animated.ValueXY;
    dragOpacity: Animated.Value;
    dragScale: Animated.Value;
    wiggleRotation: Animated.Value;
}

export default function DraggedPinOverlay({
    dragPosition,
    dragOpacity,
    dragScale,
    wiggleRotation
}: DraggedPinOverlayProps) {
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: 'absolute',
                    left: Animated.subtract(dragPosition.x, 28),
                    top: Animated.subtract(dragPosition.y, 60),
                    zIndex: 999,
                    opacity: dragOpacity,
                },
                {
                    transform: [
                        { scale: dragScale },
                        {
                            rotate: wiggleRotation.interpolate({
                                inputRange: [-1, 0, 1],
                                outputRange: ['-3deg', '0deg', '3deg'],
                            })
                        },
                    ],
                },
            ]}
        >
            <FindMyPin size={56} />
        </Animated.View>
    );
}
