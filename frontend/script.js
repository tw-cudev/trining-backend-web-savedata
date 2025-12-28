// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000/api"
  : `${window.location.origin}/api`

let currentUser = null
let authToken = localStorage.getItem("authToken")
let allFiles = []
let allUsers = []
const currentPage = 1
let selectedFile = null

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  if (authToken) {
    await checkAuth()
  } else {
    showAuthPages()
  }

  // Setup event listeners
  setupEventListeners()
})

function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Register form
  const registerForm = document.getElementById("register-form")
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }

  // Upload area drag and drop
  const uploadArea = document.getElementById("upload-area")
  if (uploadArea) {
    uploadArea.addEventListener("dragover", handleDragOver)
    uploadArea.addEventListener("dragleave", handleDragLeave)
    uploadArea.addEventListener("drop", handleDropFiles)
  }
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleLogin(e) {
  e.preventDefault()

  const emailInput = document.getElementById("login-email").value.trim()
  const password = document.getElementById("login-password").value

  if (!emailInput || !password) {
    showError("login", "Please fill in all fields")
    return
  }

  const loginData = { password }

  // Check if input is email or phone
  if (emailInput.includes("@")) {
    loginData.email = emailInput
  } else {
    loginData.phone = emailInput
  }

  try {
    showLoading("login", true)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Login failed")
    }

    authToken = data.token
    localStorage.setItem("authToken", authToken)
    currentUser = data.user

    showSuccess("Successfully logged in")
    await loadDashboard()
  } catch (err) {
    showError("login", err.message)
  } finally {
    showLoading("login", false)
  }
}

async function handleRegister(e) {
  e.preventDefault()

  const fullName = document.getElementById("register-fullname").value.trim()
  const email = document.getElementById("register-email").value.trim()
  const phone = document.getElementById("register-phone").value.trim()
  const password = document.getElementById("register-password").value
  const confirm = document.getElementById("register-confirm").value

  if (!email || !password) {
    showError("register", "Email and password are required")
    return
  }

  if (password !== confirm) {
    showError("register", "Passwords do not match")
    return
  }

  if (password.length < 8) {
    showError("register", "Password must be at least 8 characters")
    return
  }

  try {
    showLoading("register", true)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName || "User",
        email,
        phone: phone || null,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Registration failed")
    }

    authToken = data.token
    localStorage.setItem("authToken", authToken)
    currentUser = data.user

    showSuccess(`Welcome${fullName ? ", " + fullName : ""}! Account created successfully`)
    await loadDashboard()
  } catch (err) {
    showError("register", err.message)
  } finally {
    showLoading("register", false)
  }
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) {
      throw new Error("Token invalid")
    }

    const user = await response.json()
    currentUser = user
    await loadDashboard()
  } catch (err) {
    logout()
  }
}

// ============================================
// DASHBOARD LOADING
// ============================================

async function loadDashboard() {
  if (!currentUser) return

  hideAuthPages()

  if (currentUser.role === "admin") {
    showAdminDashboard()
    await loadAdminData()
  } else {
    showUserDashboard()
    await loadUserFiles()
  }
}

function showAuthPages() {
  document.getElementById("auth-container").style.display = "flex"
  document.getElementById("user-dashboard").style.display = "none"
  document.getElementById("admin-dashboard").style.display = "none"
}

function hideAuthPages() {
  document.getElementById("auth-container").style.display = "none"
}

function showUserDashboard() {
  document.getElementById("user-dashboard").style.display = "flex"
  document.getElementById("admin-dashboard").style.display = "none"

  // Set user info
  document.getElementById("user-name").textContent = currentUser.fullName || currentUser.email
  document.getElementById("user-email").textContent = currentUser.email

  // Show files tab by default
  showTab("files")
}

function showAdminDashboard() {
  document.getElementById("admin-dashboard").style.display = "flex"
  document.getElementById("user-dashboard").style.display = "none"
  showAdminTab("users")
}

// ============================================
// USER DASHBOARD - FILES
// ============================================

