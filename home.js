// Storage key for localStorage
const STORAGE_KEY = 'workCalculatorData';

// Variables for tracking which row is being edited or deleted
let deleteTargetIndex = null;
let editTargetIndex = null;

// Get references to all DOM elements
const videoLinkInput = document.getElementById('videoLink');
const videoTitleInput = document.getElementById('videoTitle');
const totalCountInput = document.getElementById('totalCount');
const addBtn = document.getElementById('addBtn');
const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const statsSection = document.getElementById('statsSection');

// Edit Modal elements
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const confirmEditBtn = document.getElementById('confirmEdit');
const cancelEditBtn = document.getElementById('cancelEdit');
const closeEditModalBtn = document.getElementById('closeEditModal');

// Delete Modal elements
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Stats elements
const totalEntriesEl = document.getElementById('totalEntries');
const avgProgressEl = document.getElementById('avgProgress');
const completedCountEl = document.getElementById('completedCount');

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        return JSON.parse(savedData);
    }
    return [];
}

// Save data to localStorage
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Normalize time format - accepts : . / - as separators
function normalizeTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    
    // Replace all possible separators with colon
    return timeStr.replace(/[\.\/-]/g, ':');
}

// Convert time format (HH:MM:SS or MM:SS) to total seconds
function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    // Normalize the time format first
    const normalized = normalizeTimeFormat(timeStr);
    
    const parts = normalized.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // Just seconds
        return parts[0];
    }
    
    return 0;
}

// Calculate percentage completed
function calculatePercentage(completed, total) {
    // Check if total contains any time separator
    if (typeof total === 'string' && /[:.\/-]/.test(total)) {
        // It's a time format
        const totalSeconds = timeToSeconds(total);
        const completedSeconds = timeToSeconds(completed);
        
        if (totalSeconds === 0) return 0;
        const percentage = (completedSeconds / totalSeconds) * 100;
        return Math.min(Math.round(percentage), 100); // Cap at 100%
    } else {
        // It's a numeric value (video count)
        const totalNum = parseFloat(total) || 0;
        const completedNum = parseFloat(completed) || 0;
        
        if (totalNum === 0) return 0;
        const percentage = (completedNum / totalNum) * 100;
        return Math.min(Math.round(percentage), 100); // Cap at 100%
    }
}

// Update statistics display
function updateStats() {
    const data = loadData();
    
    if (data.length === 0) {
        statsSection.classList.add('hidden');
        return;
    }
    
    statsSection.classList.remove('hidden');
    
    // Total entries
    totalEntriesEl.textContent = data.length;
    
    // Calculate average progress
    let totalProgress = 0;
    let completedItems = 0;
    
    data.forEach(entry => {
        const percentage = calculatePercentage(entry.completed, entry.total);
        totalProgress += percentage;
        if (percentage === 100) {
            completedItems++;
        }
    });
    
    const avgProgress = data.length > 0 ? Math.round(totalProgress / data.length) : 0;
    avgProgressEl.textContent = avgProgress + '%';
    
    // Completed count
    completedCountEl.textContent = completedItems;
}

// Render the entire table
function renderTable() {
    const data = loadData();
    
    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        tableBody.innerHTML = '';
        updateStats();
        return;
    }
    
    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';
    
    data.forEach((entry, index) => {
        const row = createTableRow(entry, index);
        tableBody.appendChild(row);
    });
    
    updateStats();
}

