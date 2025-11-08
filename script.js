// =================== CONFIG ===================
const blobUrl = "https://imagestorage87.blob.core.windows.net";
const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-11-15T14:30:27Z&st=2025-11-08T06:15:27Z&spr=https&sig=3KnRcUnONtjasDTwmv8Zp5HomsTxWETzi1MuGf1Y2Y4%3D";
const containerName = "images";

const ANALYZE_URL = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/analyze?code=pu_k1BNWsJhXL7L2HYCCrenRn1cOdUhRcFpByLcRNt-eAzFuC0FioQ==";
const IMAGES_URL  = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/images?code=hCjbKkSNaExERwr7z5WH9udG-TGdVzU4Up4ugNixNmjIAzFuh7NXZg==";
const DELETE_URL = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/delete?code=fZqmLof9XYSBprkrEMHTcSlD8xo1cFYFA1Ku7YNfxEn_AzFu_9gKIw==";


// =================== UI ELEMENTS ===================
const albumSelect = document.getElementById("albumSelector");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const newAlbumInput = document.getElementById("newAlbum");


// =================== LOAD ALBUM IMAGES ===================
async function loadAlbum(album) {
  if (!album) album = albumSelect.value;

  gallery.innerHTML = `<p class="text-gray-500">Loading...</p>`;

  const res = await fetch(`${IMAGES_URL}&album=${album}`);
  const data = await res.json();

  gallery.innerHTML = "";

  if (!data.length) {
    gallery.innerHTML = `<p class="text-gray-400 text-center">No images in this album.</p>`;
    return;
  }

  renderGallery(data);
}


// =================== RENDER IMAGES ===================
function renderGallery(images) {
  gallery.innerHTML = "";

  images.forEach(img => {
    const card = document.createElement("div");
    card.className = "img-card";

    card.innerHTML = `
      <img src="${img.url}" class="photo"/>

      <div class="p-4">
        <p class="font-semibold text-gray-800 mb-1">
          ${img.caption || "No caption"}
        </p>

        <p class="text-xs text-gray-500 mb-3">
          ${(img.tags || []).join(", ")}
        </p>

        <button 
          class="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
          onclick="deleteImage('${img.album}', '${img.name}')">
          Delete
        </button>
      </div>
    `;

    gallery.appendChild(card);
  });
}


// =================== CREATE ALBUM ===================
function createAlbum() {
  let album = newAlbumInput.value.trim();
  if (!album) return alert("Enter album name");

  let opt = document.createElement("option");
  opt.value = album;
  opt.textContent = album;

  albumSelect.appendChild(opt);
  albumSelect.value = album;
  newAlbumInput.value = "";

  loadAlbum(album);
}


// =================== UPLOAD IMAGE ===================
async function uploadImage() {
  const file = fileInput.files[0];
  let album = albumSelect.value;

  if (!file) return alert("Select a file!");

  if (newAlbumInput.value.trim()) {
    album = newAlbumInput.value.trim();
    let opt = document.createElement("option");
    opt.value = album;
    opt.textContent = album;
    albumSelect.appendChild(opt);
    albumSelect.value = album;
  }

  const blobName = file.name;
  const uploadUrl = `${blobUrl}/${containerName}/${album}/${blobName}?${sasToken}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" },
    body: file
  });

  if (!res.ok) return alert("Upload failed!");

  alert("Uploaded ✅ — AI analyzing...");

  await fetch(ANALYZE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ album, name: blobName })
  });

  alert("Tagged + Stored ✅");
  loadAlbum(album);
}


// =================== DELETE IMAGE ===================
async function deleteImage(album, name) {
  if (!confirm("Delete this image?")) return;

  const res = await fetch(DELETE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ album, name })
  });

  const json = await res.json();
  console.log(json);

  loadAlbum(album);
}


// =================== INIT ===================
albumSelect.onchange = () => loadAlbum(albumSelect.value);
loadAlbum();