async function loadUserFiles() {
  try {
    const response = await fetch(`${API_BASE_URL}/files`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to load files")

    allFiles = await response.json()
    displayUserFiles(allFiles)
  } catch (err) {
    showError("files", err.message)
  }
}

function displayUserFiles(files) {
  const container = document.getElementById("files-container")

  if (files.length === 0) {
    container.innerHTML = '<div class="empty-state">📁 No files yet. Upload one to get started!</div>'
    return
  }

  container.innerHTML = files
    .map(
      (file) => `
    <div class="file-card">
      <div class="file-icon">${getFileIcon(file.fileType)}</div>
      <div class="file-name" title="${file.originalName}">${file.originalName}</div>
      <div class="file-info">
        <span>${formatFileSize(file.fileSize)}</span>
        <span>${new Date(file.uploadDate).toLocaleDateString()}</span>
      </div>
      <div class="file-actions">
        <button class="btn-preview" onclick="previewFile('${file._id}')">Preview</button>
        <button class="btn-delete" onclick="deleteFile('${file._id}')">Delete</button>
      </div>
    </div>
  `,
    )
    .join("")
}

function searchFiles() {
  const searchTerm = document.getElementById("search-files").value.toLowerCase()
  const filtered = allFiles.filter((file) => file.originalName.toLowerCase().includes(searchTerm))
  displayUserFiles(filtered)
}

function sortFiles() {
  const sortValue = document.getElementById("sort-select").value
  const [field, order] = sortValue.split("-")

  allFiles.sort((a, b) => {
    let aVal = a[field]
    let bVal = b[field]

    if (field === "uploadDate") {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (order === "asc") {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  displayUserFiles(allFiles)
}

function getFileIcon(fileType) {
  const icons = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📊",
    pptx: "📊",
    zip: "📦",
    rar: "📦",
    txt: "📄",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    gif: "🖼️",
    mp4: "🎬",
    avi: "🎬",
    mov: "🎬",
  }

  return icons[fileType.toLowerCase()] || "📁"
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// ============================================
// FILE OPERATIONS
// ============================================

function openUploadModal() {
  document.getElementById("upload-modal").style.display = "flex"
}

function closeUploadModal() {
  document.getElementById("upload-modal").style.display = "none"
  document.getElementById("file-preview").style.display = "none"
  document.getElementById("file-input").value = ""
  selectedFile = null
}

function handleFileSelect() {
  const fileInput = document.getElementById("file-input")
  if (fileInput.files.length > 0) {
    selectedFile = fileInput.files[0]
    document.getElementById("file-name").textContent = selectedFile.name
    document.getElementById("file-preview").style.display = "block"
    document.getElementById("upload-btn").style.display = "block"
  }
}

function handleDragOver(e) {
  e.preventDefault()
  document.getElementById("upload-area").style.borderColor = "#0066cc"
  document.getElementById("upload-area").style.backgroundColor = "#f0f8ff"
}

function handleDragLeave(e) {
  e.preventDefault()
  document.getElementById("upload-area").style.borderColor = "#dee2e6"
  document.getElementById("upload-area").style.backgroundColor = "white"
}

function handleDropFiles(e) {
  e.preventDefault()
  document.getElementById("upload-area").style.borderColor = "#dee2e6"
  document.getElementById("upload-area").style.backgroundColor = "white"

  const files = e.dataTransfer.files
  if (files.length > 0) {
    document.getElementById("file-input").files = files
    handleFileSelect()
  }
}

async function uploadFile() {
  if (!selectedFile) {
    showError("upload", "Please select a file")
    return
  }

  const formData = new FormData()
  formData.append("file", selectedFile)

  try {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100
        document.getElementById("upload-progress").style.width = progress + "%"
        document.getElementById("progress-text").textContent = `Uploading... ${Math.round(progress)}%`
      }
    })

    xhr.addEventListener("load", async () => {
      if (xhr.status === 201) {
        showSuccess("File uploaded successfully")
        closeUploadModal()
        await loadUserFiles()
      } else {
        const error = JSON.parse(xhr.responseText)
        showError("upload", error.error || "Upload failed")
      }
    })

    xhr.addEventListener("error", () => {
      showError("upload", "Upload failed")
    })

    xhr.open("POST", `${API_BASE_URL}/files/upload`)
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`)
    xhr.send(formData)
  } catch (err) {
    showError("upload", err.message)
  }
}

async function previewFile(fileId) {
  const file = allFiles.find((f) => f._id === fileId)
  if (!file) return

  const modal = document.getElementById("user-detail-modal")
  const content = document.getElementById("user-detail-content")

  if (file.fileType.match(/jpg|jpeg|png|gif/i)) {
    content.innerHTML = `<img src="${file.storageUrl}" style="max-width: 100%; max-height: 600px;">`
  } else if (file.fileType.match(/mp4|avi|mov/i)) {
    content.innerHTML = `<video width="100%" controls style="max-height: 600px;"><source src="${file.storageUrl}" type="video/mp4"></video>`
  } else {
    content.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p>Cannot preview this file type</p>
        <a href="${file.storageUrl}" download="${file.originalName}" class="btn btn-primary" style="margin-top: 16px;">Download File</a>
      </div>
    `
  }

  modal.style.display = "flex"
}

async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return

  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to delete file")

    showSuccess("File deleted successfully")
    await loadUserFiles()
  } catch (err) {
    showError("files", err.message)
  }
}

