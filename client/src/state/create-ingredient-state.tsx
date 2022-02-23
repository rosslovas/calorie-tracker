import { getMany } from 'idb-keyval';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useAutoSavingState } from '../utils/useAutoSavingState';

const createIngredientStateContext = React.createContext<{
    stateIsLoading: boolean,
    name: string,
    setName: (name: string) => void,
    energyStr: string,
    setEnergyStr: (energyStr: string) => void,
    proteinStr: string,
    setProteinStr: (proteinStr: string) => void,
    fatStr: string,
    setFatStr: (fatStr: string) => void,
    carbsStr: string,
    setCarbsStr: (carbsStr: string) => void,
    sugarStr: string,
    setSugarStr: (sugarStr: string) => void,
    priceStr: string,
    setPriceStr: (priceStr: string) => void,
    weightStr: string,
    setWeightStr: (weightStr: string) => void,
}>(undefined as any);

export function useCreateIngredientState() {
    return useContext(createIngredientStateContext);
}

export const CreateIngredientStateProvider: React.FC<{}> = ({ children }) => {
    const [stateIsLoading, setStateIsLoading] = useState(true);
    const [name, setName] = useAutoSavingState('CreateSingleIngredient.name', '');
    const [energyStr, setEnergyStr] = useAutoSavingState('CreateSingleIngredient.energyStr', '');
    const [proteinStr, setProteinStr] = useAutoSavingState('CreateSingleIngredient.proteinStr', '');
    const [fatStr, setFatStr] = useAutoSavingState('CreateSingleIngredient.fatStr', '');
    const [carbsStr, setCarbsStr] = useAutoSavingState('CreateSingleIngredient.carbsStr', '');
    const [sugarStr, setSugarStr] = useAutoSavingState('CreateSingleIngredient.sugarStr', '');
    const [priceStr, setPriceStr] = useAutoSavingState('CreateSingleIngredient.priceStr', '');
    const [weightStr, setWeightStr] = useAutoSavingState('CreateSingleIngredient.weightStr', '');

    useEffect(
        () => {
            (async () => {
                const [name, energyStr, proteinStr, fatStr, carbsStr, sugarStr, priceStr, weightStr] =
                    await getMany<string | undefined>([
                        'CreateSingleIngredient.name',
                        'CreateSingleIngredient.energyStr',
                        'CreateSingleIngredient.proteinStr',
                        'CreateSingleIngredient.fatStr',
                        'CreateSingleIngredient.carbsStr',
                        'CreateSingleIngredient.sugarStr',
                        'CreateSingleIngredient.priceStr',
                        'CreateSingleIngredient.weightStr',
                    ]);
                setName(name ?? '', true);
                setEnergyStr(energyStr ?? '', true);
                setProteinStr(proteinStr ?? '', true);
                setFatStr(fatStr ?? '', true);
                setCarbsStr(carbsStr ?? '', true);
                setSugarStr(sugarStr ?? '', true);
                setPriceStr(priceStr ?? '', true);
                setWeightStr(weightStr ?? '', true);
                setStateIsLoading(false);
            })();
        },
        [setCarbsStr, setEnergyStr, setFatStr, setName, setPriceStr, setProteinStr, setSugarStr, setWeightStr]
    );

    const value = useMemo(
        () => ({
            stateIsLoading,
            name, setName,
            energyStr, setEnergyStr,
            proteinStr, setProteinStr,
            fatStr, setFatStr,
            carbsStr, setCarbsStr,
            sugarStr, setSugarStr,
            priceStr, setPriceStr,
            weightStr, setWeightStr,
        }),
        [carbsStr, energyStr, fatStr, stateIsLoading, name, priceStr, proteinStr, setCarbsStr, setEnergyStr, setFatStr, setName, setPriceStr, setProteinStr, setSugarStr, setWeightStr, sugarStr, weightStr]);

    return <createIngredientStateContext.Provider value={value}>{children}</createIngredientStateContext.Provider>;
};
