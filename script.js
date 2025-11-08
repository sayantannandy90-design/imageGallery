// =================== CONFIG ===================
const blobUrl = "https://imagestorage87.blob.core.windows.net";
const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-11-15T14:30:27Z&st=2025-11-08T06:15:27Z&spr=https&sig=3KnRcUnONtjasDTwmv8Zp5HomsTxWETzi1MuGf1Y2Y4%3D";
const containerName = "images";

const ANALYZE_URL = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/analyze?code=pu_k1BNWsJhXL7L2HYCCrenRn1cOdUhRcFpByLcRNt-eAzFuC0FioQ==";
const IMAGES_URL  = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/images?code=hCjbKkSNaExERwr7z5WH9udG-TGdVzU4Up4ugNixNmjIAzFuh7NXZg==";
const DELETE_URL = "https://gallery-func-app-a8btegakewhnhddg.centralindia-01.azurewebsites.net/api/delete?code=fZqmLof9XYSBprkrEMHTcSlD8xo1cFYFA1Ku7YNfxEn_AzFu_9gKIw==";


// =================== UI ELEMENTS ===================
const albumSelect = document.getElementById("albumSelect");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const newAlbumInput = document.getElementById("newAlbum");


// =================== LOAD IMAGES ===================
async function loadAlbum() {
    const album = albumSelect.value;
    gallery.innerHTML = `<p>Loading...</p>`;

    const res = await fetch(`${IMAGES_URL}&album=${album}`);
    const data = await res.json();

    gallery.innerHTML = "";

    if (!data.length) {
        gallery.innerHTML = `<p>No images in this album.</p>`;
        return;
    }

    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "imgItem";
        div.innerHTML = `
            <img src="${item.url}" />
            <p>${item.caption || ""}</p>
            <p><small>${(item.tags || []).join(", ")}</small></p>
        `;
        gallery.appendChild(div);
    });
}


// =================== UPLOAD IMAGE ===================
async function uploadImage() {
    const file = fileInput.files[0];
    let album = albumSelect.value;

    if (!file) return alert("Select a file!");

    // If user wants new album
    if (newAlbumInput.value.trim()) {
        album = newAlbumInput.value.trim();
        let opt = document.createElement("option");
        opt.value = album;
        opt.textContent = album;
        albumSelect.appendChild(opt);
        albumSelect.value = album;
    }

    const blobName = `${file.name}`;
    const uploadUrl = `${blobUrl}/${containerName}/${album}/${blobName}?${sasToken}`;

    console.log("Uploading →", uploadUrl);

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

    alert("Added + Tagged ✅");
    loadAlbum();
}
async function deleteImage(album, name) {
  if (!confirm("Delete this image?")) return;

  try {
    const res = await fetch(DELETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album, name })
    });

    const json = await res.json();
    console.log("Delete →", json);

    // reload album after success
    loadAlbum(album);

  } catch (e) {
    console.error("Delete error", e);
    alert("Failed to delete image");
  }
}


// =================== INIT ===================
uploadBtn.onclick = uploadImage;
albumSelect.onchange = loadAlbum;

loadAlbum();
