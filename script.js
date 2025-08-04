const fileInput = document.getElementById("fileInput");
const fileLabel = document.getElementById("fileLabel");
const outputDiv = document.getElementById("output");
const formContainer = document.getElementById("form-container");
const headerSelect = document.getElementById("header");
const headerTextContainer = document.getElementById("headerTextContainer");
const headerTextInput = document.getElementById("headerText");
const urlError = document.getElementById("urlError");
const paramCount = document.getElementById('paramCount');
const dropZone = document.getElementById("dropZone");

fileInput.addEventListener("change", handleFile);

headerSelect.addEventListener("change", () => {
  const selected = headerSelect.value;
  if (selected) {
    headerTextContainer.classList.remove("hidden");
  } else {
    headerTextContainer.classList.add("hidden");
  }
});

headerTextInput.addEventListener("input", () => {
  const type = headerSelect.value;
  const url = headerTextInput.value.trim();
  if (validateURL(url, type)) {
    headerTextInput.style.border = "1px solid #ccc";
    urlError.textContent = "";
  } else {
    headerTextInput.style.borderColor = "red";
    urlError.textContent = "URL inválida para el tipo seleccionado.";
  }
});

paramCount.addEventListener("change", function () {
  const selected = parseInt(this.value);
  const headers = loadedRows[0];
  const container = document.getElementById("paramMappingContainer");
  container.innerHTML = "";

  if (!selected || selected < 1) return;

  const telefonoValue = document.getElementById("telefonoMapping").value;

  for (let i = 1; i <= selected; i++) {
    const div = document.createElement("div");
    div.classList.add("form-section");

    const label = document.createElement("label");
    label.textContent = `Parámetro ${i}: `;

    const select = document.createElement("select");
    select.name = `param${i}`;
    select.dataset.index = i;
    select.classList.add("param-select");

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona columna";
    select.appendChild(defaultOption);

    // Crear opciones excluyendo teléfono
    headers.forEach(header => {
      if (header !== telefonoValue) {
        const option = document.createElement("option");
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      }
    });

    div.appendChild(label);
    div.appendChild(select);
    container.appendChild(div);
  }

  // Aplicar lógica de bloqueo por duplicado
  container.querySelectorAll(".param-select").forEach(select => {
    select.addEventListener("change", updateParamSelects);
  });

  // Ejecutar actualización inicial para tener en cuenta el valor de teléfono
  updateParamSelects();
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault(); // Permitir soltar
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files; // Asignar al input
    handleFile({ target: fileInput }); // Reusar tu función existente
  }
});




/* FUNCIONES */
//Actualiza las opciones tanto de teléfono como de los parámetros según los headers del archivo adjunto
function updateParamSelects() {
  const selects = document.querySelectorAll(".param-select");
  const telefonoValue = document.getElementById("telefonoMapping").value;
  const selectedValues = Array.from(selects)
    .map(s => s.value)
    .filter(v => v !== "");

  if (telefonoValue) selectedValues.push(telefonoValue); // evitar duplicado con teléfono

  selects.forEach(select => {
    const currentValue = select.value;
    const options = Array.from(select.options);

    options.forEach(option => {
      if (option.value === "") {
        option.disabled = false;
      } else {
        option.hidden = selectedValues.includes(option.value) && option.value !== currentValue;
      }
    });
  });
}

//Valida la URL del contenido de la plantilla
function validateURL(url, type) {
  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.split('.').pop().toLowerCase();

    const rules = {
      image: ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
      video: ['mp4', 'webm', 'ogg'],
      document: ['pdf', 'txt'],
    };

    return rules[type]?.includes(ext);
  } catch {
    return false;
  }
}

let currentPage = 1;
const rowsPerPage = 5;
let loadedRows = [];

//Manejo general al archivo y función de las seccion de adjunto
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const validExtensions = [".csv", ".xls", ".xlsx"];
  const fileName = file.name.toLowerCase();
  const isValid = validExtensions.some(ext => fileName.endsWith(ext));

  if (!isValid) {
    fileError.classList.remove("hidden");
    fileLabel.textContent = "Ningún archivo seleccionado";
    fileInput.value = "";
    dropZone.classList.remove("valid");
    return;
  } else {
    fileError.classList.add("hidden");
    fileLabel.textContent = file.name;
    dropZone.classList.add("valid");
  }

  const reader = new FileReader();
  const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

  reader.onload = (e) => {
    let rows;
    if (isExcel) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      const text = e.target.result;
      rows = text.split("\n").map(line => line.split(","));
    }
    displayFileContent(rows);
  };

  if (isExcel) reader.readAsArrayBuffer(file);
  else reader.readAsText(file);
}

