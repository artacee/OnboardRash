/**
 * Login Screen — Frosted glass card with username/password.
 * Inline validation via GlassInput error prop + differentiated server errors.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as api from '@/services/api';
import { ApiError } from '@/services/api';

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (!username.trim()) newErrors.username = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        setErrors({});
        try {
            await api.login(username.trim(), password);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    Alert.alert('Login Failed', 'Invalid username or password.');
                } else if (err.status === 0) {
                    Alert.alert('Connection Error', err.message);
                } else {
                    Alert.alert('Server Error', err.message);
                }
            } else {
                Alert.alert('Login Failed', err.message || 'Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to your account</Text>
                    </View>

                    {/* Login Card */}
                    <GlassCard tier={0} style={styles.card}>
                        <GlassInput
                            label="Username"
                            placeholder="Enter your username"
                            value={username}
                            onChangeText={(v) => { setUsername(v); setErrors(e => ({ ...e, username: undefined })); }}
                            autoCapitalize="none"
                            autoComplete="username"
                            error={errors.username}
                        />

                        <GlassInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
                            secureTextEntry
                            autoComplete="password"
                            error={errors.password}
                        />

                        <GlassButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            variant="primary"
                            style={styles.loginButton}
                        />
                    </GlassCard>

                    {/* Register link */}
                    <TouchableOpacity
                        onPress={() => router.push('/register')}
                        style={styles.registerLink}
                    >
                        <Text style={styles.registerText}>
                            Don't have an account?{' '}
                            <Text style={styles.registerTextBold}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: theme.spacing.base,
        left: theme.spacing.xl,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.glassTier2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: theme.spacing['2xl'],
    },
    title: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title1,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    card: {
        marginBottom: theme.spacing.xl,
    },
    loginButton: {
        marginTop: theme.spacing.sm,
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: theme.spacing.base,
    },
    registerText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
    },
    registerTextBold: {
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.headline,
    },
});
