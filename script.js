/**
 * College Laboratory Equipment Issue and Maintenance Register
 * Client-side script handling fetching, processing, filtering, and UI rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  let allRecords = [];
  let filteredRecords = [];
  let selectedRecordId = null;

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const conditionFilter = document.getElementById('conditionFilter');
  const recordCounter = document.getElementById('recordCounter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');
  const tableBody = document.getElementById('tableBody');
  const retryBtn = document.getElementById('retryBtn');

  const noSelectionState = document.getElementById('noSelectionState');
  const detailsContent = document.getElementById('detailsContent');

  // Initialize Application
  init();

  function init() {
    setupEventListeners();
    fetchRecords();
  }

  function setupEventListeners() {
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      applyFilters();
    });

    conditionFilter.addEventListener('change', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    retryBtn.addEventListener('click', fetchRecords);
  }

  // Fetch JSON Data
  async function fetchRecords() {
    showLoading();
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP Error status: ${response.status}`);
      }
      const data = await response.json();
      allRecords = sanitizeRecords(data);
      filteredRecords = [...allRecords];
      
      hideStateViews();
      if (allRecords.length === 0) {
        showEmptyState();
      } else {
        tableContainer.classList.remove('hidden');
        renderTable();
      }
    } catch (err) {
      console.error('Data loading error:', err);
      showError();
    }
  }

  // Basic sanitization/validation for missing or weird records
  function sanitizeRecords(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map((item, index) => {
      return {
        record_id: item.record_id || `REC-UNKNOWN-${index + 1}`,
        equipment_id: item.equipment_id || 'N/A',
        equipment_name: item.equipment_name || 'Unspecified Item',
        issued_to: item.issued_to || 'Unassigned / Unrecorded',
        issue_date: item.issue_date || null,
        return_date: item.return_date || null,
        condition: item.condition || 'Missing',
        next_service_date: item.next_service_date || null
      };
    });
  }

  // Filter & Search Handler
  function handleSearchInput() {
    if (searchInput.value.trim() !== '') {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    applyFilters();
  }

  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedCondition = conditionFilter.value;

    filteredRecords = allRecords.filter(record => {
      const matchesSearch = 
        record.equipment_name.toLowerCase().includes(query) ||
        record.issued_to.toLowerCase().includes(query);

      const matchesCondition = 
        selectedCondition === 'ALL' || 
        record.condition === selectedCondition;

      return matchesSearch && matchesCondition;
    });

    renderTable();
    
    // Check if previously selected record is still in list
    if (selectedRecordId && !filteredRecords.some(r => r.record_id === selectedRecordId)) {
      clearSelection();
    }
  }

  function resetFilters() {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    conditionFilter.value = 'ALL';
    applyFilters();
  }

  // Render Table Rows
  function renderTable() {
    updateRecordCount();
    tableBody.innerHTML = '';

    if (filteredRecords.length === 0) {
      tableContainer.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    filteredRecords.forEach(record => {
      const tr = document.createElement('tr');
      if (record.record_id === selectedRecordId) {
        tr.classList.add('selected-row');
      }

      const overdueInfo = calculateServiceOverdue(record.next_service_date);

      tr.innerHTML = `
        <td><strong>${escapeHTML(record.equipment_id)}</strong></td>
        <td>${escapeHTML(record.equipment_name)}</td>
        <td>${escapeHTML(record.issued_to)}</td>
        <td>${formatDate(record.issue_date)}</td>
        <td><span class="badge ${getConditionBadgeClass(record.condition)}">${escapeHTML(record.condition)}</span></td>
        <td>${overdueInfo.isOverdue ? `<span class="badge badge-overdue">Overdue ${overdueInfo.days}d</span>` : '<span class="badge badge-ok">Up to date</span>'}</td>
      `;

      tr.addEventListener('click', () => selectRecord(record, tr));
      tableBody.appendChild(tr);
    });
  }

  // Selection Handler
  function selectRecord(record, rowElement) {
    selectedRecordId = record.record_id;
    
    // Highlight table row
    document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('selected-row'));
    rowElement.classList.add('selected-row');

    renderDetails(record);
  }

  function clearSelection() {
    selectedRecordId = null;
    noSelectionState.classList.remove('hidden');
    detailsContent.classList.add('hidden');
    detailsContent.innerHTML = '';
  }

  // Render Details Panel
  function renderDetails(record) {
    noSelectionState.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    const durationDays = calculateBorrowDuration(record.issue_date, record.return_date);
    const serviceInfo = calculateServiceOverdue(record.next_service_date);

    detailsContent.innerHTML = `
      <div class="detail-item">
        <label>Record ID</label>
        <span>${escapeHTML(record.record_id)}</span>
      </div>

      <div class="detail-item">
        <label>Equipment ID</label>
        <span>${escapeHTML(record.equipment_id)}</span>
      </div>

      <div class="detail-item">
        <label>Equipment Name</label>
        <span>${escapeHTML(record.equipment_name)}</span>
      </div>

      <div class="detail-item">
        <label>Issued To</label>
        <span>${escapeHTML(record.issued_to)}</span>
      </div>

      <div class="detail-item">
        <label>Issue Date</label>
        <span>${formatDate(record.issue_date)}</span>
      </div>

      <div class="detail-item">
        <label>Return Date</label>
        <span>${record.return_date ? formatDate(record.return_date) : '<em>Not yet returned</em>'}</span>
      </div>

      <div class="detail-item">
        <label>Borrow Duration</label>
        <span>${durationDays !== null ? `${durationDays} Days` : 'N/A'}</span>
      </div>

      <div class="detail-item">
        <label>Current Condition</label>
        <span class="badge ${getConditionBadgeClass(record.condition)}">${escapeHTML(record.condition)}</span>
      </div>

      <div class="detail-item">
        <label>Next Service Date</label>
        <span>${formatDate(record.next_service_date)}</span>
      </div>

      ${serviceInfo.isOverdue ? `
        <div class="alert-box alert-overdue">
          ⚠️ Service overdue by ${serviceInfo.days} days
        </div>
      ` : ''}
    `;
  }

  // Calculations
  function calculateBorrowDuration(issueDateStr, returnDateStr) {
    if (!issueDateStr) return null;

    const startDate = new Date(issueDateStr);
    if (isNaN(startDate.getTime())) return null;

    const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
    if (isNaN(endDate.getTime())) return null;

    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return 0;
    
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  function calculateServiceOverdue(serviceDateStr) {
    if (!serviceDateStr) return { isOverdue: false, days: 0 };

    const serviceDate = new Date(serviceDateStr);
    if (isNaN(serviceDate.getTime())) return { isOverdue: false, days: 0 };

    const today = new Date();
    // Reset time components for accurate date-only comparison
    today.setHours(0, 0, 0, 0);
    serviceDate.setHours(0, 0, 0, 0);

    if (today > serviceDate) {
      const diffTime = today.getTime() - serviceDate.getTime();
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return { isOverdue: true, days };
    }

    return { isOverdue: false, days: 0 };
  }

  // Helpers
  function updateRecordCount() {
    recordCounter.textContent = `Showing ${filteredRecords.length} of ${allRecords.length} records`;
  }

  function getConditionBadgeClass(condition) {
    switch (condition) {
      case 'Good': return 'badge-good';
      case 'Needs Repair': return 'badge-needs-repair';
      case 'Damaged': return 'badge-damaged';
      case 'Missing': return 'badge-missing';
      default: return 'badge-missing';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // UI State Switchers
  function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    tableContainer.classList.add('hidden');
  }

  function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tableContainer.classList.add('hidden');
  }

  function showEmptyState() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    tableContainer.classList.add('hidden');
  }

  function hideStateViews() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
  }
});