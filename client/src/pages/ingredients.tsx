import { WarningRounded } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, Card, CircularProgress, Collapse, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { Ingredient } from '../model/ingredient';
import { formatNumber } from '../utils/strings';

const Row: React.FC<{ ingredient: Ingredient, edit: (ingredient: Ingredient) => void }> =
    ({ ingredient, edit }) => {

        const under600 = useMediaQuery('@media screen and (max-width: 600px)');

        const [open, setOpen] = useState(false);

        const clickIngredient = useCallback(
            () => edit(ingredient),
            [edit, ingredient]
        );

        return <>
            <TableRow
                className={ingredient.kind === 'group' ? 'expando-row' : ''}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
                <TableCell className='expando'>
                    {ingredient.kind === 'group'
                        ? <IconButton
                            aria-label='expand row'
                            size='small'
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon viewBox='2 2 20 20' fontSize='small' /> : <KeyboardArrowDownIcon viewBox='2 2 20 20' fontSize='small' />}
                        </IconButton>
                        : undefined}
                </TableCell>
                <TableCell component='th' scope='row'>
                    <Link component='button' className='name-link' onClick={clickIngredient}>
                        {ingredient.name}
                    </Link>
                    {/* {' '}
                    <IconButton className='edit' size='small' component='span'>
                        <EditOutlined fontSize='inherit' />
                    </IconButton> */}
                </TableCell>
                <TableCell align='right'>{formatNumber(ingredient.energyPerGram, 1, 23.90057361)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.proteinPerGram, under600 ? 1 : 2, 100)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.fatPerGram, under600 ? 1 : 2, 100)}</TableCell>
                <TableCell align='right'>{formatNumber(ingredient.carbsPerGram, under600 ? 1 : 2, 100)}</TableCell>
                <TableCell align='right'>{ingredient.sugarPerGram != null ? formatNumber(ingredient.sugarPerGram, under600 ? 1 : 2, 100) : undefined}</TableCell>
            </TableRow>
            {ingredient.kind === 'group' ? (
                <TableRow style={{ backgroundColor: '#F3F6F9' }}>
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
                                        {ingredient.ingredients.map((i) => {
                                            const multiplier = 100.0 /
                                                ingredient.ingredients
                                                    .reduce((n, i) => n + i.groupIngredientWeightGrams, 0);
                                            return (
                                                <TableRow key={i.id}>
                                                    <TableCell component='th' scope='row'>
                                                        {i.groupIngredientWeightGrams}g
                                                        {' '}
                                                        {i.name}
                                                        {i.deleted
                                                            ? <>{' '}<Tooltip arrow title='Deleted ingredient' enterTouchDelay={0}>
                                                                <WarningRounded className='warning-flag' fontSize='small' />
                                                            </Tooltip></>
                                                            : undefined}
                                                    </TableCell>
                                                    <TableCell align='right'>{formatNumber(i.energyPerGram, 1, i.groupIngredientWeightGrams * multiplier * .2390057361)}</TableCell>
                                                    <TableCell align='right'>{formatNumber(i.proteinPerGram, 2, i.groupIngredientWeightGrams * multiplier)}</TableCell>
                                                    <TableCell align='right'>{formatNumber(i.fatPerGram, 2, i.groupIngredientWeightGrams * multiplier)}</TableCell>
                                                    <TableCell align='right'>{formatNumber(i.carbsPerGram, 2, i.groupIngredientWeightGrams * multiplier)}</TableCell>
                                                    <TableCell align='right'>{i.sugarPerGram != null ? formatNumber(i.sugarPerGram, 2, i.groupIngredientWeightGrams * multiplier) : undefined}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            ) : undefined}
        </>
    };

export default function Ingredients() {

    const over600 = useMediaQuery('@media screen and (min-width: 600px)');

    const navigate = useNavigate();
    const editingMatch = useMatch('/ingredients/editing');

    const [isLoading, setIsLoading] = useState(true);
    const [ingredients, setIngredients] = useState<readonly Ingredient[]>([]);
    const [editing, setEditing] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient>();
    const [editingName, setEditingName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(
        () => {
            if (editingIngredient == null && editingMatch) {
                navigate('/ingredients', { replace: true });
            }
            else {
                const newEditing = !!editingMatch && editingIngredient != null;
                if (!editing && newEditing) {
                    setEditingName(editingIngredient?.name ?? '');
                }
                setEditing(newEditing);
            }
        },
        [editing, editingMatch, editingIngredient, navigate]
    );

    const updateIngredients = useCallback(
        () => {
            setIsLoading(true);
            (async () => {
                const response = await fetch('/api/ingredients');
                if (response.ok) {
                    setIngredients(await response.json());
                    setIsLoading(false);
                }
            })();
        },
        []
    );

    useEffect(updateIngredients, [updateIngredients]);

    const handleEditClose = useCallback(
        () => navigate(-1),
        [navigate]
    );

    const edit = useCallback(
        (ingredient: Ingredient) => {
            setEditingIngredient(ingredient);
            navigate('/ingredients/editing');
        },
        [navigate]
    );

    const handleDeleteIngredient = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            setIsSaving(true);
            (async function (ingredient: Ingredient) {
                const response = await fetch('/api/ingredient', {
                    method: 'DELETE',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify({
                        kind: ingredient.kind,
                        id: ingredient.id
                    }),
                });
                if (response.ok) {
                    // TODO
                }
                setIsSaving(false);
                navigate(-1);
                updateIngredients();
            })(editingIngredient!);
        },
        [editingIngredient, updateIngredients, navigate]
    );

    const handleRenameIngredient = useCallback(
        (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            setIsSaving(true);
            (async function (ingredient: Ingredient) {
                const response = await fetch('/api/ingredient/rename', {
                    method: 'POST',
                    headers: {
                        'content-type': 'text/json',
                    },
                    body: JSON.stringify({
                        kind: ingredient.kind,
                        id: ingredient.id,
                        name: editingName
                    }),
                });
                if (response.ok) {
                    // TODO
                }
                setIsSaving(false);
                navigate(-1);
                updateIngredients();
            })(editingIngredient!);
        },
        [editingIngredient, updateIngredients, editingName, navigate]
    );

    const handleNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setEditingName(event.target.value),
        []
    );

    return (
        <Container className='ingredients' disableGutters>
            <Typography variant='h5' sx={{ textAlign: 'center', marginBottom: '6px' }}>Ingredients</Typography>
            {isLoading ? <div className='loading'><CircularProgress disableShrink size={40} thickness={4} /></div> : undefined}
            <Paper className={`paper ${isLoading ? 'hidden' : ''}`} elevation={2}>
                <TableContainer className='table-container'>
                    <Table stickyHeader size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell className='expando' />
                                <TableCell>Name</TableCell>
                                <TableCell align='right'>Calories{over600 ? '/100g' : undefined}</TableCell>
                                <TableCell align='right'>Protein{over600 ? '/100g' : undefined}</TableCell>
                                <TableCell align='right'>Fat{over600 ? '/100g' : undefined}</TableCell>
                                <TableCell align='right'>Carbs{over600 ? '/100g' : undefined}</TableCell>
                                <TableCell align='right'>Sugar{over600 ? '/100g' : undefined}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ingredients.map((ingredient) =>
                                <Row key={`${ingredient.kind}${ingredient.id}`} edit={edit} ingredient={ingredient} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Dialog open={editing} onClose={handleEditClose}>
                <DialogTitle>Edit {editingIngredient?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        disabled={!editing || isSaving}
                        fullWidth
                        label='Name'
                        variant='outlined'
                        defaultValue={editingIngredient?.name}
                        onChange={handleNameChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!editing || isSaving || !editingName || editingName === editingIngredient?.name}
                        variant='contained'
                        onClick={handleRenameIngredient}
                    >
                        Rename
                    </Button>
                    <Button disabled={!editing || isSaving} color='error' variant='contained' onClick={handleDeleteIngredient}>Delete</Button>
                    <Button disabled={!editing || isSaving} onClick={handleEditClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
