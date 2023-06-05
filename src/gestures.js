const { GestureDescription, Finger, FingerCurl } = window.fp;

const RockGesture = new GestureDescription("rock"); // ✊️

// Rock
// -----------------------------------------------------------------------------

// thumb: half curled
// accept no curl with a bit lower confidence
RockGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
RockGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);

// all other fingers: curled
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  RockGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
  RockGesture.addCurl(finger, FingerCurl.HalfCurl, 0.9);
}

const gestures = [RockGesture];

export { gestures };
