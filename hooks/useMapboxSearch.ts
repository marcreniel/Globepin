import { useCallback, useEffect, useRef, useState } from 'react';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export interface MapboxSuggestion {
    id: string;
    name: string;
    placeFormatted: string;
}

export interface MapboxSearchResult {
    name: string;
    latitude: number;
    longitude: number;
}

function randomSessionToken() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function useMapboxSearch(query: string) {
    const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const sessionToken = useRef(randomSessionToken()).current;

    useEffect(() => {
        const trimmed = query.trim();
        if (!MAPBOX_TOKEN || trimmed.length < MIN_QUERY_LENGTH) {
            setSuggestions([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    q: trimmed,
                    access_token: MAPBOX_TOKEN,
                    session_token: sessionToken,
                    limit: '5',
                });
                const response = await fetch(`${SUGGEST_URL}?${params}`);
                const data = await response.json();
                setSuggestions(
                    (data.suggestions ?? []).map((s: any) => ({
                        id: s.mapbox_id,
                        name: s.name,
                        placeFormatted: s.place_formatted ?? s.full_address ?? '',
                    }))
                );
            } catch (error) {
                console.log('Mapbox suggest failed:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query, sessionToken]);

    const retrieve = useCallback(async (id: string): Promise<MapboxSearchResult | null> => {
        if (!MAPBOX_TOKEN) return null;
        try {
            const params = new URLSearchParams({
                access_token: MAPBOX_TOKEN,
                session_token: sessionToken,
            });
            const response = await fetch(`${RETRIEVE_URL}/${id}?${params}`);
            const data = await response.json();
            const feature = data.features?.[0];
            if (!feature) return null;
            const [longitude, latitude] = feature.geometry.coordinates;
            return {
                name: feature.properties.name,
                latitude,
                longitude,
            };
        } catch (error) {
            console.log('Mapbox retrieve failed:', error);
            return null;
        }
    }, [sessionToken]);

    return { suggestions, isLoading, retrieve };
}