// Create a single table row
function createTableRow(entry, index) {
    const tr = document.createElement('tr');
    
    const percentCompleted = calculatePercentage(entry.completed, entry.total);
    const percentLeft = 100 - percentCompleted;
    
    tr.innerHTML = `
        <td><span class="serial-number">${index + 1}</span></td>
        <td>${entry.title}</td>
        <td>
            <a href="${entry.link}" target="_blank" rel="noopener noreferrer" class="video-link">
                <i class="fas fa-external-link-alt"></i> Open
            </a>
        </td>
        <td><strong>${entry.total}</strong></td>
        <td>
            <div class="completed-display">
                <span class="completed-value">${entry.completed || '0'}</span>
                <button class="edit-btn" data-index="${index}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        </td>
        <td><span class="percentage completed">${percentCompleted}%</span></td>
        <td><span class="percentage remaining">${percentLeft}%</span></td>
        <td>
            <button class="delete-btn" data-index="${index}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    
    // Add event listener to edit button
    const editBtn = tr.querySelector('.edit-btn');
    editBtn.addEventListener('click', handleEditClick);
    
    // Add event listener to delete button
    const deleteBtn = tr.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', handleDeleteClick);
    
    return tr;
}

// Handle edit button click
function handleEditClick(e) {
    editTargetIndex = parseInt(e.currentTarget.dataset.index);
    
    const data = loadData();
    const entry = data[editTargetIndex];
    
    // Pre-fill the edit input with current value
    editInput.value = entry.completed || '0';
    
    // Show the edit modal
    editModal.classList.add('active');
    
    // Focus on the input
    setTimeout(() => editInput.focus(), 100);
}

// Handle edit confirmation
function confirmEdit() {
    if (editTargetIndex === null) return;
    
    const newValue = editInput.value.trim();
    
    if (!newValue) {
        alert('Please enter a value!');
        return;
    }
    
    const data = loadData();
    
    // Update the completed value
    data[editTargetIndex].completed = newValue;
    
    // Save and re-render
    saveData(data);
    closeEditModal();
    renderTable();
    
    // Reset the edit target
    editTargetIndex = null;
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('active');
    editInput.value = '';
}

// Handle delete button click
function handleDeleteClick(e) {
    deleteTargetIndex = parseInt(e.currentTarget.dataset.index);
    deleteModal.classList.add('active');
}

// Confirm deletion
function confirmDeletion() {
    if (deleteTargetIndex === null) return;
    
    const data = loadData();
    data.splice(deleteTargetIndex, 1);
    
    saveData(data);
    closeDeleteModal();
    renderTable();
    
    deleteTargetIndex = null;
}

// Close delete modal
function closeDeleteModal() {
    deleteModal.classList.remove('active');
}

// Extract YouTube ID from URL
function extractYouTubeId(url) {
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (playlistMatch) {
        return { type: 'playlist', id: playlistMatch[1] };
    }
    
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (videoMatch) {
        return { type: 'video', id: videoMatch[1] };
    }
    
    return null;
}

// Handle adding a new entry
function handleAdd() {
    const link = videoLinkInput.value.trim();
    const title = videoTitleInput.value.trim();
    const total = totalCountInput.value.trim();
    
    // Validate inputs
    if (!link || !title || !total) {
        alert('⚠️ Please fill in all fields before adding!');
        return;
    }
    
    if (!link.includes('youtube.com') && !link.includes('youtu.be')) {
        alert('⚠️ Please enter a valid YouTube link!');
        return;
    }
    
    // Create new entry
    const newEntry = {
        link: link,
        title: title,
        total: total,
        completed: '0'
    };
    
    const data = loadData();
    data.push(newEntry);
    saveData(data);
    
    // Clear inputs
    videoLinkInput.value = '';
    videoTitleInput.value = '';
    totalCountInput.value = '';
    
    // Re-render
    renderTable();
    
    // Show success feedback
    videoLinkInput.focus();
}

// Event Listeners

// Add button
addBtn.addEventListener('click', handleAdd);

// Enter key support for inputs
videoLinkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd();
});

videoTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd();
});

totalCountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd();
});

// Edit modal
confirmEditBtn.addEventListener('click', confirmEdit);
cancelEditBtn.addEventListener('click', closeEditModal);
closeEditModalBtn.addEventListener('click', closeEditModal);

// Enter key in edit input
editInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') confirmEdit();
});

// Delete modal
confirmDeleteBtn.addEventListener('click', confirmDeletion);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Close modals when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteModal();
    }
});

// Initial render on page load
renderTable();