//Despliega el contenido del archivo adjunto
function displayFileContent(rows) {
  if (!rows.length) {
    outputDiv.innerHTML = "<p>No se encontraron datos en el archivo.</p>";
    return;
  }

  loadedRows = rows;
  currentPage = 1;

  // Detectar columnas y actualizar paramCount
  const headers = rows[0];
  const paramLimit = headers.length > 1 ? headers.length - 1 : 0;

  paramCount.innerHTML = '<option value="">Sin parámetros</option>';
  for (let i = 1; i <= paramLimit; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    paramCount.appendChild(option);
  }

  // Actualizar el campo de Teléfono con encabezados
  const telefonoSelect = document.getElementById("telefonoMapping");
  telefonoSelect.innerHTML = '<option value="">Selecciona</option>';

  headers.forEach(header => {
    const option = document.createElement("option");
    option.value = header;
    option.textContent = header;
    telefonoSelect.appendChild(option);
  });

  // Mostrar todo el formulario una vez cargado el archivo
  formContainer.classList.remove("hidden");

  //Mostrar el campo para seleccionar la cantidad de parámetros
  document.getElementById("paramCountSection").classList.remove("hidden");

  // Limpiar campos de parámetros si ya habían
  document.getElementById('paramMappingContainer').innerHTML = '';

  //Crear tabla de previsualización
  createTable();

  document.getElementById("telefonoMapping").addEventListener("change", updateParamSelects);
}

//Crea la tabla de previsualización
function createTable() {
  const totalRows = loadedRows.length - 1;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(start + rowsPerPage - 1, loadedRows.length - 1);

  let table = "<table><thead><tr>";
  loadedRows[0].forEach(header => {
    table += `<th>${header || ''}</th>`;
  });
  table += "</tr></thead><tbody>";

  for (let i = start; i <= end; i++) {
    table += "<tr>";
    loadedRows[i].forEach(cell => {
      table += `<td>${cell || ''}</td>`;
    });
    table += "</tr>";
  }
  table += "</tbody></table>";

  outputDiv.innerHTML = table + createPagination(totalPages);
}

//Crea o actualiza la paginación de la tabla
function createPagination(totalPages) {
  const maxPagesToShow = 10;
  let startPage = Math.max(1, currentPage - (maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  let html = `<div class="pagination">`;

  if (currentPage > 1) {
    html += `<button onclick="goToPage(1)">«</button>`;
    html += `<button onclick="goToPage(${currentPage - 1})">‹</button>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
  }

  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})">›</button>`;
    html += `<button onclick="goToPage(${totalPages})">»</button>`;
  }

  html += `</div>`;
  return html;
}

//Permite manejar la paginación de la tabla
function goToPage(page) {
  currentPage = page;
  createTable();
}

//Valida que la información esté diligenciada antes de enviar la campaña
function validarFormularioParaEnvio() {
  const templateName = document.getElementById("templateName").value.trim();
  const language = document.getElementById("language").value;
  const header = document.getElementById("header").value;
  const headerText = document.getElementById("headerText").value.trim();
  const telefonoMapping = document.getElementById("telefonoMapping").value;

  if (!templateName || !language || !header || !headerText || !telefonoMapping) {
    alert("Completa todos los campos obligatorios.");
    return false;
  }

  if (!loadedRows || loadedRows.length <= 1) {
    alert("Debes cargar un archivo válido con contenido.");
    return false;
  }

  const headers = loadedRows[0];
  if (headers.indexOf(telefonoMapping) === -1) {
    alert(`La columna de teléfono "${telefonoMapping}" no se encuentra en el archivo.`);
    return false;
  }

  /* const paramSelects = document.querySelectorAll(".param-select");
  if (paramSelects.length === 0) {
    alert("Debes seleccionar al menos un parámetro.");
    return false;
  }

  for (const select of paramSelects) {
    if (!select.value || headers.indexOf(select.value) === -1) {
      alert("Todos los parámetros deben tener columnas válidas del archivo.");
      return false;
    }
  } */

  return true;
}


// Función principal de ejecución de campaña, se ejecuta al dar clic al botón
async function SendCampaign() {
  /* if (!validarFormularioParaEnvio()) return; */

  const token = await getToken();
  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo obtener el token"
    });
    return;
  }

  const headers = loadedRows[0];
  const telefonoIndex = headers.indexOf(document.getElementById("telefonoMapping").value);

  const templateName = document.getElementById("templateName").value.trim();
  const language = document.getElementById("language").value;
  const header = document.getElementById("header").value;
  const headerText = document.getElementById("headerText").value.trim();

  const paramSelects = document.querySelectorAll(".param-select");
  const paramIndexes = Array.from(paramSelects).map(select => headers.indexOf(select.value));

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const allPayloads = [];
  const total = loadedRows.length - 1;
  let enviados = 0;

  // 🟢 ELEMENTOS DE PROGRESO
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressInfo = document.getElementById("progressInfo");

  // Mostrar barra de progreso
  progressContainer.classList.remove("hidden");
  const start = Date.now();

  for (let i = 1; i < loadedRows.length; i++) {
    const row = loadedRows[i];
    const telefono = row[telefonoIndex];
    if (!telefono) continue;

    const paramValues = paramIndexes.map(index => {
      const val = row[index] || "";
      return `<<${val}>>`;
    });

    /* const textBody = `WhatsApp_Template;${templateName};${language};${header};${headerText};${paramValues.join(" ")}`; */

    //Arma el body en función de la información ingresada
    let textParts = ["WhatsApp_Template", templateName, language];
    if (header) {
      textParts.push(header);
      if (headerText) {
        textParts.push(headerText);
      }
    }
    textParts.push(paramValues.join(""));
    const textBody = textParts.join(";");


    const payload = {
      toAddressMessengerType: "open",
      /* fromAddress: "f7f36432-adc5-4873-9ac1-8071db43511a", */
      fromAddress: "a39ba159-dc23-4ecc-bc80-51d436836224",
      toAddress: telefono,
      textBody: textBody
    };

    CallApiAgentless(/* token,  */payload)

    allPayloads.push(payload);

    // 🟡 ACTUALIZAR PROGRESO
    enviados++;
    const remaining = (total - enviados) * 250;
    const remainingSec = Math.max(0, Math.floor(remaining / 1000));
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;
    const percent = (enviados / total) * 100;

    progressBar.style.width = `${percent}%`;
    progressInfo.textContent = `${enviados} de ${total} enviados - Tiempo restante: ${minutes}m ${seconds}s`;

    await delay(250); // 4 por segundo
  }

  console.log("Payloads enviados:", allPayloads);
  /* alert("Campaña finalizada."); */
  Swal.fire({ title: "¡Campaña finalizada!", /*text: "¡Campaña finalizada!",*/ icon: "success" });
}

