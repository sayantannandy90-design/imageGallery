const blobUrl = "https://imagestorage87.blob.core.windows.net";
const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-11-15T14:30:27Z&st=2025-11-08T06:15:27Z&spr=https&sig=3KnRcUnONtjasDTwmv8Zp5HomsTxWETzi1MuGf1Y2Y4%3D";
const containerName = "images";


async function uploadImage() {
  const fileInput = document.getElementById("fileInput");
  const album = document.getElementById("albumSelect").value;

  if (!fileInput.files.length) return alert("Select a file");

  const file = fileInput.files[0];
  const fileName = `${album}/${file.name}`;
  const uploadUrl = `${blobUrl}/${containerName}/${fileName}?${sasToken}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob" },
    body: file
  });

  alert(response.ok ? "Uploaded!" : "Upload failed");
  loadImages();
}

async function loadImages() {
  const listUrl = `${blobUrl}/${containerName}?restype=container&comp=list&${sasToken}`;

  const res = await fetch(listUrl);
  const xml = await res.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  const images = xmlDoc.getElementsByTagName("Name");
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  for (let i = 0; i < images.length; i++) {
    const imgName = images[i].childNodes[0].nodeValue;
    if (!imgName.match(/\.(jpeg|jpg|png|gif)$/i)) continue;

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

async function deleteImage(imgName) {
  if (!confirm("Delete this image?")) return;

  const deleteUrl = `${blobUrl}/${containerName}/${imgName}?${sasToken}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE"
  });

  alert(response.ok ? "Deleted!" : "Delete failed");
  loadImages();
}

loadImages();
