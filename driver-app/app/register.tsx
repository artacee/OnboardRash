/**
 * Register Screen — Driver account creation.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as api from '@/services/api';

export default function RegisterScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        full_name: '',
        username: '',
        password: '',
        phone_number: '',
        license_number: '',
    });
    const [loading, setLoading] = useState(false);

    const updateField = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleRegister = async () => {
        if (!form.full_name.trim() || !form.username.trim() || !form.password) {
            Alert.alert('Error', 'Name, username, and password are required');
            return;
        }

        if (form.password.length < 4) {
            Alert.alert('Error', 'Password must be at least 4 characters');
            return;
        }

        setLoading(true);
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
            Alert.alert('Registration Failed', err.message || 'Could not create account');
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
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join as a registered driver</Text>
                    </View>

                    {/* Registration Card */}
                    <GlassCard tier={0} style={styles.card}>
                        <GlassInput
                            label="Full Name"
                            placeholder="e.g. Rajesh Kumar"
                            value={form.full_name}
                            onChangeText={v => updateField('full_name', v)}
                            autoComplete="name"
                        />

                        <GlassInput
                            label="Username"
                            placeholder="Choose a username"
                            value={form.username}
                            onChangeText={v => updateField('username', v)}
                            autoCapitalize="none"
                            autoComplete="username"
                        />

                        <GlassInput
                            label="Password"
                            placeholder="Min. 4 characters"
                            value={form.password}
                            onChangeText={v => updateField('password', v)}
                            secureTextEntry
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

                    {/* Login link */}
                    <TouchableOpacity
                        onPress={() => router.push('/login')}
                        style={styles.loginLink}
                    >
                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <Text style={styles.loginTextBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: theme.spacing['2xl'],
        marginTop: theme.spacing['3xl'],
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
    registerButton: {
        marginTop: theme.spacing.sm,
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
