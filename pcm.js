export const MONO = 1;
const BITS_IN_BYTE = 8;

export const bufferToPCM = (arrayBuffer, bitDepth) => {
  const byteLength = arrayBuffer.byteLength;
  const bytesPerSample = getBytesPerSample(bitDepth);
  const numSamples = getNumSamples(byteLength, bytesPerSample);

  //   const pcmArray = new Float32Array(numSamples);

  //   for (let i = 0; i < numSamples; i++) {
  //     const sample = bytesToInt(byteArray, i * bytesPerSample, bytesPerSample);
  //     pcmArray[i] = normalize(sample, bitDepth, sample);
  //   }

  const pcmArray = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    for (let b = 0; b < bytesPerSample; b++) {
      sample <<= 8;
      sample |= arrayBuffer[i * bytesPerSample + b];
    }
    pcmArray[i] = sample / Math.pow(2, bitDepth);
  }

  return pcmArray;
};

export const getNumSamples = (byteLength, bytesPerSample) => {
  return byteLength / bytesPerSample;
};

const getBytesPerSample = (bitDepth) => {
  return bitDepth / BITS_IN_BYTE;
};

const bytesToInt = (byteArray, start, length) => {
  let value = 0;
  for (let i = start; i < start + length; i++) {
    value <<= 8;
    value |= byteArray[i];
  }
  return value;
};

const normalize = (sample, bitDepth) => {
  return sample / Math.pow(2, bitDepth);
};
