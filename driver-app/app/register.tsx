/**
 * Register Screen — Driver account creation.
 * Inline validation via GlassInput error prop + differentiated server errors.
 */

import React, { useState } from 'react';
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
import { ApiError } from '@/services/api';

interface FormState {
    full_name: string;
    username: string;
    password: string;
    phone_number: string;
    license_number: string;
}

export default function RegisterScreen() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({
        full_name: '',
        username: '',
        password: '',
        phone_number: '',
        license_number: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);

    const updateField = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (!form.full_name.trim()) newErrors.full_name = 'Full name is required';
        if (!form.username.trim()) newErrors.username = 'Username is required';
        if (!form.password) newErrors.password = 'Password is required';
        else if (form.password.length < 4) newErrors.password = 'Must be at least 4 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        setServerError(null);
        try {
            await api.register({
                full_name: form.full_name.trim(),
                username: form.username.trim(),
                password: form.password,
                phone_number: form.phone_number.trim(),
                license_number: form.license_number.trim(),
            });
            router.replace('/(tabs)/home');
        } catch (err: any) {
            if (err instanceof ApiError) {
                if (err.status === 409) {
                    setErrors({ username: 'Username already taken' });
                } else if (err.status === 0) {
                    setServerError(err.message);
                } else {
                    setServerError(err.message);
                }
            } else {
                setServerError(err.message || 'Could not create account');
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
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
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
                            {['Create', 'Account'].map((word, i) => (
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
                            Join as a registered driver
                        </Animated.Text>
                    </View>

                    {/* Inline Error Banner */}
                    {serverError && (
                        <Animated.View entering={FadeInDown.duration(300).springify()}>
                            <GlassCard tier={2} style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
                                <Text style={styles.errorBannerText}>{serverError}</Text>
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* Registration Card */}
                    <AnimatedEntry delay={100} type="slide-left">
                    <GlassCard tier={0} style={styles.card}>
                        <GlassInput
                            label="Full Name"
                            placeholder="e.g. Rajesh Kumar"
                            value={form.full_name}
                            onChangeText={v => updateField('full_name', v)}
                            autoComplete="name"
                            error={errors.full_name}
                        />

                        <GlassInput
                            label="Username"
                            placeholder="Choose a username"
                            value={form.username}
                            onChangeText={v => updateField('username', v)}
                            autoCapitalize="none"
                            autoComplete="username"
                            error={errors.username}
                        />

                        <GlassInput
                            label="Password"
                            placeholder="Min. 4 characters"
                            value={form.password}
                            onChangeText={v => updateField('password', v)}
                            secureTextEntry
                            error={errors.password}
                        />

                        <GlassInput
                            label="Phone Number (optional)"
                            placeholder="+91 9876543210"
                            value={form.phone_number}
                            onChangeText={v => updateField('phone_number', v)}
                            keyboardType="phone-pad"
                        />

                        <GlassInput
                            label="License Number (optional)"
                            placeholder="KL-XX-XXXX-XXXX"
                            value={form.license_number}
                            onChangeText={v => updateField('license_number', v)}
                            autoCapitalize="characters"
                        />

                        <GlassButton
                            title="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                            variant="primary"
                            style={styles.registerButton}
                        />
                    </GlassCard>
                    </AnimatedEntry>

                    {/* Login link */}
                    <AnimatedEntry delay={200} type="fade">
                    <PressableScale
                        onPress={() => router.push('/login')}
                        style={styles.loginLink}
                        scaleTo={0.97}
                    >
                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <Text style={styles.loginTextBold}>Sign In</Text>
                        </Text>
                    </PressableScale>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing['3xl'],
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 0,
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
        marginTop: theme.spacing['3xl'],
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
    registerButton: {
        marginTop: theme.spacing.sm,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.base,
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
    loginLink: {
        alignItems: 'center',
        paddingVertical: theme.spacing.base,
    },
    loginText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
    },
    loginTextBold: {
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.headline,
    },
});
