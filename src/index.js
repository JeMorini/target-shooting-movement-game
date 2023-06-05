import { gestures } from "./gestures.js";

const config = {
  video: {
    width: screen.width, // largura igual à largura da tela
    height: screen.height, // altura igual à altura da tela
    frameRate: 3, // taxa de quadros (fps)
  },
};

const landmarkColors = {
  thumb: "red",
  index: "blue",
  middle: "yellow",
  ring: "green",
  pinky: "pink",
  wrist: "white",
};

const gestureStrings = {
  rock: "✊️",
};

function checkProximity(shot) {
  var aimDiv = document.querySelector(".aim");
  var alvoImg = document.querySelector(".alvo");

  var aimRect = aimDiv.getBoundingClientRect();
  var alvoRect = alvoImg.getBoundingClientRect();

  var aimCenterX = aimRect.left + aimRect.width / 2;
  var aimCenterY = aimRect.top + aimRect.height / 2;

  var alvoCenterX = alvoRect.left + alvoRect.width / 2;
  var alvoCenterY = alvoRect.top + alvoRect.height / 2;

  var distancia = Math.sqrt(
    Math.pow(aimCenterX - alvoCenterX, 2) +
      Math.pow(aimCenterY - alvoCenterY, 2)
  );

  var limiteProximidade = 50; // Defina o limite de proximidade desejado

  if (distancia <= limiteProximidade) {
    aimDiv.src = "./src/images/aim-green.png";
    // alert("A div 'aim' está próxima da posição alvo!");
    if (shot) {
      alvoImg.src =
        "https://cdn.pixabay.com/photo/2019/12/07/21/26/boom-4680150_1280.png";
    }
  } else {
    aimDiv.src = "./src/images/aim.png";
  }
}

setInterval(checkProximity, 100);

function changeImagePosition() {
  var imgElement = document.querySelector(".alvo");

  setInterval(function () {
    var x = Math.floor(Math.random() * (window.innerWidth - imgElement.width));
    var y = Math.floor(
      Math.random() * (window.innerHeight - imgElement.height)
    );

    imgElement.src = "https://cdn-icons-png.flaticon.com/512/204/204410.png";
    imgElement.style.width = "100px";
    imgElement.style.height = "100px";
    imgElement.style.position = "absolute";
    imgElement.style.left = x + "px";
    imgElement.style.top = y + "px";
  }, 4000);
}

// Chamar a função para iniciar a alteração da posição da imagem
changeImagePosition();

async function createDetector() {
  return window.handPoseDetection.createDetector(
    window.handPoseDetection.SupportedModels.MediaPipeHands,
    {
      runtime: "mediapipe",
      modelType: "full",
      maxHands: 2,
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`,
    }
  );
}

async function main() {
  const video = document.querySelector("#pose-video");
  const canvas = document.querySelector("#pose-canvas");
  const ctx = canvas.getContext("2d");

  const resultLayer = {
    right: document.querySelector("#pose-result-right"),
    left: document.querySelector("#pose-result-left"),
  };
  // configure gesture estimator
  // add "✌🏻" and "👍" as sample gestures
  const knownGestures = [
    fp.Gestures.VictoryGesture,
    fp.Gestures.ThumbsUpGesture,
    ...gestures,
  ];
  const GE = new fp.GestureEstimator(knownGestures);
  // load handpose model
  const detector = await createDetector();
  console.log("mediaPose model loaded");

  // main estimation loop
  const estimateHands = async () => {
    // clear canvas overlay
    ctx.clearRect(0, 0, config.video.width, config.video.height);
    resultLayer.right.innerText = "";
    resultLayer.left.innerText = "";

    // get hand landmarks from video
    const hands = await detector.estimateHands(video, {
      flipHorizontal: true,
    });

    for (const hand of hands) {
      for (const keypoint of hand.keypoints) {
        const name = keypoint.name.split("_")[0].toString().toLowerCase();
        const color = landmarkColors[name];
        drawPoint(ctx, keypoint.x, keypoint.y, 3, color);
      }

      const keypoints3D = hand.keypoints3D.map((keypoint) => [
        keypoint.x,
        keypoint.y,
        keypoint.z,
      ]);
      // Acessar a div com a classe "aim"
      var aimDiv = document.querySelector(".aim");

      // Definir posições dinâmicas
      var x = 100; // posição horizontal
      var y = 200; // posição vertical

      aimDiv.style.width = "100px";
      aimDiv.style.height = "100px";
      aimDiv.style.position = "absolute";
      aimDiv.style.left = hand.keypoints[0].x + "px";
      aimDiv.style.top = hand.keypoints[0].y + "px";
      aimDiv.style.color = "red";

      const predictions = GE.estimate(keypoints3D, 9);
      if (!predictions.gestures.length) {
        updateDebugInfo(predictions.poseData, "left");
      }
      if (predictions.gestures.length > 0) {
        // find gesture with highest match score
        let result = predictions.gestures.reduce((p, c) => {
          return p.score > c.score ? p : c;
        });
        const chosenHand = hand.handedness.toLowerCase();
        if (result.name === "rock") {
          checkProximity("shot");
        }
        resultLayer[chosenHand].innerText = gestureStrings[result.name];
        updateDebugInfo(predictions.poseData, chosenHand);
      }
    }
    // ...and so on
    setTimeout(() => {
      estimateHands();
    }, 50);
  };

  estimateHands();
  console.log("Starting predictions");
}

async function initCamera(width, height, fps) {
  const constraints = {
    audio: false,
    video: {
      facingMode: "user",
      width: width,
      height: height,
      frameRate: { max: fps },
    },
  };

  const video = document.querySelector("#pose-video");
  video.width = width;
  video.height = height;

  // get video stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function updateDebugInfo(data, hand) {
  const summaryTable = `#summary-${hand}`;
  for (let fingerIdx in data) {
    document.querySelector(`${summaryTable} span#curl-${fingerIdx}`).innerHTML =
      data[fingerIdx][1];
    document.querySelector(`${summaryTable} span#dir-${fingerIdx}`).innerHTML =
      data[fingerIdx][2];
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCamera(config.video.width, config.video.height, config.video.fps).then(
    (video) => {
      video.play();
      video.addEventListener("loadeddata", (event) => {
        console.log("Camera is ready");
        main();
      });
    }
  );

  const canvas = document.querySelector("#pose-canvas");
  canvas.width = config.video.width;
  canvas.height = config.video.height;
  console.log("Canvas initialized");
});
