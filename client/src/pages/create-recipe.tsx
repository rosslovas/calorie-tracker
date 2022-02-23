import { Alert, AlertColor, Autocomplete, Button, Container, InputAdornment, Paper, Snackbar, SnackbarCloseReason, TextField, Typography, useMediaQuery } from '@mui/material';
import assert from 'assert';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Ingredient } from '../model/ingredient';

interface AddRecipeIngredient {
    kind: 'single' | 'group';
    id: number;
    weightGrams: number;
}

interface RecipeIngredients {
    [key: `${'single' | 'group'}${number}`]: AddRecipeIngredient | 'invalid' | undefined;
}

const CreateRecipeForm: React.FC<{ toast: (message: string, severity: AlertColor) => void }> = (
    { toast }
) => {

    const under600 = useMediaQuery('@media screen and (max-width: 600px)');

    const [recipeName, setRecipeName] = useState('');
    const [ingredients, setIngredients] = useState<readonly Ingredient[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<readonly Ingredient[]>([]);
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredients>({});

    useEffect(
        () => {
            (async () => {
                const response = await fetch('/api/ingredients');
                if (response.ok) {
                    setIngredients(await response.json());
                }
            })();
        },
        []
    );

    const onAutocompleteChange = useCallback(
        (
            _: React.SyntheticEvent,
            value: readonly Ingredient[],
            reason: 'createOption' | 'selectOption' | 'removeOption' | 'blur' | 'clear'
        ) => {
            if (reason === 'selectOption' || reason === 'removeOption' || 'clear') {
                setSelectedIngredients(value);
                setRecipeIngredients(
                    value.reduce(
                        (obj, ingredient) => {
                            const key = `${ingredient.kind}${ingredient.id}` as const;
                            return { ...obj, [key]: recipeIngredients[key], };
                        },
                        {}) as unknown as RecipeIngredients);
            }
        },
        [recipeIngredients]
    );

    const handleRecipeNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setRecipeName(event.target.value),
        []
    );

    const handleRecipeIngredientWeightStrChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const kind = event.target.dataset['kind'] || undefined as 'single' | 'group' | undefined;
            const id = (event.target.dataset['id'] && parseInt(event.target.dataset['id'])) || undefined;
            assert(kind != null);
            assert(id != null);

            const value = event.target.value;
            if (/^\s*\+?\d+\s*$/.test(value)) {
                const weightGrams = parseInt(value);
                setRecipeIngredients(value => ({ ...value, [`${kind}${id}`]: { kind, id, weightGrams } }));
            }
            else {
                setRecipeIngredients(value => ({ ...value, [`${kind}${id}`]: 'invalid' }));
            }
        },
        []
    );

    const recipeNameSet = !!recipeName;
    const createRecipeButtonDisabled = useMemo(
        () => {
            if (!recipeNameSet) {
                return true;
            }

            const values = Object.values(recipeIngredients);
            return values.length < 1 || values.some(i => i === 'invalid' || i == null);
        },
        [recipeNameSet, recipeIngredients]
    );

    const handleRecipeSubmit = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            const recipe = {
                name: recipeName,
                ingredients: (Object.entries(recipeIngredients) as readonly [string, AddRecipeIngredient][])
                    .map(([, ingredient]) => ({
                        kind: ingredient.kind,
                        [ingredient.kind === 'single' ? 'ingredientId' : 'ingredientGroupId']: ingredient.id,
                        weightGrams: ingredient.weightGrams
                    })),
            };

            (async function (recipe: unknown) {
                const response = await fetch('/api/recipe', {
                    method: 'POST',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify(recipe),
                });
                if (response.ok) {
                    toast(`Created ${recipeName}`, 'success');
                }
                else {
                    toast(`${response.status} ${response.statusText}`, 'error');
                }
            })(recipe);
        },
        [recipeName, recipeIngredients, toast]
    );

    return (
        <Paper className='paper' elevation={2}>
            <TextField
                label='Name'
                sx={{ ml: 1.5, mt: 1.5, width: under600 ? '35ch' : '52.2ch' }}
                variant='outlined'
                onChange={handleRecipeNameChange}
            />
            <Autocomplete
                multiple
                filterSelectedOptions
                sx={{ mx: 1.5, mt: 1.5, mb: 1, width: under600 ? '35ch' : '52.2ch' }}
                options={ingredients}
                getOptionLabel={(option) => option.name}
                renderInput={params =>
                    <TextField {...params} label='Recipe Ingredients' />}
                onChange={onAutocompleteChange}
            />
            {selectedIngredients.map(ingredient => <Fragment key={ingredient.id}>
                <TextField
                    helperText={ingredient.name}
                    error={recipeIngredients[`${ingredient.kind}${ingredient.id}`] === 'invalid'}
                    sx={{ ml: 1.5, mt: 0.5 }}
                    inputProps={{ 'data-kind': ingredient.kind, 'data-id': ingredient.id }}
                    InputProps={{ endAdornment: <InputAdornment position='end'>g</InputAdornment> }}
                    InputLabelProps={{ shrink: true }}
                    variant='outlined'
                    onChange={handleRecipeIngredientWeightStrChange}
                />
                <br />
            </Fragment>)}
            <Button sx={{ mx: 1.5, mt: 1, mb: 1.5 }} variant='contained' disabled={createRecipeButtonDisabled} onClick={handleRecipeSubmit}>
                Create Recipe
            </Button>
        </Paper>
    );
}

export default function CreateRecipe() {

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
        <Container className='create-recipe' disableGutters>
            <Typography variant='h5' sx={{ textAlign: 'center', marginBottom: '6px' }}>Create Recipe</Typography>
            <CreateRecipeForm toast={toast} />
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
