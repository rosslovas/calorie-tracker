import { Add, Kitchen, Restaurant } from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import React, { ComponentProps, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './main.scss';
import CreateIngredient from './pages/create-ingredient';
import CreateRecipe from './pages/create-recipe';
import Ingredients from './pages/ingredients';
import Recipes from './pages/recipes';
import { CreateGroupIngredientStateProvider } from './state/create-group-ingredient-state';
import { CreateIngredientStateProvider } from './state/create-ingredient-state';

if (navigator.platform.startsWith('iPhone')) {
    document.documentElement.style.setProperty('--bottom-nav-height', '4.5rem');
    document.documentElement.style.setProperty('--bottom-nav-action-bottom-padding', '16px');
}

const App: React.FC<{}> = () => {

    const location = useLocation();
    const navigate = useNavigate();

    const [navPath, setNavPath] = React.useState('');

    const onNavChange = useCallback(
        (_: React.SyntheticEvent<Element, Event>, value: string) =>
            navigate(value, { replace: true }),
        [navigate]
    );

    useEffect(
        () => setNavPath(location.pathname.match(/(.+?)(?:\/|$)/)![1]),
        [location]
    );

    return <>
        <Routes>
            <Route path='/' element={<Navigate to='/recipes' replace />} />
            <Route path='/recipes/*' element={<Recipes />}>
                <Route path='editing' />
            </Route>
            <Route path='/create-recipe' element={<CreateRecipe />} />
            <Route path='/ingredients/*' element={<Ingredients />}>
                <Route path='editing' />
            </Route>
            <Route path='/create-ingredient' element={<CreateIngredient />} />
        </Routes>
        <Paper sx={{ position: 'fixed', zIndex: 1, bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation showLabels value={navPath} onChange={onNavChange}>
                <BottomNavigationAction value='/recipes' label='Recipes' icon={<Restaurant />} />
                <BottomNavigationAction value='/create-recipe' label='Recipe' icon={<Add />} />
                <BottomNavigationAction value='/ingredients' label='Ingredients' icon={<Kitchen />} />
                <BottomNavigationAction value='/create-ingredient' label='Ingredient' icon={<Add />} />
            </BottomNavigation>
        </Paper>
    </>;
};

const theme = responsiveFontSizes(createTheme());

const Providers = [
    CreateIngredientStateProvider,
    CreateGroupIngredientStateProvider,
].reduce(
    (Accumulated, Current) =>
        ({ children }: ComponentProps<React.FC>): JSX.Element =>
            <Accumulated><Current>{children}</Current></Accumulated>,
    (({ children }) => <>{children}</>) as React.FC,
);

ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <Providers>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Providers>
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
