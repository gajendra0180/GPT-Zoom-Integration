import React from "react";
import { useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.css";
import { ZoomMtg } from "@zoomus/websdk";
import ReactDOM from "react-dom";
const { Configuration, OpenAIApi } = require("openai");

const KJUR = require("jsrsasign");

ZoomMtg.setZoomJSLib("https://source.zoom.us/2.13.0/lib", "/av");

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
// loads language files, also passes any error messages to the ui
ZoomMtg.i18n.load("en-US");
ZoomMtg.i18n.reload("en-US");

function Rend() {
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
    console.log("Stopped Listening", transcript);
    microphoneRef.current.classList.remove("listening");
    SpeechRecognition.stopListening();
    console.log(transcript, "This is the transcript");

    const configuration = new Configuration({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: transcript }],
    });
    console.log(completion.data.choices[0].message.content, "This is the data");
    var synthesis = window.speechSynthesis;
    if ("speechSynthesis" in window) {
      var synthesis = window.speechSynthesis;

      // Get the first `en` language voice in the list
      var voice = synthesis.getVoices().filter(function (voice) {
        return voice.lang === "en";
      })[0];

      // Create an utterance object
      var utterance = new SpeechSynthesisUtterance(
        completion.data.choices[0].message.content
        //"Hello World"
      );
      console.log(utterance, "This is the utterance");
      // Set utterance properties
      utterance.voice = voice;
      utterance.pitch = 1.5;
      utterance.rate = 1.25;
      utterance.volume = 0.8;

      // Speak the utterance
      console.log("Speaking");
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
          <img alt="micropohne" className="microphone-icon" />
        </div>
        <div className="microphone-status">
          {isListening ? "Listening........." : "Click to start Listening"}
        </div>
        {console.log(isListening, "This is the is listening")}
        {console.log("Rerendered")}
        {isListening && (
          <button className="microphone-stop btn" onClick={stopHandle}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  var sdkKey = process.env.REACT_APP_ZOOM_MEETING_SDK_KEY;
  var meetingNumber = "85358869476";
  var passWord = process.env.REACT_APP_ZOOM_MEETING_PASSWORD;
  var role = 0;
  var userName = "React";
  var userEmail = "";
  var registrantToken = "";
  var zakToken = "";
  var leaveUrl = "http://localhost:3000";

  function getSignature(e) {
    e.preventDefault();

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: "HS256", typ: "JWT" };
    console.log(
      "process.env.ZOOM_MEETING_SDK_KEY",
      process.env.REACT_APP_ZOOM_MEETING_SDK_KEY
    );
    const oPayload = {
      sdkKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
      tokenExp: iat + 60 * 60 * 2,
    };
    console.log(oPayload, "This is the payload");
    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      process.env.REACT_APP_ZOOM_MEETING_SDK_SECRET
    );
    console.log(signature, "This is the signature");
    startMeeting(signature);
  }

  function startMeeting(signature) {
    document.getElementById("zmmtg-root").style.display = "block";
    ZoomMtg.init({
      leaveUrl: leaveUrl,
      success: (success) => {
        console.log(success, "This is sucess");
        ZoomMtg.join({
          signature: signature,
          sdkKey: sdkKey,
          meetingNumber: meetingNumber,
          passWord: passWord,
          userName: userName,
          userEmail: userEmail,
          tk: registrantToken,
          zak: zakToken,
          success: (success) => {
            const element = document.getElementsByClassName(
              "footer__btns-container"
            );
            const createdElement = document.createElement("div");
            createdElement.setAttribute("id", "custom-foot-bar");
            element[0].appendChild(createdElement);
            ReactDOM.render(
              <Rend />,
              document.getElementById("custom-foot-bar")
            );
            console.log(success);
          },
          error: (error) => {
            console.log(error);
          },
        });
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  return (
    <div className="App">
      <main>
        <h1>Zoom Meeting SDK Sample React</h1>

        {/* For Component View */}
        <div id="meetingSDKElement">
          {/* Zoom Meeting SDK Component View Rendered Here */}
        </div>
        <button onClick={getSignature}>Join Meeting</button>
      </main>
    </div>
  );
}
export default App;
