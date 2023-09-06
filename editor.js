function initialize() {
  // Reset the textarea value
  const textarea = document.getElementById("editor-textarea");
  textarea.value = "00";

  // Init the top cell content
  const header = document.getElementById("headerRow");
  for (let i = 0; i < 16; i++)
    header.innerHTML += (0 + i.toString(16)).slice(-2) + " ";
}

function handleFileChange() {
  const fileInput = document.getElementById("file-input");
  let hexString = "";

  // Read the uploaded file as an ArrayBuffer
  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(fileInput.files[0]);
  fileReader.onload = function () {
    const byteArray = new Uint8Array(fileReader.result);
    for (let byte of byteArray) {
      hexString += byte.toString(16).padStart(2, "0");
    }
    const textarea = document.getElementById("editor-textarea");
    textarea.value = hexString;
    textarea.oninput();
  };
}

function handleTextInput() {
  const textarea = document.getElementById("editor-textarea");
  const offsetColumn = document.getElementById("offset-column");
  const asciiColumn = document.getElementById("ascii-column");

  // Count hex chars before caret
  let hexCount = textarea.value
    .substring(0, textarea.selectionStart)
    .replace(/[^0-9A-F]/gi, "").length;

  // Format hex
  textarea.value = textarea.value
    .replace(/[^0-9A-F]/gi, "")
    .replace(/(..)/g, "$1 ")
    .replace(/ $/, "")
    .toUpperCase();

  // Update textarea height
  textarea.style.height = 1.5 + textarea.value.length / 47 + "em";

  // Populate offset column
  let offsetText = "";
  for (let i = 0; i < textarea.value.length / 48; i++) {
    offsetText += (1e7 + (16 * i).toString(16)).slice(-8) + " ";
  }
  offsetColumn.innerHTML = offsetText;

  // Populate ascii column
  let asciiText = "";
  for (let i = 0; i < textarea.value.length; i += 3) {
    let charCode = parseInt(textarea.value.substr(i, 2), 16);
    asciiText +=
      charCode >= 32 && charCode < 127 ? String.fromCharCode(charCode) : ".";
  }
  asciiText = asciiText.replace(/(.{16})/g, "$1 ");
  asciiColumn.innerHTML = asciiText;

  // Adjust caret position
  if (textarea.value[hexCount] == " ") {
    hexCount--;
  }
  textarea.setSelectionRange(hexCount, hexCount);
}

function saveFile() {
  const textarea = document.getElementById("editor-textarea");
  let y = [];

  (textarea.value + " ").replace(/(..) /g, function (k) {
    y.push(parseInt(k, 16));
  });

  location =
    "data:application/octet-stream;base64," +
    btoa(String.fromCharCode.apply(!1, new Uint8Array(y)));
}
