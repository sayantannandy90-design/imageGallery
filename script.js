// === Configuration ===
const blobUrl = "https://imagestorage87.blob.core.windows.net";
const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-11-15T14:30:27Z&st=2025-11-08T06:15:27Z&spr=https&sig=3KnRcUnONtjasDTwmv8Zp5HomsTxWETzi1MuGf1Y2Y4%3D";
const containerName = "images";

let albums = [];
let currentAlbum = null;


// === Load Albums ===
async function loadAlbums() {
  try {
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
  } catch (err) {
    console.error("Error loading albums:", err);
  }
}


// === Render Album Sidebar ===
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


// === Create Album ===
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


// === Load Images ===
async function loadImages() {
  if (!currentAlbum) {
    document.getElementById("gallery").innerHTML =
      "<p class='text-gray-500 italic'>Select an album to view images</p>";
    return;
  }

  try {
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
  } catch (err) {
    console.error("Error loading images:", err);
  }
}


// === Upload Image ===
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


// === Delete Image ===
async function deleteImage(name) {
  if (!confirm("Delete this image?")) return;

  const delUrl = `${blobUrl}/${containerName}/${name}?${sasToken}`;
  await fetch(delUrl, { method: "DELETE" });
  loadImages();
}


// === Preview Modal ===
function openPreview(url) {
  document.getElementById("previewImg").src = url;
  document.getElementById("previewModal").classList.remove("hidden");
}
function closePreview() {
  document.getElementById("previewModal").classList.add("hidden");
}


// === Init ===
loadAlbums();
