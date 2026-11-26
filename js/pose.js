// pose.js: find the child's body in a still picture with MediaPipe Pose (same model and loader as X-Ray Body Mirror).
// The model runs in this browser; the picture never leaves the device.
'use strict';
(function(){
  let landmarker = null, failed = false;
  async function load(){
    if (landmarker || failed) return landmarker;
    try {
      const base = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
      const vision = await import(base + '/vision_bundle.mjs');
      const fileset = await vision.FilesetResolver.forVisionTasks(base + '/wasm');
      const opts = (delegate) => ({
        baseOptions: { delegate,
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task' },
        runningMode: 'IMAGE', numPoses: 1, minPoseDetectionConfidence: 0.3, minPosePresenceConfidence: 0.3,
      });
      try { landmarker = await vision.PoseLandmarker.createFromOptions(fileset, opts('GPU')); }
      catch (e) { landmarker = await vision.PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
    } catch (e) { failed = true; console.warn('pose model failed', e); }
    return landmarker;
  }
  // -> { pts, status: 'found' | 'notFound' | 'offline' }; pts are picture pixels, index = MediaPipe landmark index
  CB.detect = async (canvas) => {
    const lm = await load();
    if (!lm) return { pts: CB.template(canvas.width, canvas.height), status: 'offline' };
    let res = null;
    try { res = lm.detect(canvas); } catch (e) { console.warn(e); }
    const L = res && res.landmarks && res.landmarks[0];
    if (!L) return { pts: CB.template(canvas.width, canvas.height), status: 'notFound' };
    return { pts: L.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height })), status: 'found' };
  };
  // Handles a parent can drag. Each moves one or more landmarks together.
  CB.HANDLES = [
    { id: 'eyes', move: [0, 2, 5] }, { id: 'earA', move: [7] }, { id: 'earB', move: [8] },
    { id: 'shA', move: [11] }, { id: 'shB', move: [12] }, { id: 'hipA', move: [23] }, { id: 'hipB', move: [24] },
    { id: 'knA', move: [25] }, { id: 'knB', move: [26] }, { id: 'anA', move: [27, 29] }, { id: 'anB', move: [28, 30] },
    { id: 'toeA', move: [31] }, { id: 'toeB', move: [32] },
  ];
  CB.handlePos = (P, hd) => hd.id === 'eyes' ? { x: (P[2].x + P[5].x) / 2, y: (P[2].y + P[5].y) / 2 } : P[hd.move[0]];
  CB.BONES = [[7,8],[11,12],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];
})();
