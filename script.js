// ✅ ✅ UPDATE THESE 3 VALUES ONLY
const blobUrl = "https://imagestorage87.blob.core.windows.net";   // ✅ NO SAS, NO container
const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-11-15T14:30:27Z&st=2025-11-08T06:15:27Z&spr=https&sig=3KnRcUnONtjasDTwmv8Zp5HomsTxWETzi1MuGf1Y2Y4%3D";                     // ✅ WITHOUT leading '?'
const containerName = "images";                                   // ✅ must match portal name


// ✅ UPLOAD FUNCTION
async function uploadImage() {
  const fileInput = document.getElementById("fileInput");
  const album = document.getElementById("albumSelect").value;

  if (!fileInput.files.length) {
    alert("Select a file first");
    return;
  }

  const file = fileInput.files[0];
  const fileName = `${album}/${file.name}`;

  const uploadUrl = `${blobUrl}/${containerName}/${fileName}?${sasToken}`;
  console.log("Uploading to:", uploadUrl);

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" },
    body: file
  });

  if (response.ok) {
    alert("✅ Uploaded Successfully!");
    loadImages();
  } else {
    alert("❌ Upload failed");
    console.log("Upload error:", await response.text());
  }
}


// ✅ DELETE FUNCTION
async function deleteImage(imgName) {
  if (!confirm("Delete this image?")) return;

  const deleteUrl = `${blobUrl}/${containerName}/${imgName}?${sasToken}`;
  console.log("Deleting:", deleteUrl);

  const response = await fetch(deleteUrl, { method: "DELETE" });

  if (response.ok) {
    alert("✅ Deleted successfully");
    loadImages();
  } else {
    alert("❌ Delete failed");
    console.log(await response.text());
  }
}


// ✅ LIST + DISPLAY IMAGES
async function loadImages() {
  const listUrl = `${blobUrl}/${containerName}?restype=container&comp=list&${sasToken}`;
  console.log("Listing:", listUrl);

  const res = await fetch(listUrl);
  const xml = await res.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  const images = xmlDoc.getElementsByTagName("Name");
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  for (let i = 0; i < images.length; i++) {
    const imgName = images[i].childNodes[0].nodeValue;

    if (!imgName.match(/\.(jpeg|jpg|png|gif|webp)$/i)) continue;

    const imgUrl = `${blobUrl}/${containerName}/${imgName}?${sasToken}`;

    const item = document.createElement("div");
    item.className = "item";

    const imgElement = document.createElement("img");
    imgElement.src = imgUrl;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteImage(imgName);

    item.appendChild(imgElement);
    item.appendChild(deleteBtn);
    gallery.appendChild(item);
  }
}


// ✅ CALL ON START
loadImages();
