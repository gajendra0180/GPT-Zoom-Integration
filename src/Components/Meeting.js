import React from "react";
import ReactDOM from "react-dom";
// Zoom Meeting SDK
import { ZoomMtg } from "@zoomus/websdk";
// Components Import
import SpeechText from "./SpeechText";
// CSS
import "./Meeting.css";
// Zoom Meeting SDK Setup
ZoomMtg.setZoomJSLib("https://source.zoom.us/2.13.0/lib", "/av");
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
ZoomMtg.i18n.load("en-US");
ZoomMtg.i18n.reload("en-US");

const KJUR = require("jsrsasign");

function Meeting() {
  var sdkKey = process.env.REACT_APP_ZOOM_MEETING_SDK_KEY;
  // Meeting Credentials
  var meetingURL = "";
  var meetingNumber = "";
  var passWord = "";
  // role 0 means user and 1 means host
  var role = 0;
  var userName = "BOT";
  var userEmail = "";
  var registrantToken = "";
  var zakToken = "";
  // leave url is the url where user will be redirected after the meeting is over
  var leaveUrl = "https://zoom.us/";
  const [element, setElement] = React.useState(
    document.getElementsByClassName("footer__btns-container")
  );
  function getSignature(e) {
    e.preventDefault();
    // Test the meetingURL against the regex ^https:\/\/us05web\.zoom\.us\/j\/\d+\?pwd=[a-zA-Z0-9]+$
    if (
      !meetingURL ||
      !meetingURL.match(
        /^https:\/\/us05web\.zoom\.us\/j\/\d+\?pwd=[a-zA-Z0-9]+$/
      )
    ) {
      alert("Please a Valid meeting URL");
      return;
    }
    // Extract the meeting number and password from the meeting URL
    passWord = meetingURL.split("?")[1].split("=")[1];
    meetingNumber = meetingURL.split("?")[0].split("/")[4];
    // Stanadard procedure to generate the signature
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const oHeader = { alg: "HS256", typ: "JWT" };
    const oPayload = {
      sdkKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
      tokenExp: iat + 60 * 60 * 2,
    };
    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      process.env.REACT_APP_ZOOM_MEETING_SDK_SECRET
    );
    startMeeting(signature);
  }

  function startMeeting(signature) {
    document.getElementById("zmmtg-root").style.display = "block";
    // When initialised the Meeting SDK adds new elements to the DOM to handle client overlays and accessibility elements.
    ZoomMtg.init({
      leaveUrl: leaveUrl,
      success: (success) => {
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
            // Check for the acceptance of the bot into the meeting every 2 seconds.If admitted then render the SpeechText component
            var refreshInterval = setInterval(() => {
              if (document.getElementsByClassName("footer__btns-container")) {
                setElement(
                  document.getElementsByClassName("footer__btns-container")
                );
              }
            }, 2000);
            if (element.length != 0) {
              const createdElement = document.createElement("div");
              createdElement.setAttribute("id", "custom-foot-bar");
              element[0].appendChild(createdElement);
              ReactDOM.render(
                <SpeechText />,
                document.getElementById("custom-foot-bar")
              );
              clearInterval(refreshInterval);
            }
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
    <>
      <main>
        <h1>GPT Zoom Integration</h1>
        <div className="meeting__credentials">
          <label>Meeting URL</label>
          <input
            autoFocus
            type="text"
            id="meetingURL"
            placeholder="https://us05web.zoom.us/j/12345678?pwd=abcdefgh123456"
            required
            defaultValue={meetingURL}
            onChange={(e) => {
              meetingURL = e.target.value;
            }}
          />
          <button onClick={getSignature}>Join Meeting</button>
        </div>
      </main>
    </>
  );
}

export default Meeting;
