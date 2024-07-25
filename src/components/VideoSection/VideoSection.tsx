import React, { RefObject, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs"; // Import TensorFlow.js
import { load } from "@tensorflow-models/coco-ssd";
import alertSound from "../../assets/alert-sound.mp3";
import "@tensorflow/tfjs-backend-webgl"; // WebGL backend
import "@tensorflow/tfjs-backend-cpu"; // CPU backend
import "./videoSection.less"

interface DetectedObject {
  class: string;
  firstDetected: string;
}

// Request microphone access.
async function requestMicrophoneAccess() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access granted");
  } catch (error) {
    console.error("Microphone access denied:", error);
  }
}

// Error handling for screen recording and model loading.
let isSetErrorHandlers = false;
function setupErrorHandling() {
  if (isSetErrorHandlers) {
    return;
  }
  window.addEventListener("error", (e) => {
    console.error("Error occurred:", e.message);
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise rejection:", e.reason);
  });
  isSetErrorHandlers = true;
}

// Setup camera to access the video feed from the user's device.
async function setupCamera(video: HTMLVideoElement): Promise<HTMLVideoElement> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  video.srcObject = stream;

  return new Promise<HTMLVideoElement>((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
      return;
    };
  });
}

const detectedObjects: Record<string, DetectedObject> = {};

// Update detected objects list.
function updateDetectedObjectsList(container: HTMLElement) {
  container.innerHTML = "<h3>Detected Objects:</h3>";
  Object.values(detectedObjects).forEach((obj) => {
    const item = document.createElement("div");
    item.textContent = `${obj.class} - First detected at: ${obj.firstDetected}`;
    container.appendChild(item);
  });
}

// Load the pre-trained COCO-SSD model and set up detection logic.
async function detectObjects(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  alert: AlertType
) {
  await tf.setBackend("webgl"); // Use WebGL backend
  await tf.ready(); // Ensure the backend is ready
  const model = await load(); // Now this should work as TensorFlow.js is imported
  const ctx = canvas.getContext("2d")!;
  const detectedObjectsDiv = document.getElementById("detected-objects")!;

  setInterval(async () => {
    // 2.3 Detect objects in the current video frame.
    const predictions = await model.detect(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log(`Width: ${canvas.width}, height: ${canvas.height}`);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#00FF00";
      ctx.fillText(
        `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );

      if (!detectedObjects[prediction.class]) {
        detectedObjects[prediction.class] = {
          class: prediction.class,
          firstDetected: new Date().toLocaleTimeString(),
        };
        updateDetectedObjectsList(detectedObjectsDiv);
      }
    });

    // 2.4 If a person is detected, sound the alert.
    const person = predictions.find((p) => p.class === "person");
    if (person) {
      alert.play();
    }
  }, 5000); 
}

export type AlertType = {
  play: () => void;
  stop: () => void;
};

/**
 * Get an alert object with play and stop methods.
 */
function getAlert(audio: HTMLAudioElement): AlertType {
  return {
    play: () => {
      audio.loop = true;
      audio.volume = 0;
      audio.play();
    },
    stop: () => {
      audio.loop = false;
      audio.pause();
    },
  };
}

function setupSoundAlert(): Promise<AlertType> {
  const audio: HTMLAudioElement = new Audio(alertSound);
  audio.preload = "auto";

  // Try to play the sound when it's ready to play and make the sound lower.
  return new Promise<AlertType>((resolve, reject) => {
    // Request permission to play sound and handle playback
    let isOk = false;
    audio.addEventListener("canplaythrough", async () => {
      isOk = true;
      resolve(getAlert(audio));
    });
    setTimeout(() => {
      if (!isOk) {
        reject("Sound alert is not ready to play.");
      }
    }, 1000);
  });
}

let isSetup = false;
export const VideoSection = () => {
  const videoRef: RefObject<HTMLVideoElement> = useRef(null);
  const canvasRef: RefObject<HTMLCanvasElement> = useRef(null);
  useEffect(() => {
    setupErrorHandling();
    (async (): Promise<void> => {
      if (isSetup || !videoRef.current || !canvasRef.current) {
        return;
      }
      await requestMicrophoneAccess();
      const alert = await setupSoundAlert();
      const video: HTMLVideoElement = videoRef.current!;
      await setupCamera(video);
      detectObjects(canvasRef.current!, video, alert);
      isSetup = true;
    })().then(() => {});
  }, [videoRef, canvasRef]);

  const rate = 2;
  const width = 320 * rate;
  const height = 240 * rate;
  
  return (
    <section className="video-section">
      <video className="video" width={width} height={height} ref={videoRef} autoPlay></video>
      <canvas className="canvas" ref={canvasRef} width={width} height={height}></canvas>
    </section>
  );
};
