import { getMany } from 'idb-keyval';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useAutoSavingState } from '../utils/useAutoSavingState';

interface GroupIngredients {
    [key: number]: number | null | undefined;
}

const createGroupIngredientStateContext = React.createContext<{
    stateIsLoading: boolean,
    groupName: string,
    setGroupName: (groupName: string) => void,
    groupIngredients: GroupIngredients,
    setGroupIngredients: (groupIngredients: GroupIngredients) => void,
}>(undefined as any);

export function useCreateGroupIngredientState() {
    return useContext(createGroupIngredientStateContext);
}

export const CreateGroupIngredientStateProvider: React.FC<{}> = ({ children }) => {
    const [stateIsLoading, setStateIsLoading] = useState(true);
    const [groupName, setGroupName] = useAutoSavingState('CreateGroupIngredient.groupName', '');
    const [groupIngredients, setGroupIngredients] = useAutoSavingState<GroupIngredients>('CreateGroupIngredient.groupIngredients', {});

    useEffect(
        () => {
            (async () => {
                const values =
                    await getMany<string | GroupIngredients | undefined>([
                        'CreateGroupIngredient.groupName',
                        'CreateGroupIngredient.groupIngredients',
                    ]);
                const groupName = values[0] as string | undefined;
                const groupIngredients = values[1] as GroupIngredients | undefined;
                setGroupName(groupName ?? '', true);
                setGroupIngredients(groupIngredients ?? {}, true);
                setStateIsLoading(false);
            })();
        },
        [setGroupName, setGroupIngredients]
    );

    const value = useMemo(
        () => ({
            stateIsLoading,
            groupName, setGroupName,
            groupIngredients, setGroupIngredients,
        }),
        [stateIsLoading, groupName, setGroupName, groupIngredients, setGroupIngredients]);

    return <createGroupIngredientStateContext.Provider value={value}>{children}</createGroupIngredientStateContext.Provider>;
};
