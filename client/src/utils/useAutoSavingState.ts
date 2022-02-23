import { set } from 'idb-keyval';
import { useCallback, useState } from 'react';

export function useAutoSavingState<TState>(keyToPersistWith: string, defaultState: TState) {
    const [state, setState] = useState<TState>(defaultState);

    const setPersistedValue = useCallback((newValue: TState, skipSave = false) => {
        setState(newValue);
        if (!skipSave) {
            set(keyToPersistWith, newValue);
        }
    }, [keyToPersistWith]);

    return [state, setPersistedValue] as const;
}
