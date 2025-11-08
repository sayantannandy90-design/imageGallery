// === Configuration ===
const blobUrl = "https://imagestorage87.blob.core.windows.net";
const sasToken = "PASTE_YOUR_SAS_HERE";
const containerName = "images";

let albums = [];
let currentAlbum = null;

// === Load albums ===
async function loadAlbums() {
  const listUrl = `${blobUrl}/${containerName}?restype=container&comp=list&${sasToken}`;
  const res = await fetch(listUrl);
  const xml = await res.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  const blobs = xmlDoc.getElementsByTagName("Name");

  const set = new Set();
  for (let i = 0; i < blobs.length; i++) {
    const name = blobs[i].textContent;
    const folder = name.split("/")[0];
    if (folder) set.add(folder);
  }
  albums = Array.from(set);
  renderAlbumList();
}

// === Render album sidebar ===
function renderAlbumList() {
  const div = document.getElementById("albumList");
  div.innerHTML = "";

  albums.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className =
      "block w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition " +
      (a === currentAlbum ? "bg-blue-200 font-semibold" : "");
    btn.onclick = () => {
      currentAlbum = a;
      document.getElementById("albumTitle").textContent = a;
      loadImages();
    };
    div.appendChild(btn);
  });
}

// === Create album ===
function createAlbum() {
  const name = document.getElementById("newAlbumName").value.trim();
  if (!name) return alert("Enter an album name");

  const uploadUrl = `${blobUrl}/${containerName}/${name}/.keep?${sasToken}`;

  fetch(uploadUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" },
    body: ""
  }).then(() => {
    closeCreateAlbum();
    loadAlbums();
  });
}

function openCreateAlbum() {
  document.getElementById("albumModal").classList.remove("hidden");
  document.getElementById("newAlbumName").focus();
}

function closeCreateAlbum() {
  document.getElementById("albumModal").classList.add("hidden");
}

// === Load images from current album ===
async function loadImages() {
  if (!currentAlbum) {
    document.getElementById("gallery").innerHTML =
      "<p class='text-gray-500 italic'>Select an album to view images</p>";
    return;
  }

  const listUrl = `${blobUrl}/${containerName}?restype=container&comp=list&${sasToken}`;
  const res = await fetch(listUrl);
  const xml = await res.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  const blobs = xmlDoc.getElementsByTagName("Name");

  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  for (let i = 0; i < blobs.length; i++) {
    const name = blobs[i].textContent;
    if (!name.startsWith(currentAlbum + "/")) continue;
    if (!name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) continue;

    const url = `${blobUrl}/${containerName}/${name}?${sasToken}`;

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transform hover:scale-[1.02] transition cursor-pointer fade-in";

    const img = document.createElement("img");
    img.src = url;
    img.className = "w-full h-40 object-cover";
    img.onclick = () => openPreview(url);

    const footer = document.createElement("div");
    footer.className = "p-2 flex justify-between items-center";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = name.split("/").pop();
    nameSpan.className = "text-sm truncate w-[70%]";

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.className =
      "bg-red-500 text-white text-sm px-2 py-1 rounded hover:bg-red-600";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteImage(name);
    };

    footer.appendChild(nameSpan);
    footer.appendChild(delBtn);

    card.appendChild(img);
    card.appendChild(footer);
    gallery.appendChild(card);
  }
}

// === Upload image ===
async function uploadImage() {
  if (!currentAlbum) return alert("Select an album first");

  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Select a file");

  const file = fileInput.files[0];
  const fileName = `${currentAlbum}/${file.name}`;
  const uploadUrl = `${blobUrl}/${containerName}/${fileName}?${sasToken}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" },
    body: file
  });

  if (res.ok) {
    fileInput.value = "";
    loadImages();
  } else {
    alert("Upload failed");
  }
}

// === Delete image ===
async function deleteImage(name) {
  if (!confirm("Delete this image?")) return;

  const delUrl = `${blobUrl}/${containerName}/${name}?${sasToken}`;
  await fetch(delUrl, { method: "DELETE" });
  loadImages();
}

// === Image preview modal ===
function openPreview(url) {
  document.getElementById("previewImg").src = url;
  document.getElementById("previewModal").classList.remove("hidden");
}
function closePreview() {
  document.getElementById("previewModal").classList.add("hidden");
}

// === Init ===
loadAlbums();
