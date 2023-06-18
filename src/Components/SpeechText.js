import React, { useState, useRef } from "react";
// Speech Recognition
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
// OpenAI
const { Configuration, OpenAIApi } = require("openai");

function SpeechText() {
  // Set up the state variables
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const microphoneRef = useRef(null);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <div className="mircophone-container">
        Browser is not Support Speech Recognition.
      </div>
    );
  }
  //   Speech Handlers
  const handleListing = () => {
    setIsListening(true);
    console.log("Started Listening");
    microphoneRef.current.classList.add("listening");
    SpeechRecognition.startListening({
      continuous: true,
    });
  };
  const stopHandle = async () => {
    setIsListening(false);
    console.log("Stopped Listening And here is the transcript", transcript);
    microphoneRef.current.classList.remove("listening");
    SpeechRecognition.stopListening();
    // After the the user has finished speaking we will send the transcript to the OpenAI API
    // Initialise the OpenAI APIs
    const configuration = new Configuration({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    // OpenAI Chat Completion API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: transcript }],
    });
    console.log(
      completion.data.choices[0].message.content,
      "This is the Response data from the GPT"
    );
    // Text to Speech API
    var synthesis = window.speechSynthesis;
    if ("speechSynthesis" in window) {
      // Get the first `en` language voice in the list
      var voice = synthesis.getVoices().filter(function (voice) {
        return voice.lang === "en";
      })[0];

      // Create an utterance object
      var utterance = new SpeechSynthesisUtterance(
        completion.data.choices[0].message.content
      );
      // Set utterance properties
      utterance.voice = voice;
      utterance.pitch = 1.3;
      utterance.rate = 1.0;
      utterance.volume = 1;

      // Speak the utterance
      console.log("Synthesis is Speaking");
      synthesis.speak(utterance);
    } else {
      console.log("Text-to-speech not supported.");
    }
    resetTranscript();
  };
  return (
    <div className="microphone-wrapper">
      <div className="mircophone-container">
        <div
          className="microphone-icon-container"
          ref={microphoneRef}
          onClick={handleListing}
        >
          <img
            src="https://svgur.com/i/uPm.svg"
            alt="micropohne"
            className="microphone-icon"
          />
        </div>
        <div className="microphone-status">
          {isListening ? "Listening........." : ""}
        </div>
        {isListening && (
          <button className="btn" onClick={stopHandle}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default SpeechText;
