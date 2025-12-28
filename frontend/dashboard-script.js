// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "login.html"
    return false
  }
  return token
}

const token = checkAuth()
const API_BASE_URL = "http://localhost:5000/api"

// Get user data on load
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserData()
  await loadFiles()
  setupEventListeners()
})

// Load user data
async function loadUserData() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const user = await response.json()
    document.getElementById("userName").textContent = user.fullName || user.email || user.phone
    document.getElementById("settingsEmail").textContent = user.email || "-"
    document.getElementById("settingsPhone").textContent = user.phone || "-"
    document.getElementById("settingsName").textContent = user.fullName || "-"

    const storageInMB = (user.totalStorageUsed / (1024 * 1024)).toFixed(2)
    document.getElementById("storageUsed").textContent = `${storageInMB} MB`
    document.getElementById("settingsStorage").textContent = `${storageInMB} MB`
  } catch (error) {
    console.error("Failed to load user data:", error)
  }
}

// Load files
async function loadFiles() {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const files = await response.json()
    displayFiles(files)
  } catch (error) {
    console.error("Failed to load files:", error)
  }
}

// Display files in table
function displayFiles(files) {
  const tbody = document.getElementById("filesTableBody")

  if (files.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No files yet. Start by uploading one.</td></tr>'
    document.getElementById("totalFiles").textContent = "0"
    return
  }

  document.getElementById("totalFiles").textContent = files.length

  tbody.innerHTML = files
    .map(
      (file) => `
    <tr class="file-row">
      <td>
        <div class="file-name">
          <span class="file-icon">${getFileIcon(file.fileType)}</span>
          ${file.fileName}
        </div>
      </td>
      <td>${file.fileType}</td>
      <td>${formatFileSize(file.fileSize)}</td>
      <td>${new Date(file.uploadDate).toLocaleDateString()}</td>
      <td>
        <div class="file-actions">
          <button class="btn-action preview" onclick="previewFile('${file._id}', '${file.filePath}', '${file.mimeType}')">👁️</button>
          <button class="btn-action download" onclick="downloadFile('${file._id}', '${file.fileName}')">⬇️</button>
          <button class="btn-action delete" onclick="deleteFile('${file._id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")
}

// Get file type icon
function getFileIcon(fileType) {
  const icons = {
    PDF: "📄",
    DOC: "📝",
    DOCX: "📝",
    PNG: "🖼️",
    JPG: "🖼️",
    JPEG: "🖼️",
    MP4: "🎥",
    MP3: "🎵",
    ZIP: "📦",
    TXT: "📋",
  }
  return icons[fileType] || "📁"
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// Preview file
function previewFile(fileId, filePath, mimeType) {
  const modal = document.getElementById("previewModal")
  const previewContent = document.getElementById("previewContent")

  previewContent.innerHTML = ""

  if (mimeType.startsWith("image/")) {
    previewContent.innerHTML = `<img src="${filePath}" alt="Preview" style="max-width: 100%; max-height: 80vh;">`
  } else if (mimeType.startsWith("video/")) {
    previewContent.innerHTML = `<video controls style="max-width: 100%; max-height: 80vh;">
      <source src="${filePath}" type="${mimeType}">
      Your browser does not support the video tag.
    </video>`
  } else {
    previewContent.innerHTML = `<p>Preview not available for this file type</p>`
  }

  modal.style.display = "block"
}

// Download file
function downloadFile(fileId, fileName) {
  const link = document.createElement("a")
  link.href = `${API_BASE_URL}/upload/file/${fileId}`
  link.download = fileName
  link.click()
}

// Delete file
async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return

  try {
    const response = await fetch(`${API_BASE_URL}/upload/file/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      alert("File deleted successfully")
      await loadFiles()
    } else {
      alert("Failed to delete file")
    }
  } catch (error) {
    console.error("Delete error:", error)
  }
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "login.html"
  })

  // Section navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"))
      item.classList.add("active")

      const section = item.dataset.section
      document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"))
      document.getElementById(`${section}Section`).classList.add("active")
    })
  })

  // Search and sort
  document.getElementById("searchInput").addEventListener("input", async () => {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    const rows = document.querySelectorAll(".file-row")

    rows.forEach((row) => {
      const fileName = row.querySelector(".file-name").textContent.toLowerCase()
      row.style.display = fileName.includes(searchTerm) ? "" : "none"
    })
  })

  document.getElementById("sortSelect").addEventListener("change", async () => {
    const sortBy = document.getElementById("sortSelect").value
    const files = await fetch(`${API_BASE_URL}/upload/files`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())

    const sorted = [...files]
    if (sortBy === "name") {
      sorted.sort((a, b) => a.fileName.localeCompare(b.fileName))
    } else if (sortBy === "size") {
      sorted.sort((a, b) => b.fileSize - a.fileSize)
    } else {
      sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    }

    displayFiles(sorted)
  })

  // File upload
  const uploadArea = document.getElementById("uploadArea")
  const fileInput = document.getElementById("fileInput")
  const uploadProgress = document.getElementById("uploadProgress")

  uploadArea.addEventListener("click", () => fileInput.click())

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.style.borderColor = "#0066cc"
    uploadArea.style.backgroundColor = "#f0f8ff"
  })

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "#ddd"
    uploadArea.style.backgroundColor = "#fff"
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.style.borderColor = "#ddd"
    uploadArea.style.backgroundColor = "#fff"
    handleFiles(e.dataTransfer.files)
  })

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files)
  })

  // File upload handler
  async function handleFiles(files) {
    for (const file of files) {
      await uploadFile(file)
    }
  }

  async function uploadFile(file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", file.name)

    uploadProgress.style.display = "block"
    document.getElementById("uploadStatus").textContent = `Uploading ${file.name}...`

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          document.getElementById("progressFill").style.width = percentComplete + "%"
        }
      })

      xhr.addEventListener("load", async () => {
        if (xhr.status === 201) {
          document.getElementById("uploadStatus").textContent = `${file.name} uploaded successfully`
          setTimeout(() => {
            uploadProgress.style.display = "none"
            document.getElementById("progressFill").style.width = "0%"
            loadFiles()
          }, 1000)
        }
      })

      xhr.addEventListener("error", () => {
        document.getElementById("uploadStatus").textContent = "Upload failed"
      })

      xhr.open("POST", `${API_BASE_URL}/upload/file`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    } catch (error) {
      console.error("Upload error:", error)
    }
  }

  // Modal close
  const modal = document.getElementById("previewModal")
  document.querySelector(".modal-close").addEventListener("click", () => {
    modal.style.display = "none"
  })

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })
}
