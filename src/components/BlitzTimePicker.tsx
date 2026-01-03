import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, createTextStyle, SHADOWS } from '../utils/theme';

interface BlitzTimePickerProps {
    visible: boolean;
    currentTime: number;
    onSelectTime: (seconds: number) => void;
    onClose: () => void;
}

const TIME_OPTIONS = [
    { value: 1, label: '1s', description: 'Insano!' },
    { value: 2, label: '2s', description: 'Muito rápido' },
    { value: 3, label: '3s', description: 'Rápido' },
    { value: 4, label: '4s', description: 'Moderado' },
    { value: 5, label: '5s', description: 'Relaxado' },
];

const BlitzTimePicker: React.FC<BlitzTimePickerProps> = ({
    visible,
    currentTime,
    onSelectTime,
    onClose,
}) => {
    const [selectedTime, setSelectedTime] = useState(currentTime);

    const handleConfirm = () => {
        onSelectTime(selectedTime);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={SlideInUp.duration(300)}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Ionicons name="timer-outline" size={28} color={COLORS.warning} />
                        <Text style={styles.title}>⚡ Tempo por jogada</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Escolha quanto tempo cada jogador terá para fazer sua jogada.
                        Se o tempo acabar, você perde!
                    </Text>

                    <View style={styles.optionsContainer}>
                        {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    selectedTime === option.value && styles.optionButtonSelected,
                                ]}
                                onPress={() => setSelectedTime(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    selectedTime === option.value && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                                <Text style={[
                                    styles.optionDescription,
                                    selectedTime === option.value && styles.optionDescriptionSelected,
                                ]}>
                                    {option.description}
                                </Text>
                                {selectedTime === option.value && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color={COLORS.success}
                                        style={styles.checkIcon}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="play" size={18} color={COLORS.white} />
                            <Text style={styles.confirmButtonText}>Começar!</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    container: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 350,
        ...SHADOWS.heavy,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    title: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.white,
    },
    subtitle: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    optionsContainer: {
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkBackground,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warning + '20',
    },
    optionLabel: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        width: 50,
    },
    optionLabelSelected: {
        color: COLORS.warning,
    },
    optionDescription: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
        flex: 1,
    },
    optionDescriptionSelected: {
        color: COLORS.lightGray,
    },
    checkIcon: {
        marginLeft: SPACING.sm,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.darkBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        ...createTextStyle('md', 'semibold'),
        color: COLORS.lightGray,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.warning,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    confirmButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
});

export default BlitzTimePicker;
