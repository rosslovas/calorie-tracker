import { Alert, AlertColor, Autocomplete, Button, Container, InputAdornment, Paper, Snackbar, SnackbarCloseReason, TextField, Typography, useMediaQuery } from '@mui/material';
import assert from 'assert';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SingleIngredient } from '../model/ingredient';
import { useCreateGroupIngredientState } from '../state/create-group-ingredient-state';
import { useCreateIngredientState } from '../state/create-ingredient-state';
import Ingredients from './ingredients';

interface GroupIngredients {
    [key: number]: number | null | undefined;
}

interface AddSingleIngredient {
    kind: 'single';
    name: string;
    energyPer100g: string;
    proteinPer100g: string;
    fatPer100g: string;
    carbsPer100g: string;
    sugarPer100g: string | null;
    priceCents: number | null;
    weightGrams: number | null;
}

interface ColesNutritionInfo {
    name: string;
    energy: string;
    protein: string;
    fat: string;
    carbs: string;
    sugar: string | null;
    priceCents: number | null;
    weightGrams: number | null;
}

const CreateSingleIngredient: React.FC<{ toast: (message: string, severity: AlertColor) => void }> = (
    { toast }
) => {

    const under600 = useMediaQuery('@media screen and (max-width: 600px)');

    const {
        stateIsLoading,
        name, setName,
        energyStr, setEnergyStr,
        proteinStr, setProteinStr,
        fatStr, setFatStr,
        carbsStr, setCarbsStr,
        sugarStr, setSugarStr,
        priceStr, setPriceStr,
        weightStr, setWeightStr,
    } = useCreateIngredientState();

    const [energy, setEnergy] = useState<string | null>();
    const [protein, setProtein] = useState<string | null>();
    const [fat, setFat] = useState<string | null>();
    const [carbs, setCarbs] = useState<string | null>();
    const [sugar, setSugar] = useState<string | null>();
    const [price, setPrice] = useState<number | null>();
    const [weight, setWeight] = useState<number | null>();

    const [controlledInputs, setControlledInputs] = useState(true);

    const [colesProduct, setColesProduct] = useState('');

    const handleNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value),
        [setName]
    );

    const handleEnergyStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setEnergyStr(event.target.value),
        [setEnergyStr]
    );

    useEffect(
        () => setEnergy(
            energyStr
                ? (/^\s*\+?\d+(?:\.\d+)?\s*$/.test(energyStr)
                    ? energyStr
                    : null)
                : undefined),
        [energyStr]
    );

    const handleProteinStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setProteinStr(event.target.value),
        [setProteinStr]
    );

    useEffect(
        () => setProtein(
            proteinStr
                ? (/^\s*\+?\d+(?:\.\d+)?\s*$/.test(proteinStr)
                    ? proteinStr
                    : null)
                : undefined),
        [proteinStr]
    );

    const handleFatStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setFatStr(event.target.value),
        [setFatStr]
    );

    useEffect(
        () => setFat(
            fatStr
                ? (/^\s*\+?\d+(?:\.\d+)?\s*$/.test(fatStr)
                    ? fatStr
                    : null)
                : undefined),
        [fatStr]
    );

    const handleCarbsStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setCarbsStr(event.target.value),
        [setCarbsStr]
    );

    useEffect(
        () => setCarbs(
            carbsStr
                ? (/^\s*\+?\d+(?:\.\d+)?\s*$/.test(carbsStr)
                    ? carbsStr
                    : null)
                : undefined),
        [carbsStr]
    );

    const handleSugarStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setSugarStr(event.target.value),
        [setSugarStr]
    );

    useEffect(
        () => setSugar(
            sugarStr
                ? (/^\s*\+?\d+(?:\.\d+)?\s*$/.test(sugarStr)
                    ? sugarStr
                    : null)
                : undefined),
        [sugarStr]
    );

    const handlePriceStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setPriceStr(event.target.value),
        [setPriceStr]
    );

    useEffect(
        () => setPrice(
            priceStr
                ? (/^\s*\+?\d+(?:\.\d{1,2})?\s*$/.test(priceStr)
                    ? parseFloat(priceStr)
                    : null)
                : undefined),
        [priceStr]
    );

    const handleWeightStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setWeightStr(event.target.value),
        [setWeightStr]
    );

    useEffect(
        () => setWeight(
            weightStr
                ? (/^\s*\+?\d+\s*$/.test(weightStr)
                    ? parseInt(weightStr)
                    : null)
                : undefined),
        [weightStr]
    );

    const nameSet = !!name;
    const singleIngredientButtonDisabled = useMemo(
        () => {
            if (!nameSet) {
                return true;
            }

            return (
                typeof protein !== 'string' ||
                typeof fat !== 'string' ||
                typeof carbs !== 'string' ||
                sugar === null ||
                typeof energy !== 'string' ||
                weight === null ||
                price === null);
        },
        [nameSet, protein, fat, carbs, sugar, energy, weight, price]
    );

    const handleSingleSubmit = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            assert(
                typeof protein === 'string' &&
                typeof fat === 'string' &&
                typeof carbs === 'string' &&
                sugar !== null &&
                typeof energy === 'string' &&
                weight !== null &&
                price !== null);

            const ingredient: AddSingleIngredient = {
                kind: 'single',
                name,
                proteinPer100g: protein,
                fatPer100g: fat,
                carbsPer100g: carbs,
                sugarPer100g: sugar ?? null,
                energyPer100g: energy,
                weightGrams: weight ?? null,
                priceCents: price != null ? Math.round(price * 100) : null,
            };

            (async function (ingredient: unknown) {
                const response = await fetch('/api/ingredient', {
                    method: 'POST',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify(ingredient),
                });
                if (response.ok) {
                    toast(`Created ${name}`, 'success');

                    setName('');
                    setEnergyStr('');
                    setProteinStr('');
                    setFatStr('');
                    setCarbsStr('');
                    setSugarStr('');
                    setPriceStr('');
                    setWeightStr('');

                    setControlledInputs(true);
                }
                else {
                    toast(`${response.status} ${response.statusText}`, 'error');
                }
            })(ingredient);
        },
        [protein, fat, carbs, sugar, energy, weight, price, name, toast, setName, setEnergyStr, setProteinStr, setFatStr, setCarbsStr, setSugarStr, setPriceStr, setWeightStr]
    );

    const handleClear = useCallback(
        () => {
            setName('');
            setEnergyStr('');
            setProteinStr('');
            setFatStr('');
            setCarbsStr('');
            setSugarStr('');
            setPriceStr('');
            setWeightStr('');

            setControlledInputs(true);
        },
        [setCarbsStr, setEnergyStr, setFatStr, setName, setPriceStr, setProteinStr, setSugarStr, setWeightStr]
    );

    const handleColesProductChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setColesProduct(event.target.value);
        },
        []
    );

    const importFromColes = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            (async function () {
                const response = await fetch(`/api/coles/${encodeURIComponent(colesProduct)}`);

                if (response.ok) {
                    const data: ColesNutritionInfo = await response.json();

                    setName(data.name);
                    setEnergyStr(data.energy);
                    setProteinStr(data.protein);
                    setFatStr(data.fat);
                    setCarbsStr(data.carbs);
                    setSugarStr(data.sugar || '');
                    setPriceStr(data.priceCents != null ? String(data.priceCents / 100) : '');
                    setWeightStr(String(data.weightGrams || ''));

                    setControlledInputs(true);

                    toast(`Imported ${data.name}`, 'success');
                }
                else {
                    toast(`${response.status} ${response.statusText}`, 'error');
                }
            })();
        },
        [colesProduct, setCarbsStr, setEnergyStr, setFatStr, setName, setPriceStr, setProteinStr, setSugarStr, setWeightStr, toast]
    );

    useEffect(
        () => {
            if (controlledInputs && !stateIsLoading) {
                setControlledInputs(false);
            }
        },
        [stateIsLoading, controlledInputs]
    );

    const controlledName = controlledInputs ? name : undefined;
    const nameField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Name'
            sx={{ mx: 1.5, mt: 1.5, width: under600 ? '35ch' : '52.2ch' }}
            variant='outlined'
            InputLabelProps={{ shrink: nameSet }}
            onChange={handleNameChange}
            value={controlledName}
            defaultValue={controlledName}
        />,
        [under600, nameSet, controlledName, handleNameChange]
    );

    const controlledProtein = controlledInputs ? proteinStr : undefined;
    const proteinInvalid = protein === null;
    const proteinField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Protein/100g'
            error={proteinInvalid}
            sx={{ ml: 1.5, mt: 1.5, width: '12ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleProteinStrChange}
            value={controlledProtein}
            defaultValue={controlledProtein} />,
        [proteinInvalid, controlledProtein, handleProteinStrChange]
    );

    const controlledFat = controlledInputs ? fatStr : undefined;
    const fatInvalid = fat === null;
    const fatField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Fat/100g'
            error={fatInvalid}
            sx={{ ml: 1.5, mt: 1.5, width: '12ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleFatStrChange}
            value={controlledFat}
            defaultValue={controlledFat} />,
        [fatInvalid, controlledFat, handleFatStrChange]
    );

    const controlledCarbs = controlledInputs ? carbsStr : undefined;
    const carbsInvalid = carbs === null;
    const carbsField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Carbs/100g'
            error={carbsInvalid}
            sx={{ ml: 1.5, mt: 1.5, width: '12ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleCarbsStrChange}
            value={controlledCarbs}
            defaultValue={controlledCarbs} />,
        [carbsInvalid, controlledCarbs, handleCarbsStrChange]
    );

    const controlledSugar = controlledInputs ? sugarStr : undefined;
    const sugarInvalid = sugar === null;
    const sugarField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Sugar/100g'
            error={sugarInvalid}
            sx={{ mx: 1.5, mt: 1.5, width: '12ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleSugarStrChange}
            value={controlledSugar}
            defaultValue={controlledSugar} />,
        [sugarInvalid, controlledSugar, handleSugarStrChange]
    );

    const controlledEnergy = controlledInputs ? energyStr : undefined;
    const energyInvalid = energy === null;
    const energyField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Energy/100g'
            error={energyInvalid}
            sx={{ ml: 1.5, mt: 1.5, width: '15ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>kJ</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleEnergyStrChange}
            value={controlledEnergy}
            defaultValue={controlledEnergy} />,
        [energyInvalid, controlledEnergy, handleEnergyStrChange]
    );

    const controlledWeight = controlledInputs ? weightStr : undefined;
    const weightInvalid = weight === null;
    const weightField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Weight'
            error={weightInvalid}
            sx={{ ml: 1.5, mt: 1.5, width: '15ch' }}
            InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handleWeightStrChange}
            value={controlledWeight}
            defaultValue={controlledWeight} />,
        [weightInvalid, controlledWeight, handleWeightStrChange]
    );

    const controlledPrice = controlledInputs ? priceStr : undefined;
    const priceInvalid = price === null;
    const priceField = useMemo(
        () => <TextField
            autoComplete='off'
            label='Price'
            error={priceInvalid}
            sx={{ mx: 1.5, mt: 1.5, width: '12ch' }}
            InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
            InputLabelProps={{ shrink: true }}
            variant='outlined'
            onChange={handlePriceStrChange}
            value={controlledPrice}
            defaultValue={controlledPrice} />,
        [priceInvalid, controlledPrice, handlePriceStrChange]
    );

    const createIngredientButton = useMemo(
        () => <Button sx={{ mx: 1.5, mt: 1.5 }} variant='contained' disabled={singleIngredientButtonDisabled} onClick={handleSingleSubmit}>
            Create Ingredient
        </Button>,
        [singleIngredientButtonDisabled, handleSingleSubmit]
    );

    const clearButton = useMemo(
        () => <Button sx={{ mr: 1.5, mt: 1.5 }} variant='contained' onClick={handleClear}>
            Clear
        </Button>,
        [handleClear]
    );

    const importFromColesButtonDisabled = !colesProduct;
    const importFromColesAdornment = useMemo(
        () => ({
            endAdornment: <InputAdornment position='end'>
                <Button size='small' variant='contained' disabled={importFromColesButtonDisabled} onClick={importFromColes}>
                    Import
                </Button>
            </InputAdornment>
        }),
        [importFromColesButtonDisabled, importFromColes]
    );

    const colesImport = useMemo(
        () => <TextField
            autoComplete='off'
            label='Coles Product Code'
            sx={{ mx: 1.5, mt: 2.5, mb: 1.5, width: under600 ? '35ch' : '52.2ch' }}
            InputProps={importFromColesAdornment}
            variant='outlined'
            onChange={handleColesProductChange} />,
        [under600, importFromColesAdornment, handleColesProductChange]
    );

    return (
        <Paper className='paper' elevation={2}>
            {stateIsLoading ? undefined : <>
                {nameField}
                <br />
                {proteinField}
                {fatField}
                {(under600 && <br />) || undefined}
                {carbsField}
                {sugarField}
                <br />
                {energyField}
                {(under600 && <br />) || undefined}
                {weightField}
                {priceField}
                <br />
                {createIngredientButton}
                {clearButton}
                <br />
                {colesImport}
            </>}
        </Paper>
    );
}

const CreateGroupIngredient: React.FC<{ toast: (message: string, severity: AlertColor) => void }> = (
    { toast }
) => {

    const under600 = useMediaQuery('@media screen and (max-width: 600px)');

    const [ingredientsLoading, setIngredientsLoading] = useState(true);
    const [ingredients, setIngredients] = useState<readonly SingleIngredient[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<SingleIngredient[]>([]);

    const { stateIsLoading, groupName, setGroupName, groupIngredients, setGroupIngredients } =
        useCreateGroupIngredientState();

    const isLoading = useMemo(
        () => stateIsLoading || ingredientsLoading,
        [ingredientsLoading, stateIsLoading]);

    const previousIsLoadingRef = useRef(true);

    useEffect(
        () => {
            const previousIsLoading = previousIsLoadingRef.current;
            if (previousIsLoading && !isLoading) {
                const keys = new Set(
                    Object.keys(groupIngredients)
                        .map(k => parseInt(k)));
                const newIngredients: SingleIngredient[] = [];
                for (const ingredient of ingredients) {
                    if (keys.has(ingredient.id)) {
                        newIngredients.push(ingredient);
                        keys.delete(ingredient.id);
                    }
                }
                if (keys.size > 0) {
                    setGroupIngredients({});
                }
                else {
                    setSelectedIngredients(newIngredients);
                }
            }
            previousIsLoadingRef.current = isLoading;
        },
        [isLoading, ingredients, groupIngredients, setGroupIngredients]);

    useEffect(
        () => {
            (async () => {
                setIngredientsLoading(true);
                const response = await fetch('/api/ingredients?simple=true');
                if (response.ok) {
                    const ingredients: readonly SingleIngredient[] = await response.json();
                    setIngredients(ingredients);
                    setIngredientsLoading(false);
                }
            })();
        },
        []
    );

    const onAutocompleteChange = useCallback(
        (
            _: React.SyntheticEvent,
            value: SingleIngredient[],
            reason: 'createOption' | 'selectOption' | 'removeOption' | 'blur' | 'clear'
        ) => {
            if (reason === 'selectOption' || reason === 'removeOption' || 'clear') {
                setSelectedIngredients(value);
                const ids = value.map(i => i.id);
                setGroupIngredients(
                    ids.reduce((obj, key) =>
                        ({ ...obj, [key]: groupIngredients[key] }),
                        {}) as unknown as GroupIngredients);
            }
        },
        [groupIngredients, setGroupIngredients]
    );

    const handleGroupNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setGroupName(event.target.value),
        [setGroupName]
    );

    const handleGroupIngredientWeightStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const id = (event.target.dataset['id'] && parseInt(event.target.dataset['id'])) || undefined;
            assert(id != null);

            const value = event.target.value;
            if (/^\s*\+?\d+\s*$/.test(value)) {
                const weightGrams = parseInt(value);
                setGroupIngredients({ ...groupIngredients, [id]: weightGrams });
            }
            else {
                setGroupIngredients({ ...groupIngredients, [id]: null });
            }
        },
        [groupIngredients, setGroupIngredients]
    );

    const groupNameSet = !!groupName;
    const groupIngredientButtonDisabled = useMemo(
        () => {
            if (!groupNameSet) {
                return true;
            }

            const values = Object.values(groupIngredients);
            return values.length < 2 || values.some(i => i == null);
        },
        [groupNameSet, groupIngredients]
    );

    const handleGroupSubmit = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            const ingredient = {
                kind: 'group',
                name: groupName,
                ingredients: (Object.entries(groupIngredients) as readonly [string, number][])
                    .map(([ingredientId, weightGrams]) => ({
                        ingredientId: parseInt(ingredientId),
                        weightGrams
                    })),
            };

            (async function (ingredient: unknown) {
                const response = await fetch('/api/ingredient', {
                    method: 'POST',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify(ingredient),
                });
                if (response.ok) {
                    toast(`Created ${groupName}`, 'success');
                }
                else {
                    toast(`${response.status} ${response.statusText}`, 'error');
                }
            })(ingredient);
        },
        [groupName, groupIngredients, toast]
    );

    return (
        <Paper className='paper' elevation={2}>
            {isLoading ? undefined : <>
                <TextField
                    autoComplete='off'
                    label='Name'
                    sx={{ ml: 1.5, mt: 1.5, width: under600 ? '35ch' : '52.2ch' }}
                    variant='outlined'
                    onChange={handleGroupNameChange}
                    defaultValue={groupName}
                />
                <Autocomplete
                    multiple
                    filterSelectedOptions
                    sx={{ mx: 1.5, mt: 1.5, mb: 1, width: under600 ? '35ch' : '52.2ch' }}
                    options={ingredients}
                    value={selectedIngredients}
                    getOptionLabel={(option) => option.name}
                    renderInput={params =>
                        <TextField {...params} autoComplete='off' label='Group Ingredients' />}
                    onChange={onAutocompleteChange}
                />
                {selectedIngredients.map(ingredient => <Fragment key={ingredient.id}>
                    <TextField
                        autoComplete='off'
                        helperText={ingredient.name}
                        error={groupIngredients[ingredient.id] === null}
                        sx={{ ml: 1.5, mt: 0.5 }}
                        inputProps={{ 'data-id': ingredient.id }}
                        InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
                        InputLabelProps={{ shrink: true }}
                        variant='outlined'
                        onChange={handleGroupIngredientWeightStrChange}
                        defaultValue={groupIngredients[ingredient.id]?.toString()}
                    />
                    <br />
                </Fragment>)}
                <Button sx={{ mx: 1.5, mt: 1, mb: 1.5 }} variant='contained' disabled={groupIngredientButtonDisabled} onClick={handleGroupSubmit}>
                    Create Ingredient Group
                </Button>
            </>}
        </Paper>
    );
}

