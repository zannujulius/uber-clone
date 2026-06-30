import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Place } from "@/features/ride/types";

interface PlacesInputProps {
  placeholder: string;
  defaultValue?: string;
  onSelect: (place: Place) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  mapsReady?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

type Prediction = google.maps.places.PlacePrediction;

const isPrediction = (
  prediction: google.maps.places.PlacePrediction | null,
): prediction is Prediction => prediction !== null;

export default function PlacesInput({
  placeholder,
  defaultValue = "",
  onSelect,
  onFocus,
  autoFocus,
  mapsReady = false,
}: PlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurResolveRef = useRef(false);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);

  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [placesReady, setPlacesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initPlaces = async () => {
      if (!mapsReady || !window.google?.maps) return;

      try {
        const placesLibrary =
          (await google.maps.importLibrary(
            "places",
          )) as google.maps.PlacesLibrary;

        if (cancelled) return;

        sessionTokenRef.current ??=
          new placesLibrary.AutocompleteSessionToken();
        setPlacesReady(true);
      } catch (error) {
        console.error("Places library init error:", error);
      }
    };

    void initPlaces();

    return () => {
      cancelled = true;
    };
  }, [mapsReady]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!placesReady || !mapsReady || !open) return;

    const query = value.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const requestId = ++requestIdRef.current;

    const timeoutId = window.setTimeout(async () => {
      try {
        sessionTokenRef.current ??=
          new google.maps.places.AutocompleteSessionToken();

        const result =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: query,
              language: navigator.language,
              sessionToken: sessionTokenRef.current,
            },
          );

        if (requestId !== requestIdRef.current) return;

        setSuggestions(
          result.suggestions
            .map((suggestion) => suggestion.placePrediction)
            .filter(isPrediction),
        );
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mapsReady, open, placesReady, value]);

  const refreshPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  };

  const resetSessionToken = () => {
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
  };

  const selectResolvedPlace = (address: string, lat: number, lng: number) => {
    setValue(address);
    setSuggestions([]);
    setOpen(false);
    onSelect({ address, lat, lng });
    resetSessionToken();
  };

  const resolveTypedAddress = async (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || !window.google?.maps) return;

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: normalizedQuery });
      const firstResult = result.results[0];
      const location = firstResult?.geometry.location;

      if (!firstResult || !location) return;

      selectResolvedPlace(
        firstResult.formatted_address || normalizedQuery,
        location.lat(),
        location.lng(),
      );
    } catch (error) {
      console.error("Geocode error:", error);
    }
  };

  const handlePredictionSelect = async (prediction: Prediction) => {
    try {
      const place = prediction.toPlace();
      const result = await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });
      const resolvedPlace = result.place;
      const location = resolvedPlace.location;

      if (!location) return;

      selectResolvedPlace(
        resolvedPlace.formattedAddress ||
          resolvedPlace.displayName ||
          prediction.text.text,
        location.lat(),
        location.lng(),
      );
    } catch (error) {
      console.error("Place details error:", error);
      await resolveTypedAddress(prediction.text.text);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && open && suggestions.length > 0) {
      event.preventDefault();
      void handlePredictionSelect(suggestions[0]);
    } else if (event.key === "Enter") {
      event.preventDefault();
      void resolveTypedAddress(value);
    }

    if (event.key === "Escape") {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => setOpen(false), 200);
    if (skipBlurResolveRef.current) {
      skipBlurResolveRef.current = false;
      return;
    }

    if (value.trim()) {
      void resolveTypedAddress(value);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          refreshPos();
        }}
        onFocus={() => {
          refreshPos();
          setOpen(true);
          onFocus?.();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-transparent text-white placeholder:text-zinc-600 text-sm outline-none py-0.5 caret-accent"
      />

      {mapsReady &&
        placesReady &&
        open &&
        suggestions.length > 0 &&
        createPortal(
          <ul
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 99999,
            }}
            className="bg-elevated border border-border rounded-xl overflow-hidden shadow-2xl"
          >
            {suggestions.map((prediction) => (
              <li
                key={prediction.placeId}
                onMouseDown={(event) => {
                  event.preventDefault();
                  skipBlurResolveRef.current = true;
                  void handlePredictionSelect(prediction);
                }}
                className="flex items-start gap-3 px-4 py-3 hover:bg-card cursor-pointer transition-colors border-b border-border/40 last:border-0"
              >
                <span className="text-accent mt-0.5 shrink-0">📍</span>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {prediction.mainText?.text || prediction.text.text}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {prediction.secondaryText?.text || prediction.text.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
