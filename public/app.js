document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Management
  let scanData = null;
  const selectedPaths = new Set();

  // DOM Elements
  const scanForm = document.getElementById('scan-form');
  const targetPathInput = document.getElementById('target-path');
  const verifyContentCheckbox = document.getElementById('verify-content');
  const minSizeSelect = document.getElementById('min-size');
  const btnScan = document.getElementById('btn-scan');
  const scanLoader = document.getElementById('scan-loader');
  
  const emptyState = document.getElementById('empty-state');
  const statsSection = document.getElementById('stats-section');
  const resultsSection = document.getElementById('results-section');
  const groupsContainer = document.getElementById('groups-container');

  // Stats Elements
  const statTotalFiles = document.getElementById('stat-total-files');
  const statDuplicateGroups = document.getElementById('stat-duplicate-groups');
  const statDuplicateFiles = document.getElementById('stat-duplicate-files');
  const statWastedSize = document.getElementById('stat-wasted-size');

  // Toolbar & Selection Elements
  const selectedSummary = document.getElementById('selected-summary');
  const btnSmartSelect = document.getElementById('btn-smart-select');
  const smartSelectMenu = document.getElementById('smart-select-menu');
  const btnDeleteSelected = document.getElementById('btn-delete-selected');

  // Modal Elements
  const deleteModal = document.getElementById('delete-modal');
  const modalFileCount = document.getElementById('modal-file-count');
  const modalFreedSize = document.getElementById('modal-freed-size');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');

  // Utility: Byte Formatting
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Utility: Date Formatting
  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Handle Form Scan Submit
  scanForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetPath = targetPathInput.value.trim();
    if (!targetPath) return;

    // UI Loading State
    btnScan.disabled = true;
    scanLoader.classList.remove('hidden');
    emptyState.classList.add('hidden');
    statsSection.classList.add('hidden');
    resultsSection.classList.add('hidden');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath,
          verifyContent: verifyContentCheckbox.checked,
          minSize: parseInt(minSizeSelect.value, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '스캔 중 오류가 발생했습니다.');
        emptyState.classList.remove('hidden');
        return;
      }

      scanData = data;
      selectedPaths.clear();
      renderResults();

    } catch (err) {
      alert('서버와 통신할 수 없습니다: ' + err.message);
      emptyState.classList.remove('hidden');
    } finally {
      btnScan.disabled = false;
      scanLoader.classList.add('hidden');
    }
  });

  // Render Stats & Groups
  function renderResults() {
    if (!scanData) return;

    const { stats, groups } = scanData;

    // Update Stats
    statTotalFiles.textContent = stats.totalFiles.toLocaleString();
    statDuplicateGroups.textContent = stats.duplicateGroupsCount.toLocaleString();
    statDuplicateFiles.textContent = stats.duplicateFilesCount.toLocaleString();
    statWastedSize.textContent = formatBytes(stats.totalWastedBytes);

    statsSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden');

    if (groups.length === 0) {
      groupsContainer.innerHTML = `
        <div class="empty-state glass-panel">
          <div class="empty-icon"><i data-lucide="check-circle-2"></i></div>
          <h3>중복 파일이 발견되지 않았습니다</h3>
          <p>선택한 폴더에는 크기와 내용이 동일한 중복 파일이 없습니다.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      updateSelectionSummary();
      return;
    }

    // Render Groups
    groupsContainer.innerHTML = '';
    groups.forEach((group, groupIdx) => {
      const groupCard = document.createElement('div');
      groupCard.className = 'group-card glass-panel open';

      const wastedText = formatBytes(group.wastedSize);
      const singleFileSize = formatBytes(group.size);

      groupCard.innerHTML = `
        <div class="group-header">
          <div class="group-title">
            <span class="group-badge">그룹 #${groupIdx + 1}</span>
            <strong>단일 파일 크기: ${singleFileSize}</strong>
          </div>
          <div class="group-meta">
            <span>중복 ${group.files.length}개</span>
            <span class="wasted-badge">낭비: ${wastedText}</span>
            <i data-lucide="chevron-down" class="group-toggle-icon"></i>
          </div>
        </div>
        <div class="file-list">
          ${group.files.map((file, fileIdx) => {
            const isSelected = selectedPaths.has(file.path);
            return `
              <div class="file-item ${isSelected ? 'selected' : ''}" data-path="${encodeURIComponent(file.path)}">
                <div class="file-left">
                  <label class="custom-checkbox">
                    <input type="checkbox" class="file-checkbox" value="${encodeURIComponent(file.path)}" ${isSelected ? 'checked' : ''}>
                    <span class="checkbox-mark"></span>
                  </label>
                  <div class="file-info-text">
                    <span class="file-name" title="${file.name}">${file.name}</span>
                    <span class="file-path" title="${file.path}">${file.path}</span>
                  </div>
                </div>
                <div class="file-right">
                  <span class="file-date"><i data-lucide="clock" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> ${formatDate(file.mtime)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Header Toggle Expand/Collapse
      const groupHeader = groupCard.querySelector('.group-header');
      groupHeader.addEventListener('click', (e) => {
        // Prevent toggle if clicking internal elements if any
        groupCard.classList.toggle('open');
      });

      groupsContainer.appendChild(groupCard);
    });

    if (window.lucide) lucide.createIcons();

    // Attach File Checkbox Events
    document.querySelectorAll('.file-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const decodedPath = decodeURIComponent(e.target.value);
        const fileItem = e.target.closest('.file-item');

        if (e.target.checked) {
          selectedPaths.add(decodedPath);
          fileItem.classList.add('selected');
        } else {
          selectedPaths.delete(decodedPath);
          fileItem.classList.remove('selected');
        }
        updateSelectionSummary();
      });
    });

    updateSelectionSummary();
  }

  // Update Toolbar Summary & Delete Button State
  function updateSelectionSummary() {
    const count = selectedPaths.size;
    let selectedBytes = 0;

    if (scanData && scanData.groups) {
      scanData.groups.forEach(g => {
        g.files.forEach(f => {
          if (selectedPaths.has(f.path)) {
            selectedBytes += f.size;
          }
        });
      });
    }

    selectedSummary.textContent = `${count}개 선택됨 (${formatBytes(selectedBytes)})`;
    btnDeleteSelected.disabled = count === 0;

    modalFileCount.textContent = count;
    modalFreedSize.textContent = formatBytes(selectedBytes);
  }

  // Smart Select Dropdown
  btnSmartSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    smartSelectMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    smartSelectMenu.classList.remove('show');
  });

  smartSelectMenu.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.dropdown-item');
    if (!actionBtn || !scanData || !scanData.groups) return;

    const action = actionBtn.dataset.action;
    selectedPaths.clear();

    if (action === 'oldest' || action === 'newest') {
      scanData.groups.forEach(group => {
        // Sort files by mtime
        const sorted = [...group.files].sort((a, b) => new Date(a.mtime) - new Date(b.mtime));
        
        // If oldest, keep sorted[0], select sorted[1..n]
        // If newest, keep sorted[n-1], select sorted[0..n-2]
        if (action === 'oldest') {
          for (let i = 1; i < sorted.length; i++) {
            selectedPaths.add(sorted[i].path);
          }
        } else if (action === 'newest') {
          for (let i = 0; i < sorted.length - 1; i++) {
            selectedPaths.add(sorted[i].path);
          }
        }
      });
    }

    renderResults();
  });

  // Delete Action & Modal Handlers
  btnDeleteSelected.addEventListener('click', () => {
    if (selectedPaths.size === 0) return;
    deleteModal.classList.remove('hidden');
  });

  modalBtnCancel.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  modalBtnConfirm.addEventListener('click', async () => {
    if (selectedPaths.size === 0) return;

    modalBtnConfirm.disabled = true;
    modalBtnConfirm.querySelector('span').textContent = '삭제 중...';

    try {
      const pathsArray = Array.from(selectedPaths);
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: pathsArray })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || '삭제 중 오류가 발생했습니다.');
        return;
      }

      alert(`성공적으로 ${result.deletedCount}개 파일이 삭제되었습니다! (확보 용량: ${formatBytes(result.freedBytes)})`);

      deleteModal.classList.add('hidden');

      // Refresh Scan
      scanForm.dispatchEvent(new Event('submit'));

    } catch (err) {
      alert('삭제 요청 실패: ' + err.message);
    } finally {
      modalBtnConfirm.disabled = false;
      modalBtnConfirm.querySelector('span').textContent = '영구 삭제 실행';
    }
  });
});