export default function CreateIngredient() {

    const [toastQueue, setToastQueue] = useState<readonly { key: number, message: string, severity: AlertColor }[]>([]);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessageInfo, setToastMessageInfo] = useState<{ key: number, message: string, severity: AlertColor }>();

    useEffect(
        () => {
            if (toastQueue.length && !toastMessageInfo) {
                // Set a new snack when we don't have an active one
                setToastMessageInfo({ ...toastQueue[0] });
                setToastQueue((prev) => prev.slice(1));
                setToastOpen(true);
            } else if (toastQueue.length && toastMessageInfo && toastOpen) {
                // Close an active snack when a new one is added
                setToastOpen(false);
            }
        },
        [toastQueue, toastMessageInfo, toastOpen]
    );

    const handleClose = useCallback(
        (_: React.SyntheticEvent<unknown, Event>, reason?: SnackbarCloseReason) => {
            if (reason === 'clickaway') {
                return;
            }
            setToastOpen(false);
        },
        []
    );

    const handleExited = useCallback(
        () => {
            setToastMessageInfo(undefined);
        },
        []
    );

    const toast = useCallback(
        (message: string, severity: AlertColor) => setToastQueue((queue) => [
            ...queue,
            { key: new Date().getTime(), message, severity }
        ]),
        []
    );

    return (
        <Container className='create-ingredient' disableGutters>
            <Typography variant='h5' sx={{ textAlign: 'center', marginBottom: '6px' }}>Create Ingredient</Typography>
            <CreateSingleIngredient toast={toast} />
            <br />
            <CreateGroupIngredient toast={toast} />
            <Snackbar
                key={toastMessageInfo ? toastMessageInfo.key : undefined}
                open={toastOpen}
                autoHideDuration={6000}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
            >
                <Alert onClose={handleClose} severity={toastMessageInfo ? toastMessageInfo.severity : undefined} sx={{ width: '100%' }}>
                    {toastMessageInfo ? toastMessageInfo.message : undefined}
                </Alert>
            </Snackbar>
        </Container>
    );
}
