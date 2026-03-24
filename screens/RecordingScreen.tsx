/**
 * Recording Screen - Audio recording module for consent sessions.
 *
 * Features:
 * - expo-av for audio recording
 * - Timestamp overlay showing recording duration
 * - Save recording linked to specific consent form
 * - Playback with waveform-style visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ErrorBoundary from '../components/ErrorBoundary';
import PaywallGate from '../components/PaywallGate';
import usePurchases from '../hooks/usePurchases';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface RecordingScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      consentId?: string;
    };
  };
}

const RecordingScreen: React.FC<RecordingScreenProps> = () => {
  const { canRecord } = usePurchases();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();

    return () => {
      if (durationTimer.current) clearInterval(durationTimer.current);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setWaveformData([]);

      durationTimer.current = setInterval(() => {
        setDuration((prev) => prev + 1);
        setWaveformData((prev) => [
          ...prev,
          0.2 + Math.random() * 0.8,
        ]);
      }, 1000);
    } catch (_error) {
      Alert.alert('Error', 'Failed to start recording. Check permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }

      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        setRecordingUri(uri);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            setPlaybackDuration((status.durationMillis || 0) / 1000);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (_error) {
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const shareRecording = async () => {
    if (!recordingUri) return;

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(recordingUri, {
        mimeType: 'audio/m4a',
        dialogTitle: 'Share Consent Recording',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to share recording.';
      Alert.alert('Error', message);
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (sound) await sound.unloadAsync();
            if (recordingUri) {
              await FileSystem.deleteAsync(recordingUri, {
                idempotent: true,
              });
            }
            setRecordingUri(null);
            setSound(null);
            setDuration(0);
            setPlaybackPosition(0);
            setWaveformData([]);
          },
        },
      ]
    );
  };

  const renderWaveform = () => {
    if (waveformData.length === 0) return null;

    const visibleBars = waveformData.slice(-40);

    return (
      <View style={styles.waveformContainer}>
        {visibleBars.map((height, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 60,
                backgroundColor: isRecording
                  ? Colors.error
                  : Colors.primary,
                opacity: isRecording
                  ? 0.4 + height * 0.6
                  : index / visibleBars.length,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  if (permissionGranted === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.statusText}>Requesting permissions...</Text>
      </SafeAreaView>
    );
  }

  if (permissionGranted === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.permissionIcon}>{'\u{1F3A4}'}</Text>
          <Text style={styles.permissionTitle}>
            Microphone Access Required
          </Text>
          <Text style={styles.permissionText}>
            Please enable microphone access in your device settings to use
            the recording feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <PaywallGate feature="recording" isAllowed={canRecord}>
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          <View style={styles.content}>
            {/* Recording Status */}
            <View style={styles.statusSection}>
              {isRecording && (
                <Animated.View
                  style={[
                    styles.recordingDot,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.statusLabel,
                  isRecording && styles.statusLabelRecording,
                ]}
              >
                {isRecording
                  ? 'Recording...'
                  : recordingUri
                  ? 'Recording saved'
                  : 'Ready to record'}
              </Text>
            </View>

            {/* Duration Display */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {isPlaying
                  ? `${formatTime(playbackPosition)} / ${formatTime(
                      playbackDuration
                    )}`
                  : formatTime(duration)}
              </Text>
            </View>

            {/* Waveform */}
            {renderWaveform()}

            {/* Controls */}
            <View style={styles.controlsContainer}>
              {!isRecording && !recordingUri && (
                <Pressable
                  style={styles.recordButton}
                  onPress={startRecording}
                >
                  <View style={styles.recordButtonInner} />
                  <Text style={styles.controlLabel}>Record</Text>
                </Pressable>
              )}

              {isRecording && (
                <Pressable
                  style={styles.stopButton}
                  onPress={stopRecording}
                >
                  <View style={styles.stopButtonInner} />
                  <Text style={styles.controlLabel}>Stop</Text>
                </Pressable>
              )}

              {recordingUri && !isRecording && (
                <View style={styles.playbackControls}>
                  <Pressable
                    style={styles.controlButton}
                    onPress={isPlaying ? stopPlayback : playRecording}
                  >
                    <Text style={styles.controlButtonIcon}>
                      {isPlaying ? '\u{23F9}' : '\u{25B6}\uFE0F'}
                    </Text>
                    <Text style={styles.controlLabel}>
                      {isPlaying ? 'Stop' : 'Play'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.controlButton}
                    onPress={startRecording}
                  >
                    <Text style={styles.controlButtonIcon}>{'\u{1F504}'}</Text>
                    <Text style={styles.controlLabel}>Re-record</Text>
                  </Pressable>

                  <Pressable
                    style={styles.controlButton}
                    onPress={shareRecording}
                  >
                    <Text style={styles.controlButtonIcon}>{'\u{1F4E4}'}</Text>
                    <Text style={styles.controlLabel}>Share</Text>
                  </Pressable>

                  <Pressable
                    style={styles.controlButton}
                    onPress={deleteRecording}
                  >
                    <Text style={styles.controlButtonIcon}>{'\u{1F5D1}'}</Text>
                    <Text style={styles.controlLabel}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Transcription Placeholder */}
            <View style={styles.transcriptionSection}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>COMING SOON</Text>
              </View>
              <Text style={styles.transcriptionTitle}>
                Automatic Transcription
              </Text>
              <Text style={styles.transcriptionDescription}>
                Audio recordings will be automatically transcribed in a
                future update. Transcriptions will be included in exported
                PDF documents.
              </Text>
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>Recording Tips</Text>
              <Text style={styles.tipItem}>
                {'\u2022'} Record in a quiet environment for clarity
              </Text>
              <Text style={styles.tipItem}>
                {'\u2022'} State the date, parties, and purpose at the start
              </Text>
              <Text style={styles.tipItem}>
                {'\u2022'} Ensure all parties verbally confirm their consent
              </Text>
              <Text style={styles.tipItem}>
                {'\u2022'} Do not pause or edit the recording
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </PaywallGate>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginRight: Spacing.sm,
  },
  statusLabel: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  statusLabelRecording: {
    color: Colors.error,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 64,
    marginBottom: Spacing.xl,
    gap: 2,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    borderWidth: 4,
    borderColor: '#FFCDD2',
  },
  stopButton: {
    alignItems: 'center',
  },
  stopButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  controlLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  controlButtonIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  transcriptionSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.sm,
  },
  premiumBadgeText: {
    ...Typography.caption,
    color: '#E65100',
    fontWeight: '700',
    letterSpacing: 1,
  },
  transcriptionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  transcriptionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tipsSection: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  tipsTitle: {
    ...Typography.label,
    color: Colors.primaryDark,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
});

export default RecordingScreen;
