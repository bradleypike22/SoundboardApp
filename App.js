import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Button, Alert, Text, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'RECORDINGS';

const App = () => {
    const [recording, setRecording] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [sounds, setSounds] = useState([
        { name: "Sound 1", uri: require('./assets/sound1.wav'), sound: null },
        { name: "Sound 2", uri: require('./assets/sound2.wav'), sound: null },
        { name: "Sound 3", uri: require('./assets/sound3.wav'), sound: null },
    ]);

    useEffect(() => {
        loadRecordings();
        return () => sounds.forEach(({ sound }) => sound?.unloadAsync());
    }, []);

    const loadRecordings = async () => {
        try {
            const storedRecordings = await AsyncStorage.getItem(STORAGE_KEY);
            const loadedRecordings = storedRecordings ? JSON.parse(storedRecordings) : [];
            setRecordings(loadedRecordings);
        } catch (error) {
            Alert.alert("Error", `Failed to load recordings: ${error.message}`);
        }
    };

    const saveRecording = async (newRecording) => {
        try {
            const updatedRecordings = [...recordings, newRecording];
            setRecordings(updatedRecordings);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecordings));
        } catch (error) {
            Alert.alert("Error", `Failed to save recording: ${error.message}`);
        }
    };

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                );
                setRecording(recording);
            } else {
                Alert.alert('Permission not granted', 'Failed to record audio.');
            }
        } catch (error) {
            console.error('Failed to start recording', error);
        }
    }

    async function stopRecording() {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            const newRecording = {
                name: `Recording ${recordings.length + 1}`,
                uri,
                sound: null,
            };
            saveRecording(newRecording);
            setRecording(null);
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    }

    async function playSound(uri) {
        try {
            const { sound } = await Audio.Sound.createAsync(
                typeof uri === 'string' ? { uri } : uri
            );
            await sound.playAsync();
        } catch (error) {
            console.error('Error loading or playing sound:', error);
        }
    }

    const renderSoundButtons = () => {
        return sounds.concat(recordings).map((sound, index) => (
            <AnimatedButton
                key={index}
                title={sound.name}
                onPress={() => playSound(sound.uri)}
            />
        ));
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {renderSoundButtons()}
                <TouchableOpacity style={[styles.button, styles.recordButton]} onPress={startRecording} disabled={recording !== null}>
                    <Text style={styles.buttonText}>Start Recording</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording} disabled={recording === null}>
                    <Text style={styles.buttonText}>Stop Recording</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const AnimatedButton = ({ title, onPress }) => {
    const animation = new Animated.Value(1);

    const handlePressIn = () => {
        Animated.spring(animation, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const animatedStyle = {
        transform: [{ scale: animation }],
    };

    return (
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[styles.button, styles.soundButton, animatedStyle]}>
                <Text style={styles.buttonText}>{title}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        backgroundColor: '#fff',
    },
    scrollView: {
        width: '75%',
    },
    button: {
        padding: 15,
        borderRadius: 5,
        marginVertical: 5,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    soundButton: {
        backgroundColor: '#007bff',
    },
    recordButton: {
        backgroundColor: '#28a745',
    },
    stopButton: {
        backgroundColor: '#dc3545',
    },
});

export default App;
