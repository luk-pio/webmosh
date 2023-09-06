class AudioPlayer {
  constructor(audioFileInputId, playButtonId, scrubControlId) {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.audioFileInput = document.getElementById(audioFileInputId);
    this.playButton = document.getElementById(playButtonId);
    this.scrubControl = document.getElementById(scrubControlId);

    this.audioBuffer = null;
    this.source = null;
    this.startTime = null;
    this.playbackOffset = 0;
    this.isPlaying = false;
    this.manualPause = false;

    this.audioFileInput.addEventListener("change", (event) => {
      this.loadAudioFile(event);
    });
    this.playButton.addEventListener("click", () => {
      this.togglePlay();
    });

    this.scrubControl.addEventListener("input", () => {
      if (this.isPlaying) {
        this.pause(true);
      }
      this.playbackOffset = this.scrubControl.valueAsNumber;
      this.play(true);
    });
  }

  loadAudioFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      if (file.type.startsWith("audio")) {
        this.audioBuffer = await this.audioContext.decodeAudioData(
          reader.result
        );
      } else {
        this.audioBuffer = this.convertToPCM(reader.result);
      }
      this.playButton.disabled = false;
      this.scrubControl.disabled = false;
      this.scrubControl.max = this.audioBuffer.duration;
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

  convertToPCM(buffer) {
    const audioBuffer = this.audioContext.createBuffer(
      1,
      buffer.byteLength,
      this.audioContext.sampleRate
    );
    const pcmData = new Float32Array(buffer.byteLength);

    // Convert each byte in the file to a number between -1.0 and 1.0.
    for (let i = 0; i < buffer.byteLength; i++) {
      pcmData[i] = new Uint8Array(buffer)[i] / 128 - 1;
    }

    audioBuffer.getChannelData(0).set(pcmData);
    return audioBuffer;
  }

  togglePlay() {
    if (!this.audioBuffer) return;
    this.isPlaying ? this.pause() : this.play();
  }

  play(fromScrub = false) {
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
}

const player = new AudioPlayer("audioFile", "playButton", "scrubControl");