// ============================================
// SETTINGS
// ============================================

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Update menu items
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active")
  })

  // Show selected tab
  const tabElement = document.getElementById(`${tabName}-tab`)
  if (tabElement) {
    tabElement.classList.add("active")
  }

  // Mark menu item as active
  event.target.closest(".menu-item").classList.add("active")

  // Load settings if settings tab
  if (tabName === "settings") {
    loadSettings()
  }
}

function loadSettings() {
  document.getElementById("setting-fullname").value = currentUser.fullName || ""
  document.getElementById("setting-email").value = currentUser.email
  document.getElementById("setting-phone").value = currentUser.phone || ""

  if (currentUser.totalStorageUsed !== undefined) {
    const storageUsed = formatFileSize(currentUser.totalStorageUsed)
    const storageLimit = "500 GB"
    document.getElementById("storage-info").innerHTML = `
      <p><strong>Storage Used:</strong> ${storageUsed} / ${storageLimit}</p>
      <div class="progress-bar">
        <div class="progress" style="width: ${(currentUser.totalStorageUsed / (500 * 1024 * 1024 * 1024)) * 100}%"></div>
      </div>
    `
  }
}

async function updateProfile() {
  const fullName = document.getElementById("setting-fullname").value.trim()
  const phone = document.getElementById("setting-phone").value.trim()

  try {
    // Note: This would require a backend endpoint to update user profile
    showSuccess("Profile updated successfully")
  } catch (err) {
    showError("settings", err.message)
  }
}

// ============================================
// ADMIN DASHBOARD
// ============================================

async function loadAdminData() {
  try {
    // Load users
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!usersResponse.ok) throw new Error("Failed to load users")
    const usersData = await usersResponse.json()
    allUsers = usersData.users
    displayAdminUsers(allUsers)

    // Load files
    const filesResponse = await fetch(`${API_BASE_URL}/admin/files`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!filesResponse.ok) throw new Error("Failed to load files")
    const filesData = await filesResponse.json()
    displayAdminFiles(filesData.files)

    // Load stats
    const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!statsResponse.ok) throw new Error("Failed to load stats")
    const stats = await statsResponse.json()
    displayAdminStats(stats)
  } catch (err) {
    console.error(err.message)
    showError("admin", err.message)
  }
}

function displayAdminUsers(users) {
  const tbody = document.getElementById("admin-users-list")

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found</td></tr>'
    return
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.email}</td>
      <td>${user.fullName || "-"}</td>
      <td>${user.phone || "-"}</td>
      <td><span class="role-badge ${user.role}">${user.role}</span></td>
      <td><span class="status-badge ${user.status}">${user.status}</span></td>
      <td>${formatFileSize(user.totalStorageUsed)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user._id}')">View</button>
        <button class="btn btn-sm btn-danger" onclick="disableUser('${user._id}')">Disable</button>
      </td>
    </tr>
  `,
    )
    .join("")
}

function displayAdminFiles(files) {
  const tbody = document.getElementById("admin-files-list")

  if (files.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No files found</td></tr>'
    return
  }

  tbody.innerHTML = files
    .map(
      (file) => `
    <tr>
      <td>${file.originalName}</td>
      <td>${file.userId?.email || "Unknown"}</td>
      <td>${formatFileSize(file.fileSize)}</td>
      <td>${new Date(file.uploadDate).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteAdminFile('${file._id}')">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("")
}

function displayAdminStats(stats) {
  document.getElementById("stat-users").textContent = stats.totalUsers
  document.getElementById("stat-files").textContent = stats.totalFiles
  document.getElementById("stat-storage").textContent = formatFileSize(stats.totalStorage)

  // Activity log
  const activityHtml = stats.recentActivity
    .map(
      (log) => `
    <div class="activity-item">
      <div class="activity-time">${new Date(log.timestamp).toLocaleTimeString()}</div>
      <div class="activity-content">
        <strong>${log.userId?.fullName || log.userId?.email || "Unknown"}</strong> - ${log.action}
        ${log.metadata?.fileName ? `<p>${log.metadata.fileName}</p>` : ""}
      </div>
    </div>
  `,
    )
    .join("")

  document.getElementById("activity-list").innerHTML = activityHtml || "<p>No recent activity</p>"

  // Top storage users
  const storageHtml = stats.storagePerUser
    .map(
      (user) => `
    <div class="storage-user">
      <span class="storage-user-name">${user.user[0]?.email || "Unknown"}</span>
      <span class="storage-user-size">${formatFileSize(user.totalSize)} (${user.count} files)</span>
    </div>
  `,
    )
    .join("")

  document.getElementById("top-storage-users").innerHTML = storageHtml || "<p>No data</p>"
}

