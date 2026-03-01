/**
 * Login Screen — Frosted glass card with username/password.
 * Inline validation via GlassInput error prop + glass inline error banner.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { PressableScale } from '@/components/ui/PressableScale';
import { Background } from '@/components/ui/Background';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as api from '@/services/api';
import { ApiError, initApiUrl, persistApiUrl } from '@/services/api';

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [serverUrl, setServerUrl] = useState(api.getApiUrl());

    useEffect(() => {
        initApiUrl().then(() => setServerUrl(api.getApiUrl()));
    }, []);

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
        setServerError(null);
        try {
            await persistApiUrl(serverUrl.trim().replace(/\/$/, ''));
            await api.login(username.trim(), password);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    setServerError('Invalid username or password.');
                } else if (err.status === 0) {
                    setServerError(err.message);
                } else {
                    setServerError(err.message);
                }
            } else {
                setServerError(err.message || 'Something went wrong.');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Background variant="aurora" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back button */}
                    <PressableScale
                        onPress={() => router.back()}
                        haptic hapticStyle="light"
                        style={styles.backButton}
                        scaleTo={0.88}
                    >
                        <BlurView intensity={Platform.OS === 'android' ? 15 : 30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: 'hidden' }]} />
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </PressableScale>

                    {/* Header — word-by-word spring reveal */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            {['Welcome', 'Back'].map((word, i) => (
                                <Animated.Text
                                    key={word}
                                    entering={FadeInDown
                                        .delay(i * 70)
                                        .springify()
                                        .damping(16)
                                        .stiffness(220)
                                        .withInitialValues({ originY: 28, opacity: 0 })}
                                    style={styles.titleWord}
                                >
                                    {word}
                                </Animated.Text>
                            ))}
                        </View>
                        <Animated.Text
                            entering={FadeIn.delay(240).duration(500)}
                            style={styles.subtitle}
                        >
                            Sign in to your account
                        </Animated.Text>
                    </View>

                    {/* Inline Error Banner */}
                    {serverError && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.errorBannerWrap}>
                            <GlassCard tier={2} noPadding style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
                                <Text style={styles.errorBannerText}>{serverError}</Text>
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* Login Card */}
                    <AnimatedEntry delay={100} type="slide-left">
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

                    </AnimatedEntry>

                    {/* Register link */}
                    <AnimatedEntry delay={200} type="fade">
                        <PressableScale
                        onPress={() => router.push('/register')}
                        style={styles.registerLink}
                        scaleTo={0.97}
                    >
                        <Text style={styles.registerText}>
                            Don't have an account?{' '}
                            <Text style={styles.registerTextBold}>Register</Text>
                        </Text>
                    </PressableScale>
                    </AnimatedEntry>

                    {/* Advanced — change server URL before login */}
                    <AnimatedEntry delay={300} type="fade">
                        <PressableScale
                            onPress={() => { Haptics.selectionAsync(); setShowAdvanced(v => !v); }}
                            style={styles.advancedToggle}
                            scaleTo={0.97}
                        >
                            <Ionicons
                                name={showAdvanced ? 'chevron-up' : 'settings-outline'}
                                size={14}
                                color={theme.colors.textTertiary}
                            />
                            <Text style={styles.advancedToggleText}>Advanced</Text>
                        </PressableScale>

                        {showAdvanced && (
                            <Animated.View entering={FadeInDown.duration(250).springify()}>
                                <GlassCard tier={2} style={styles.advancedCard}>
                                    <Text style={styles.advancedLabel}>Backend Server URL</Text>
                                    <Text style={styles.advancedHint}>
                                        Set if your laptop has a different IP on the hotspot.{' '}Find it: ipconfig | findstr 192.168
                                    </Text>
                                    <GlassInput
                                        label=""
                                        placeholder="http://192.168.43.2:5000"
                                        value={serverUrl}
                                        onChangeText={setServerUrl}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </GlassCard>
                            </Animated.View>
                        )}
                    </AnimatedEntry>
                </ScrollView>
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
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing['3xl'],
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
        borderTopWidth: 1,
        borderTopColor: theme.colors.glassBorderLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    header: {
        marginBottom: theme.spacing['2xl'],
    },
    titleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    titleWord: {
        fontFamily: 'Inter_400Regular',
        fontSize: 38,
        fontWeight: '400',
        color: '#7850DC',
        letterSpacing: -1.5,
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
    errorBannerWrap: {
        marginBottom: theme.spacing.base,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.base,
        borderWidth: 1,
        borderColor: theme.colors.dangerBg,
    },
    errorBannerText: {
        flex: 1,
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.dangerText,
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
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
    },
    advancedToggleText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textTertiary,
    },
    advancedCard: {
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    advancedLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    advancedHint: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textTertiary,
        lineHeight: 18,
    },
});
