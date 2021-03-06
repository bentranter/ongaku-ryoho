//
// Audio context

let context;

if (window.AudioContext) {
  context = new window.AudioContext();
} else if (window.webkitAudioContext) {
  context = new window.webkitAudioContext();
}



//
// Container for <audio> elements

const audioElementsContainer = (() => {
  let c;
  let styles =
    [ "position: absolute"
    , "left: 0"
    , "top: 0"
    , "height: 0"
    , "width: 0"
    , "visibility: hidden"
    , "pointer-events: none"
    ];

  c = document.createElement("div");
  c.setAttribute("class", "audioElementsContainer");
  c.setAttribute("style", styles.join(";"));

  return c;
})();

document.body.appendChild(audioElementsContainer);



//
// Nodes
//
// Flow:
// {Input} -> Volume -> Low -> Mid -> High -> {Output}

let volume,
    low,
    mid,
    hi;

// volume
volume = context.createGain();
volume.gain.value = 1;

// biquad filters
low = context.createBiquadFilter();
mid = context.createBiquadFilter();
hi = context.createBiquadFilter();

low.type = "lowshelf";
mid.type = "peaking";
hi.type = "highshelf";

low.frequency.value = 250;
mid.frequency.value = 2750;
mid.Q.value = 1;
hi.frequency.value = 8000;

// connect them nodes
volume.connect(low);
low.connect(mid);
mid.connect(hi);
hi.connect(context.destination);



//
// The difficult bit
//
// ## Scenarios
//
// 1. When a track is finished, we load another.
// 2. When you request a new track, and the currently playing track is finished
//    while the new one is still loading, do not load another.
// 3. When you request a new track, and a track is still/already loading,
//    dismiss the track that is already loading.
// 4. When you're on a slow connection and the playback has stopped because of buffering,
//    then we need to report that to the user.
// 5. If we request the same track that is currently playing, nothing should happen.
// 6. ?
//
// ## Notes
//
// At all costs, playback performance is the most important bit.
// Or in other words, the faster we can play a track, the better.
//
// ## Tricky technical issues
//
// - Not sure if this has been fixed yet in Chrome, but sometimes,
//   even after removing the audio element, it continues buffering.
//   Which increases the loading time for the next track, and that sucks.
// - The current time of the track needs to be rendered every second or
//   every 500ms. Passing this info to Elm may be overkill?
//
// ## Context
//
// Not the audio context, but the environmental context.
// We need certain pieces of information in order to do the right thing
// with a audio element. For example, if the track needs to be `repeated`.
// We should try to do most of this contextual work in Elm, but sometimes
// it's easier to have the information here.

function createAudioElement(environmentalContext, queueItem) {
  if (!src) console.error("audioElement, missing `src`");
  if (!trackId) console.error("audioElement, missing `trackId`");

  // new
  let newNode;
  let timestampInMilliseconds = Date.now();

  newNode = new window.Audio();
  newNode.setAttribute("crossorigin", "anonymous");
  newNode.setAttribute("crossOrigin", "anonymous");
  newNode.setAttribute("preload", "none");
  newNode.setAttribute("src", queueItem.url);
  newNode.setAttribute("rel", queueItem.id);
  newNode.setAttribute("data-timestamp", timestampInMilliseconds);

  newNode.volume = 1;
  // TODO: newNode.currentTime = 0.00001;
  // fixes no-volume issue

  newNode.addEventListener("error", audioErrorEvent);
  newNode.addEventListener("timeupdate", audioTimeUpdateEvent.bind(environmentalContext));
  newNode.addEventListener("ended", audioEndEvent.bind(environmentalContext));
  newNode.addEventListener("play", audioPlayEvent.bind(environmentalContext));
  newNode.addEventListener("pause", audioPauseEvent.bind(environmentalContext));
  newNode.addEventListener("canplay", audioCanPlayEvent.bind(environmentalContext));

  newNode.load();

  audioElementsContainer.appendChild(newNode);

  return newNode;
}


// `createAudioElement` related

function audioElementTrackId(node) {
  return node ? node.getAttribute("rel") : undefined;
}


function isActiveAudioElement(environmentalContext, node) {
  return environmentalContext.activeQueueItem.id === audioElementTrackId(node);
}


function audioErrorEvent(event) {
  console.error(`Audio error for '${ audioElementTrackId(event.target) }'`);

  switch (e.target.error.code) {
    case event.target.error.MEDIA_ERR_ABORTED:
      console.error("You aborted the audio playback.");
      break;
    case event.target.error.MEDIA_ERR_NETWORK:
      console.error("A network error caused the audio download to fail.");
      break;
    case event.target.error.MEDIA_ERR_DECODE:
      console.error("The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.");
      break;
    case event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      console.error("The audio not be loaded, either because the server or network failed or because the format is not supported.");
      break;
    default:
      console.error("An unknown error occurred.");
  }
}


function audioTimeUpdateEvent(event) {
  if (isActiveAudioElement(this, event.target) === false) return;
  // TODO
}


function audioEndEvent(event) {
  if (isActiveAudioElement(this, event.target) === false) return;
  this.elm.ports.activeQueueItemEnded.send();
}


function audioPlayEvent(event) {
  if (isActiveAudioElement(this, event.target) === false) return;
  // TODO: this.elm.ports.setIsPlaying.send(true);
}


function audioPauseEvent(event) {
  if (isActiveAudioElement(this, event.target) === false) return;
  // TODO: this.elm.ports.setIsPlaying.send(false);
}


function audioCanPlayEvent(event) {
  if (isActiveAudioElement(this, event.target) === false) return;
  // TODO?
}



//
// Blowing stuff up
// 💥
//

function removeOlderAudioElements(timestamp) {
  // Remove all the audio elements with a timestamp older than the given one.
  const nodes = audioElementsContainer.querySelectorAll('audio[data-timestamp]');

  nodes.forEach(node => {
    const t = parseInt(node.getAttribute("data-timestamp"), 10);
    if (t < timestamp) audioElementsContainer.removeChild(node);
  });
}