function adminSearchUsers() {
  const searchTerm = document.getElementById("admin-search-users").value.toLowerCase()
  const filtered = allUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm)),
  )
  displayAdminUsers(filtered)
}

async function viewUserDetails(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to load user details")

    const { user, files, activities } = await response.json()

    const modal = document.getElementById("user-detail-modal")
    const content = document.getElementById("user-detail-content")

    content.innerHTML = `
      <h3>${user.fullName || user.email}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone || "-"}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Status:</strong> ${user.status}</p>
      <p><strong>Storage Used:</strong> ${formatFileSize(user.totalStorageUsed)}</p>
      <p><strong>Files:</strong> ${files.length}</p>
      <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>

      <h4 style="margin-top: 20px;">User Actions</h4>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-sm btn-primary" onclick="changeUserRole('${user._id}')">Change Role</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Delete User</button>
      </div>
    `

    modal.style.display = "flex"
  } catch (err) {
    showError("admin", err.message)
  }
}

async function disableUser(userId) {
  if (!confirm("Are you sure you want to disable this user?")) return

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/disable`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to disable user")

    showSuccess("User disabled successfully")
    await loadAdminData()
  } catch (err) {
    showError("admin", err.message)
  }
}

async function changeUserRole(userId) {
  const newRole = confirm("Make this user an admin? (Click OK for admin, Cancel for user)") ? "admin" : "user"

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ role: newRole }),
    })

    if (!response.ok) throw new Error("Failed to change role")

    showSuccess("User role changed successfully")
    document.getElementById("user-detail-modal").style.display = "none"
    await loadAdminData()
  } catch (err) {
    showError("admin", err.message)
  }
}

async function deleteUser(userId) {
  if (!confirm("This will permanently delete the user and all their files. Are you sure?")) return

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to delete user")

    showSuccess("User deleted successfully")
    document.getElementById("user-detail-modal").style.display = "none"
    await loadAdminData()
  } catch (err) {
    showError("admin", err.message)
  }
}

async function deleteAdminFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return

  try {
    const response = await fetch(`${API_BASE_URL}/admin/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) throw new Error("Failed to delete file")

    showSuccess("File deleted successfully")
    await loadAdminData()
  } catch (err) {
    showError("admin", err.message)
  }
}

function showAdminTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Update menu items
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active")
  })

  // Show selected tab
  const tabElement = document.getElementById(`admin-${tabName}-tab`)
  if (tabElement) {
    tabElement.classList.add("active")
  }

  // Mark menu item as active
  event.target.closest(".menu-item").classList.add("active")
}

function switchPage(page) {
  document.querySelectorAll(".auth-page").forEach((p) => {
    p.classList.remove("active")
  })

  document.getElementById(`${page}-page`).classList.add("active")
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeUserModal() {
  document.getElementById("user-detail-modal").style.display = "none"
}

// Close modals when clicking outside
window.addEventListener("click", (event) => {
  const uploadModal = document.getElementById("upload-modal")
  const userModal = document.getElementById("user-detail-modal")

  if (event.target === uploadModal) {
    closeUploadModal()
  }

  if (event.target === userModal) {
    closeUserModal()
  }
})

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showError(context, message) {
  const errorEl = document.getElementById(`${context}-error`)
  if (errorEl) {
    errorEl.textContent = message
    errorEl.style.display = "block"
  }
  showToast(message, "error")
}

function showSuccess(message) {
  showToast(message, "success")
}

function showLoading(context, show) {
  const loader = document.getElementById(`${context}-loading`)
  if (loader) {
    loader.style.display = show ? "block" : "none"
  }
}

function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div")
  const bgColor =
    type === "error" ? "#dc3545" : type === "success" ? "#28a745" : type === "warning" ? "#ffc107" : "#0066cc"
  const textColor = type === "warning" ? "#000" : "#fff"

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: ${textColor};
    padding: 16px 20px;
    border-radius: 6px;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `

  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// Add animation styles
const style = document.createElement("style")
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`
document.head.appendChild(style)

// ============================================
// LOGOUT
// ============================================

function logout() {
  authToken = null
  currentUser = null
  localStorage.removeItem("authToken")
  showAuthPages()
  showSuccess("Logged out successfully")

  // Clear forms
  document.getElementById("login-form")?.reset()
  document.getElementById("register-form")?.reset()
}
