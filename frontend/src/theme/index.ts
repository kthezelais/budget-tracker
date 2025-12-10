import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

const fontConfig = {
    web: {
        regular: {
            fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: '400' as const,
        },
        medium: {
            fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: '500' as const,
        },
        light: {
            fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: '300' as const,
        },
        thin: {
            fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: '100' as const,
        },
    },
    ios: {
        regular: {
            fontFamily: 'System',
            fontWeight: '400' as const,
        },
        medium: {
            fontFamily: 'System',
            fontWeight: '500' as const,
        },
        light: {
            fontFamily: 'System',
            fontWeight: '300' as const,
        },
        thin: {
            fontFamily: 'System',
            fontWeight: '100' as const,
        },
    },
    android: {
        regular: {
            fontFamily: 'sans-serif',
            fontWeight: 'normal' as const,
        },
        medium: {
            fontFamily: 'sans-serif-medium',
            fontWeight: 'normal' as const,
        },
        light: {
            fontFamily: 'sans-serif-light',
            fontWeight: 'normal' as const,
        },
        thin: {
            fontFamily: 'sans-serif-thin',
            fontWeight: 'normal' as const,
        },
    },
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...colors.light,
    },
    fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...colors.dark,
    },
    fonts: configureFonts({ config: fontConfig }),
};
