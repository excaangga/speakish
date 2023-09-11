import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Voice from '@react-native-community/voice';
import Tts from 'react-native-tts';

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    // Initial setup
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    // Start voice recognition
    try {
      await Voice.start('en-UK');
      setIsListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    // Stop voice recognition
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onSpeechEnd = async () => {
    // Function to execute when the user stops speaking
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onSpeechResults = async (e) => {
    // Get text from voice recognition
    const inputText = e.value[0];
    setText(inputText);

    // Send the text to your endpoint and get the response
    const response = await fetch(
      'https://free.churchless.tech/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'speakish',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {"role": "system", "content": "You are an english speaking partner. Think yourself as a human, and refrain from being an encyclopedia."},
            {
              role: 'user',
              content: inputText,
            },
          ],
          "max_tokens": 17
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Request failed with status: ' + response.status);
    }

    const data = await response.json();
    const outputText = data.choices[0].message.content;

    // Speak the response out loud
    Tts.speak(outputText)
      .then(() => {
        return new Promise(resolve => {
          // Wait for TTS completion event
          Tts.addEventListener('tts-finish', resolve);
        });
      })
      .then(() => {
        startListening();
      })
      .catch((err) => console.log(err));
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <TouchableOpacity
        onPress={() => (isListening ? stopListening() : startListening())}>
        <Text>{isListening ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
      <Text>
        {isListening ? 'Listening...' : "Tap 'Start' to begin listening"}
      </Text>
      <Text>{text}</Text>
    </View>
  );
};

export default App;