//Obtener el token de acceso a Genesys
async function getToken1() {
  /* const clientId = "3c7d1e6d-2df4-4ac3-80fe-095bca5c0c9d";
  const clientSecret = "OQYhRQ4QZ3yIxY_uRS8ZODEl2kQOKt_5DdzoEAeNB0E";
  const environment = "mypurecloud.com"; */
  const clientId = "f2a5d6ef-3bee-46aa-a030-26da701878bd";
  const clientSecret = "JLNDulNesyZQwUuE4tVQcd7Jt48Q2tAUSyukt8wPyeY";
  const environment = "sae1.pure.cloud";

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    /* const response = await fetch(`https://login.${environment}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: params
    }); */

    const response = await fetch(`https://login.${environment}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
      },
      body: params
    })

    const data = await response.json();
    console.log(data.access_token);
    return data.access_token;
  } catch (error) {
    console.error("getToken(). Error al obtener token:\n", error);
    return null;
  }
}

//Funcionamiento de la Api Agentless
async function CallApiAgentless(/* token, */ body) {
  /* const platformClient = require("purecloud-platform-client-v2");

  const client = platformClient.ApiClient.instance;
  client.setEnvironment(platformClient.PureCloudRegionHosts.us_east_1); // Genesys Cloud region

  // Manually set auth token or use loginImplicitGrant(...) or loginClientCredentialsGrant(...) or loginPKCEGrant(...)
  const temp_token = "fwKYPtCNc39nJhH-m2J5ujJNi_6gxLLMxn_jzckuIgMTogCMra6MEonYQZFUnmbstmWwRJ6v9zW4KzOpSBc-WQ";
  client.setAccessToken(temp_token);
  console.log("Token: " + temp_token); */

  let apiInstance = new platformClient.ConversationsApi();

  let opts = {
    "useNormalizedMessage": false // Boolean | If true, response removes deprecated fields (textBody, messagingTemplate)
  };

  // Send an agentless outbound message
  apiInstance.postConversationsMessagesAgentless(body, opts)
    .then((data) => {
      console.log(`postConversationsMessagesAgentless success! data: ${JSON.stringify(data, null, 2)}`);
    })
    .catch((err) => {
      console.log("There was a failure calling postConversationsMessagesAgentless");
      console.error(err);
    });
}


