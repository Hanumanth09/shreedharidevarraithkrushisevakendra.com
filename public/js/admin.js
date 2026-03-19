// ===== SIDEBAR MOBILE TOGGLE =====
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}

// Show toggle button on small screens
function checkScreenSize() {
  var btn = document.getElementById('sidebarToggle');
  if (btn) btn.style.display = window.innerWidth <= 600 ? 'block' : 'none';
}
window.addEventListener('resize', checkScreenSize);
checkScreenSize();

// Close sidebar when nav link clicked on mobile
document.querySelectorAll('.sidebar-nav a').forEach(function(link) {
  link.addEventListener('click', function() {
    if (window.innerWidth <= 600) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').style.display = 'none';
    }
  });
});

// ===== IMAGE PREVIEW =====
function previewImg(input, previewId) {
  var preview = document.getElementById(previewId);
  if (input.value) {
    preview.src = input.value;
    preview.style.display = 'block';
    preview.onerror = function() { preview.style.display = 'none'; };
  } else {
    preview.style.display = 'none';
  }
}

// ===== GALLERY EDIT MODAL =====
function openEditModal(item) {
  document.getElementById('editId').value = item.id;
  document.getElementById('editTitle').value = item.title;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editImageUrl').value = item.image_url;
  var preview = document.getElementById('editPreview');
  preview.src = item.image_url;
  preview.style.display = 'block';
  document.getElementById('editModal').classList.add('open');
}
function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
}

// ===== SERVICE EDIT MODAL =====
function openServiceModal(s) {
  document.getElementById('svcId').value = s.id;
  document.getElementById('svcName').value = s.name;
  document.getElementById('svcIcon').value = s.icon;
  document.getElementById('svcDesc').value = s.description;
  document.getElementById('serviceModal').classList.add('open');
}

// ===== CONTACT MESSAGE MODAL =====
function showMessage(btn) {
  var row = btn.closest('tr');
  var rows = Array.from(document.querySelectorAll('tbody tr'));
  var idx = rows.indexOf(row);
  if (typeof messages !== 'undefined' && messages[idx]) {
    document.getElementById('msgName').textContent = messages[idx].name;
    document.getElementById('msgBody').textContent = messages[idx].message;
    document.getElementById('msgModal').classList.add('open');
  }
}

// ===== CLOSE MODALS ON OVERLAY CLICK =====
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
