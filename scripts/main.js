import { WaveformVisualizer } from "./waveformVisualizer.js";

class AudioPlayer {
  constructor(
    audioFileInputId,
    playButtonId,
    scrubControlId,
    bitDepthControlId,
    saveButtonId,
    canvasId
  ) {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.audioFileInput = document.getElementById(audioFileInputId);
    this.playButton = document.getElementById(playButtonId);
    this.scrubControl = document.getElementById(scrubControlId);
    this.bitDepthControl = document.getElementById(bitDepthControlId);
    this.saveButton = document.getElementById(saveButtonId);
    // this.visualizer = new WaveformVisualizer(canvasId);

    this.arrayBuffer = null;
    this.audioBuffer = null;
    this.source = null;
    this.startTime = null;
    this.playbackOffset = 0;
    this.isPlaying = false;
    this.manualPause = false;
    this.bitDepth = 1;

    this.audioFileInput.addEventListener("change", (event) => {
      this.loadAudioFile(event);
    });
    this.playButton.addEventListener("click", () => {
      this.togglePlay();
    });
    this.saveButton.addEventListener("click", () => {
      this.saveAudioBuffer();
    });

    this.scrubControl.addEventListener("input", () => {
      if (this.isPlaying) {
        this.pause(true);
      }
      this.playbackOffset = this.scrubControl.valueAsNumber;
      this.play(true);
    });
    this.bitDepthControl.addEventListener("input", () => {
      this.bitDepth = this.bitDepthControl.valueAsNumber;
      if (this.isPlaying) {
        this.pause(true);
        this.play(true);
      }
    });
  }

  loadAudioFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      this.arrayBuffer = reader.result;
      this.playButton.disabled = false;
      this.saveButton.disabled = false;
      this.scrubControl.disabled = false;
    };
  }

  updateSource() {
    if (this.source) {
      this.source.onended = null;
      this.source.disconnect();
    }
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.audioContext.destination);
    this.source.onended = () => {
      this.reset();
    };
  }

  pcm(buffer, bitDepth = 1) {
    const bytesPerSample = bitDepth / 8;
    const numSamples = buffer.byteLength / bytesPerSample;

    const audioBuffer = this.audioContext.createBuffer(
      1,
      numSamples,
      this.audioContext.sampleRate
    );

    const dataView = new DataView(buffer);
    const pcmArray = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      let sample = 0;
      for (let byte = 0; byte < bytesPerSample; byte++) {
        sample = (sample << 8) + dataView.getUint8(i * bytesPerSample + byte);
      }

      const maxValue = Math.pow(2, bitDepth);
      pcmArray[i] = sample / maxValue;
    }

    audioBuffer.getChannelData(0).set(pcmArray);

    return audioBuffer;
  }

  togglePlay() {
    if (!this.arrayBuffer) return;
    this.isPlaying ? this.pause() : this.play();
  }

  play(fromScrub = false) {
    this.setAudioBuffer();
    // this.visualizer.drawWaveform(this.audioBuffer);
    this.setAudioStartTime();
    this.updateSource();
    this.source.start(0, this.playbackOffset);
    if (!fromScrub) {
      this.manualPause = false;
    }
    this.isPlaying = true;
    this.playButton.innerText = "Pause";
    this.updateScrubControl();
  }

  setAudioBuffer() {
    this.audioBuffer = this.pcm(this.arrayBuffer, this.bitDepth);
    this.scrubControl.max = this.audioBuffer.duration;
  }

  setAudioStartTime() {
    this.startTime = this.audioContext.currentTime - this.playbackOffset;
  }

  pause(fromScrub = false) {
    this.playbackOffset = this.audioContext.currentTime - this.startTime;
    this.source.stop();
    if (!fromScrub) {
      this.manualPause = true;
    }
  }

  reset() {
    this.isPlaying = false;
    this.playButton.innerText = "Play";
  }

  updateScrubControl() {
    if (!this.isPlaying) return;
    this.scrubControl.value = this.audioContext.currentTime - this.startTime;
    requestAnimationFrame(() => this.updateScrubControl());
  }

  saveAudioBuffer() {
    if (!this.audioBuffer) return;

    const numberOfChannels = this.audioBuffer.numberOfChannels;
    const sampleRate = this.audioBuffer.sampleRate;
    const length = this.audioBuffer.length;
    const data = new Float32Array(length * numberOfChannels);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = this.audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }

    const buffer = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + data.length * 2, true);
    writeString(view, 8, "WAVE");

    // fmt sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);

    // data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, data.length * 2, true);

    // write the PCM samples
    const offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(
        offset + i * 2,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
    }

    const blob = new Blob([view], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    document.getElementById("saveLinkContainer").appendChild(link);
    link.href = url;
    link.download = "audio.wav";
    link.click();
  }
}
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const player = new AudioPlayer(
  "audioFile",
  "playButton",
  "scrubControl",
  "bitDepthControl",
  "saveButton",
  "waveformCanvas"
);
