export class WaveformVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.canvasContext = this.canvas.getContext("2d");
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
