class WaveformVisualizer {
  constructor(canvasId, audioFileInputId) {
    this.audioFileInput = document.getElementById(audioFileInputId);
    this.canvas = document.getElementById(canvasId);
    this.canvasContext = this.canvas.getContext("2d");
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.audioFileInput.addEventListener("change", (event) => {
      this.loadAudio(event);
    });
  }

  loadAudio(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = () => {
      this.audioContext.decodeAudioData(reader.result, (buffer) => {
        this.drawWaveform(buffer);
      });
    };
  }

  drawWaveform(audioBuffer) {
    const audioData = audioBuffer.getChannelData(0);
    const stepSize = Math.ceil(audioData.length / this.canvas.width);
    const ampScale = this.canvas.height / 2;

    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(0, ampScale);

    for (let i = 0; i < audioData.length; i += stepSize) {
      const x = i / stepSize;
      const y = ampScale + audioData[i] * ampScale;
      this.canvasContext.lineTo(x, y);
    }

    this.canvasContext.lineTo(this.canvas.width, ampScale);
    this.canvasContext.stroke();
  }
}

// Usage:
const visualizer = new WaveformVisualizer("waveformCanvas", 'audioFile');
