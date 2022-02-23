import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, Card, CircularProgress, Collapse, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { Recipe, RecipeIngredient } from '../model/recipe';
import { formatNumber } from '../utils/strings';

const IngredientRow: React.FC<{ ingredient: RecipeIngredient }> =
    ({ ingredient }) => {

        // const [open, setOpen] = useState(false);

        // let groupWeight: number | undefined;
        // if (ingredient.kind === 'group') {
        //     groupWeight = ingredient.ingredients.reduce((acc, i) => acc + i.groupIngredientWeightGrams, 0);
        // }
        // const groupWeightScaleFactor = groupWeight != null ? 100.0 / groupWeight : 1.0;

        return <>
            <TableRow
                className={ingredient.kind === 'group' ? 'expando-row' : ''}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
                {/* <TableCell className='expando'>
                    {ingredient.kind === 'group'
                        ? <IconButton
                            aria-label='expand row'
                            size='small'
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon viewBox='2 2 20 20' fontSize='small' /> : <KeyboardArrowDownIcon viewBox='2 2 20 20' fontSize='small' />}
                        </IconButton>
                        : undefined}
                </TableCell> */}
                <TableCell component='th' scope='row'>{ingredient.recipeIngredientWeightGrams}g {ingredient.name}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.energyPerGram, 1, ingredient.recipeIngredientWeightGrams * .2390057361)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.proteinPerGram, 2, ingredient.recipeIngredientWeightGrams)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.fatPerGram, 2, ingredient.recipeIngredientWeightGrams)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.carbsPerGram, 2, ingredient.recipeIngredientWeightGrams)}</TableCell>
                <TableCell align='right'>{ingredient.sugarPerGram != null ? formatNumber(ingredient.sugarPerGram, 2, ingredient.recipeIngredientWeightGrams) : undefined}</TableCell>
            </TableRow>
            {/* {ingredient.kind === 'group' ? (
                <TableRow style={{ backgroundColor: '#F3F6F9' }}>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={open} timeout='auto' unmountOnExit>
                            <Box component={Card} sx={{ margin: 1 }}>
                                <Table size='small'>
                                    <TableBody>
                                        {ingredient.ingredients.map((i) => (
                                            <TableRow key={i.id}>
                                                <TableCell component='th' scope='row'>{formatNumber(i.groupIngredientWeightGrams * groupWeightScaleFactor, 1)}% {i.name}</TableCell>
                                                <TableCell component='th' scope='row'>{formatNumber(i.energyPerGram, 1, i.groupIngredientWeightGrams * groupWeightScaleFactor * .2390057361)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            ) : undefined} */}
        </>
    };

const Row: React.FC<{ recipe: Recipe, edit: (recipe: Recipe) => void }> =
    ({ recipe, edit }) => {

        const [open, setOpen] = useState(false);

        const clickRecipe = useCallback(
            () => edit(recipe),
            [edit, recipe]
        );

        return <>
            <TableRow
                key={recipe.name}
                className='expando-row'
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
                <TableCell className='expando'>
                    <IconButton
                        aria-label='expand row'
                        size='small'
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon viewBox='2 2 20 20' fontSize='small' /> : <KeyboardArrowDownIcon viewBox='2 2 20 20' fontSize='small' />}
                    </IconButton>
                </TableCell>
                <TableCell className='name-cell' component='th' scope='row'>
                    <Link component='button' className='name-link' onClick={clickRecipe}>
                        {recipe.name}
                    </Link>
                </TableCell>
                <TableCell align='right'>{formatNumber(recipe.energy, 1, .2390057361)}</TableCell>
                <TableCell align='right'>{formatNumber(recipe.protein, 2)}</TableCell>
                <TableCell align='right'>{formatNumber(recipe.fat, 2)}</TableCell>
                <TableCell align='right'>{formatNumber(recipe.carbs, 2)}</TableCell>
                <TableCell align='right'>{recipe.sugar != null ? formatNumber(recipe.sugar, 2) : undefined}</TableCell>
            </TableRow>
            <TableRow className='row-expansion'>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout='auto' unmountOnExit>
                        <Box component={Card} sx={{ margin: 1 }}>
                            <Table size='small'>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ingredient</TableCell>
                                        <TableCell align='right'>Calories</TableCell>
                                        <TableCell align='right'>Protein</TableCell>
                                        <TableCell align='right'>Fat</TableCell>
                                        <TableCell align='right'>Carbs</TableCell>
                                        <TableCell align='right'>Sugar</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recipe.ingredients.map(i =>
                                        <IngredientRow key={`${i.kind}${i.id}`} ingredient={i} />)}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    };

export default function Recipes() {

    const navigate = useNavigate();
    const editingMatch = useMatch('/recipes/editing');

    const [isLoading, setIsLoading] = useState(true);
    const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
    const [editing, setEditing] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe>();
    const [editingName, setEditingName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(
        () => {
            if (editingRecipe == null && editingMatch) {
                navigate('/recipes', { replace: true });
            }
            else {
                const newEditing = !!editingMatch && editingRecipe != null;
                if (!editing && newEditing) {
                    setEditingName(editingRecipe?.name ?? '');
                }
                setEditing(newEditing);
            }
        },
        [editing, editingMatch, editingRecipe, navigate]
    );

    const updateRecipes = useCallback(
        () => {
            (async () => {
                setIsLoading(true);
                const response = await fetch('/api/recipes');
                if (response.ok) {
                    setRecipes(await response.json());
                    setIsLoading(false);
                }
            })();
        },
        []
    );

    useEffect(updateRecipes, [updateRecipes]);

    const handleEditClose = useCallback(
        () => navigate(-1),
        [navigate]
    );

    const edit = useCallback(
        (recipe: Recipe) => {
            setEditingRecipe(recipe);
            navigate('/recipes/editing');
        },
        [navigate]
    );

    const handleDeleteRecipe = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            setIsSaving(true);
            (async function (recipe: Recipe) {
                const response = await fetch(`/api/recipe/${recipe.id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    // TODO
                }
                setIsSaving(false);
                navigate(-1);
                updateRecipes();
            })(editingRecipe!);
        },
        [editingRecipe, updateRecipes, navigate]
    );

    const handleRenameRecipe = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            setIsSaving(true);
            (async function (recipe: Recipe) {
                const response = await fetch('/api/recipe/rename', {
                    method: 'POST',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify({
                        id: recipe.id,
                        name: editingName
                    }),
                });
                if (response.ok) {
                    // TODO
                }
                setIsSaving(false);
                navigate(-1);
                updateRecipes();
            })(editingRecipe!);
        },
        [editingRecipe, updateRecipes, editingName, navigate]
    );

    const handleNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setEditingName(event.target.value),
        []
    );

    return (
        <Container className='recipes' disableGutters>
            <Typography variant='h5' sx={{ textAlign: 'center', marginBottom: '6px' }}>Recipes</Typography>
            {isLoading ? <div className='loading'><CircularProgress disableShrink size={40} thickness={4} /></div> : undefined}
            <Paper className={`paper ${isLoading ? ' hidden' : ''}`} elevation={2}>
                <TableContainer className='table-container'>
                    <Table stickyHeader size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell className='expando' />
                                <TableCell className='name-cell'>Name</TableCell>
                                <TableCell align='right'>Calories</TableCell>
                                <TableCell align='right'>Protein</TableCell>
                                <TableCell align='right'>Fat</TableCell>
                                <TableCell align='right'>Carbs</TableCell>
                                <TableCell align='right'>Sugar</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recipes.map((recipe) =>
                                <Row key={recipe.id} edit={edit} recipe={recipe} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Dialog open={editing} onClose={handleEditClose}>
                <DialogTitle>Edit {editingRecipe?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        disabled={!editing || isSaving}
                        fullWidth
                        label='Name'
                        variant='outlined'
                        defaultValue={editingRecipe?.name}
                        onChange={handleNameChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!editing || isSaving || !editingName || editingName === editingRecipe?.name}
                        variant='contained'
                        onClick={handleRenameRecipe}
                    >
                        Rename
                    </Button>
                    <Button disabled={!editing || isSaving} color='error' variant='contained' onClick={handleDeleteRecipe}>Delete</Button>
                    <Button disabled={!editing || isSaving} onClick={handleEditClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
