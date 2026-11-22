(function () {
  'use strict';

  var demo = document.body.dataset.demo === 'true';
  var csrf = '';
  var authToken = sessionStorage.getItem('dumle-admin-token') || '';
  var adminName = '';
  var selectedType = 'questions';
  var offset = 0;
  var searchTimer = null;
  var lastRecords = [];
  var $ = function (id) { return document.getElementById(id); };
  var loginView = $('loginView');
  var dashboardView = $('dashboardView');
  var loginError = $('loginError');

  var demoRecords = {
    questions: [
      {id: 104, name: 'Ada N.', contact: 'ada@example.com', lga: 'Obio/Akpor', question: 'What skills programmes will be open to young people?', status: 'new', created_at: '2026-11-05 13:24:00'},
      {id: 103, name: 'Community voice', contact: '', lga: 'Khana', question: 'How will you improve access to healthcare in rural communities?', status: 'in_progress', created_at: '2026-11-05 11:10:00'},
      {id: 102, name: 'Michael O.', contact: '0800 ••• ••••', lga: 'Port Harcourt', question: 'Will the new roads include better drainage?', status: 'resolved', created_at: '2026-11-04 15:43:00'},
      {id: 101, name: 'Farmer in Bonny', contact: '', lga: 'Bonny', question: 'What support will be available for fishers and small farmers?', status: 'new', created_at: '2026-11-04 09:02:00'}
    ],
    videos: [
      {id: 28, name: 'A. W.', contact: '0800 ••• ••••', lga: 'Degema', ward: 'Usokun', topic: 'area', original_name: 'community-road.mp4', size_bytes: 18300000, status: 'new', created_at: '2026-11-05 12:08:00'},
      {id: 27, name: 'Community team', contact: '', lga: 'Gokana', ward: 'Bodo', topic: 'campaign', original_name: 'voices-from-bodo.mp4', size_bytes: 25100000, status: 'in_progress', created_at: '2026-11-04 16:22:00'}
    ],
    chat: [
      {id: 782, session_id: 'sample-visitor-01', question: 'How will you create jobs?', answer: 'I will turn the wealth of Rivers State into jobs, businesses and practical opportunities through enterprise financing, SME support and skills programmes.', sources: 'Agenda 2', channel: 'text', created_at: '2026-11-05 14:31:00'},
      {id: 781, session_id: 'sample-visitor-02', question: 'Wetin you go do for light?', answer: 'I wan give Rivers 24/7 light through gas-to-power, solar and better power market.', sources: 'Agenda 3', channel: 'voice', created_at: '2026-11-05 12:51:00'},
      {id: 780, session_id: 'sample-visitor-03', question: 'What will you do about security?', answer: 'Security will be the first responsibility of my administration. I will bring together intelligence, technology, community security and emergency response.', sources: 'Agenda 1', channel: 'text', created_at: '2026-11-04 18:07:00'}
    ]
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char];
    });
  }

  async function request(action, options) {
    options = options || {};
    var headers = {'X-ADG': '1'};
    if (authToken) headers.Authorization = 'Bearer ' + authToken;
    if (options.body) {
      headers['Content-Type'] = 'application/json';
      options.body.csrf = csrf;
    }
    var response = await fetch('../api/admin.php?action=' + encodeURIComponent(action) + (options.query || ''), {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    var result;
    try { result = await response.json(); } catch (_) { result = {ok: false, error: 'The server returned an invalid response.'}; }
    if (response.status === 401 && action !== 'login' && action !== 'refresh' && !options._retried) {
      var refreshToken = sessionStorage.getItem('dumle-admin-refresh-token') || '';
      if (refreshToken) {
        var refreshResponse = await fetch('../api/admin.php?action=refresh', {
          method: 'POST',
          headers: {'X-ADG': '1', 'Content-Type': 'application/json'},
          body: JSON.stringify({refresh_token: refreshToken})
        });
        var refreshed = await refreshResponse.json().catch(function () { return {}; });
        if (refreshResponse.ok && refreshed.ok && refreshed.access_token) {
          authToken = refreshed.access_token;
          sessionStorage.setItem('dumle-admin-token', authToken);
          if (refreshed.refresh_token) sessionStorage.setItem('dumle-admin-refresh-token', refreshed.refresh_token);
          return request(action, Object.assign({}, options, {_retried: true}));
        }
      }
      authToken = '';
      sessionStorage.removeItem('dumle-admin-token');
      sessionStorage.removeItem('dumle-admin-refresh-token');
    }
    if (!response.ok || !result.ok) throw new Error(result.error || 'The request could not be completed.');
    return result;
  }

  function showLogin() {
    loginView.hidden = false;
    dashboardView.hidden = true;
    $('adminName').hidden = true;
    $('logoutButton').hidden = true;
    $('username').focus();
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    $('adminName').textContent = adminName;
    $('adminName').hidden = false;
    $('logoutButton').hidden = false;
    $('greetingName').textContent = adminName ? ', ' + adminName : '';
  }

  function statusLabel(status) {
    return ({new: 'New', in_progress: 'In progress', resolved: 'Resolved', spam: 'Spam'})[status] || status;
  }

  function dateLabel(value) {
    if (!value) return '—';
    var date = new Date(String(value).replace(' ', 'T') + (String(value).endsWith('Z') ? '' : 'Z'));
    return isNaN(date.getTime()) ? value : date.toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
  }

  function setSummary(summary) {
    $('statQuestions').textContent = summary.questions;
    $('statNewQuestions').innerHTML = '<em>' + escapeHtml(summary.new_questions) + ' new</em> · ' + escapeHtml(summary.questions) + ' total';
    $('statVideos').textContent = summary.videos;
    $('statNewVideos').innerHTML = '<em>' + escapeHtml(summary.new_videos) + ' new</em> · ' + escapeHtml(summary.videos) + ' total';
    $('statChats').textContent = summary.chats;
    $('statSessions').textContent = summary.sessions + ' unique visitors · 7 days';
    $('questionBadge').textContent = summary.new_questions;
    $('videoBadge').textContent = summary.new_videos;
  }

  function filterQuery() {
    var params = new URLSearchParams();
    params.set('type', selectedType);
    params.set('offset', String(offset));
    if ($('searchInput').value.trim()) params.set('q', $('searchInput').value.trim());
    if ($('statusFilter').value && selectedType !== 'chat') params.set('status', $('statusFilter').value);
    return '?' + params.toString();
  }

  function columnsForType() {
    if (selectedType === 'videos') return [['submission', 'Community'], ['location', 'Location'], ['topic', 'Topic'], ['created_at', 'Received'], ['status', 'Status'], ['actions', '']];
    if (selectedType === 'chat') return [['question', 'Question'], ['channel', 'Channel'], ['sources', 'Source'], ['created_at', 'Received'], ['actions', '']];
    return [['question', 'Message'], ['community', 'Community'], ['created_at', 'Received'], ['status', 'Status'], ['actions', '']];
  }

  function tableHeading() {
    $('inboxTitle').textContent = selectedType === 'videos' ? 'Community videos' : selectedType === 'chat' ? 'Chat logs' : 'Community inbox';
    $('statusFilter').hidden = selectedType === 'chat';
    $('tableHead').replaceChildren();
    var row = document.createElement('tr');
    columnsForType().forEach(function (column) {
      var th = document.createElement('th');
      th.textContent = column[1];
      row.appendChild(th);
    });
    $('tableHead').appendChild(row);
  }

  function statusControl(record) {
    if (selectedType === 'chat') return '<span class="muted">—</span>';
    return '<select class="status-select" data-status="' + escapeHtml(record.status) + '" data-id="' + escapeHtml(record.id) + '" aria-label="Update status">' +
      ['new', 'in_progress', 'resolved', 'spam'].map(function (status) {
        return '<option value="' + status + '"' + (record.status === status ? ' selected' : '') + '>' + statusLabel(status) + '</option>';
      }).join('') + '</select>';
  }

  function renderRows(records) {
    var body = $('recordRows');
    body.replaceChildren();
    $('emptyState').hidden = records.length > 0;
    $('recordCount').textContent = records.length ? (records.length === 1 ? '1 record' : records.length + ' records') : 'No records';
    records.forEach(function (record) {
      var row = document.createElement('tr');
      var first;
      if (selectedType === 'videos') {
        first = '<div class="cell-primary">' + escapeHtml(record.name || 'Community member') + '</div><span class="cell-sub">' + escapeHtml(record.original_name) + '</span>';
      } else if (selectedType === 'chat') {
        first = '<div class="cell-primary">' + escapeHtml(record.question) + '</div><span class="cell-sub">' + escapeHtml(record.session_id) + '</span>';
      } else {
        first = '<div class="cell-primary">' + escapeHtml(record.question) + '</div><span class="cell-sub">' + escapeHtml(record.id ? 'Question #' + record.id : '') + '</span>';
      }
      var community = escapeHtml(record.name || 'Community member') + '<span class="cell-sub">' + escapeHtml(record.lga || 'LGA not provided') + '</span>';
      var cells = selectedType === 'videos'
        ? [first, escapeHtml(record.lga) + '<span class="cell-sub">' + escapeHtml(record.ward) + '</span>', escapeHtml(record.topic), escapeHtml(dateLabel(record.created_at)), statusControl(record), '']
        : selectedType === 'chat'
          ? [first, escapeHtml(record.channel || 'text'), escapeHtml(record.sources || '—'), escapeHtml(dateLabel(record.created_at)), '']
          : [first, community, escapeHtml(dateLabel(record.created_at)), statusControl(record), ''];
      cells.forEach(function (value, index) {
        var cell = document.createElement('td');
        cell.innerHTML = value;
        if (columnsForType()[index][0] === 'actions') {
          var button = document.createElement('button');
          button.className = 'open-button';
          button.type = 'button';
          button.dataset.open = String(record.id);
          button.textContent = 'Open';
          cell.appendChild(button);
        }
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    $('pageLabel').textContent = 'Showing ' + (offset + 1) + '–' + (offset + records.length) + ' recent records';
    $('nextPage').disabled = records.length < 50;
  }

  function setError(message) {
    var error = $('dashboardError');
    error.textContent = message || '';
    error.hidden = !message;
  }

  async function loadRecords() {
    setError('');
    tableHeading();
    try {
      var records;
      if (demo) {
        var query = $('searchInput').value.trim().toLowerCase();
        records = demoRecords[selectedType].filter(function (item) {
          var statusOk = selectedType === 'chat' || !$('statusFilter').value || item.status === $('statusFilter').value;
          var searchOk = !query || Object.keys(item).some(function (key) { return String(item[key]).toLowerCase().includes(query); });
          return statusOk && searchOk;
        }).slice(offset, offset + 50);
      } else {
        var result = await request('records', {query: filterQuery()});
        records = result.records;
      }
      lastRecords = records;
      renderRows(records);
    } catch (error) {
      setError(error.message);
    }
  }

  async function loadDashboard() {
    try {
      if (demo) {
        setSummary({questions: 18, new_questions: 5, videos: 7, new_videos: 2, chats: 246, sessions: 83});
      } else {
        var result = await request('summary');
        setSummary(result.summary);
      }
      showDashboard();
      await loadRecords();
    } catch (error) {
      if (error.message === 'Please sign in again.') {
        showLogin();
      } else {
        showLogin();
        loginError.textContent = error.message;
        loginError.hidden = false;
      }
    }
  }

  function displayDetails(record) {
    var panel = $('detailPanel');
    var title = selectedType === 'videos' ? record.original_name : selectedType === 'chat' ? record.question : record.question;
    var meta = [
      ['Name', record.name || 'Not provided'],
      ['Contact', record.contact || 'Not provided'],
      ['LGA', record.lga || 'Not provided'],
      ['Received', dateLabel(record.created_at)]
    ];
    if (selectedType === 'videos') meta.push(['Ward', record.ward || 'Not provided'], ['Topic', record.topic || '—'], ['File size', record.size_bytes ? (record.size_bytes / 1048576).toFixed(1) + ' MB' : '—']);
    if (selectedType === 'questions' && record.website) meta.push(['Website', record.website]);
    if (selectedType === 'chat') meta.push(['Channel', record.channel || 'text'], ['Sources', record.sources || '—'], ['Visitor session', record.session_id || '—']);
    var content = $('detailContent');
    content.replaceChildren();
    var kicker = document.createElement('span');
    kicker.className = 'detail-kicker';
    kicker.textContent = selectedType === 'videos' ? 'Community video' : selectedType === 'chat' ? 'Chat exchange' : 'Community question';
    var heading = document.createElement('h2');
    heading.textContent = title;
    var grid = document.createElement('div');
    grid.className = 'detail-meta';
    meta.forEach(function (item) {
      var cell = document.createElement('div');
      var label = document.createElement('span');
      label.textContent = item[0];
      var value = document.createElement('strong');
      value.textContent = item[1];
      cell.append(label, value);
      grid.appendChild(cell);
    });
    content.append(kicker, heading, grid);
    if (selectedType !== 'chat' && record.contact) {
      var contactValue = String(record.contact).trim();
      var reply = document.createElement('a');
      reply.className = 'button button-outline button-wide detail-action';
      if (contactValue.indexOf('@') >= 0) {
        reply.href = 'mailto:' + encodeURIComponent(contactValue) + '?subject=' + encodeURIComponent('Your question to the Dumle Maol campaign');
        reply.textContent = 'Reply by email';
      } else {
        var phone = contactValue.replace(/[^\d+]/g, '');
        if (phone.replace(/\D/g, '').length >= 7) {
          reply.href = 'sms:' + phone + '?body=' + encodeURIComponent('Hello, following up on your message to the Dumle Maol campaign.');
          reply.textContent = 'Reply by SMS';
        }
      }
      if (reply.href) content.appendChild(reply);
    }
    if (record.answer || record.question) {
      if (selectedType === 'chat') {
        var question = document.createElement('p');
        question.className = 'detail-body';
        question.textContent = 'VISITOR ASKED\n' + record.question;
        var answer = document.createElement('p');
        answer.className = 'detail-body';
        answer.textContent = 'ASSISTANT REPLIED\n' + record.answer;
        content.append(question, answer);
      } else if (selectedType === 'questions') {
        var message = document.createElement('p');
        message.className = 'detail-body';
        message.textContent = record.question;
        content.appendChild(message);
      }
    }
    if (selectedType === 'videos') {
      var download = document.createElement('a');
      download.className = 'button button-primary button-wide detail-action';
      download.href = '#';
      download.textContent = demo ? 'Sample video · preview only' : 'Download video securely';
      download.addEventListener('click', async function (event) {
        event.preventDefault();
        if (demo) return;
        try {
          var result = await request('download', {query: '&id=' + encodeURIComponent(record.id)});
          window.location.assign(result.url);
        } catch (error) {
          setError(error.message);
        }
      });
      content.appendChild(download);
    }
    if (selectedType !== 'chat') {
      var actions = document.createElement('div');
      actions.className = 'detail-action';
      var select = document.createElement('select');
      select.setAttribute('aria-label', 'Update status');
      ['new', 'in_progress', 'resolved', 'spam'].forEach(function (status) {
        var option = document.createElement('option');
        option.value = status;
        option.textContent = statusLabel(status);
        option.selected = status === record.status;
        select.appendChild(option);
      });
      select.addEventListener('change', function () { updateStatus(record, select.value); });
      actions.appendChild(select);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-outline button-wide';
      remove.textContent = 'Delete record';
      remove.addEventListener('click', function () { deleteRecord(record); });
      actions.appendChild(remove);
      content.appendChild(actions);
    }
    panel.hidden = false;
  }

  async function updateStatus(record, status) {
    try {
      if (demo) {
        record.status = status;
      } else {
        await request('update', {method: 'POST', body: {type: selectedType, id: record.id, status: status}});
      }
      await loadRecords();
    } catch (error) {
      setError(error.message);
    }
  }

  async function deleteRecord(record) {
    if (!window.confirm('Delete this record permanently?')) return;
    try {
      if (!demo) await request('delete', {method: 'POST', body: {type: selectedType, id: record.id}});
      else demoRecords[selectedType] = demoRecords[selectedType].filter(function (item) { return item.id !== record.id; });
      $('detailPanel').hidden = true;
      await loadRecords();
      if (!demo) await loadDashboard();
    } catch (error) {
      setError(error.message);
    }
  }

  async function exportCsv() {
    if (demo) {
      window.alert('CSV export is available after the PHP API and database are installed.');
      return;
    }
    try {
      var response = await fetch('../api/admin.php?action=export' + filterQuery().replace('?', '&'), {
        headers: {'X-ADG': '1', Authorization: 'Bearer ' + authToken},
        credentials: 'same-origin'
      });
      if (response.status === 401) {
        await request('session');
        response = await fetch('../api/admin.php?action=export' + filterQuery().replace('?', '&'), {
          headers: {'X-ADG': '1', Authorization: 'Bearer ' + authToken},
          credentials: 'same-origin'
        });
      }
      if (!response.ok) {
        var problem = await response.json().catch(function () { return {}; });
        throw new Error(problem.error || 'CSV export could not be downloaded.');
      }
      var blob = await response.blob();
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ask-dumle-maol-' + selectedType + '.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      setError(error.message);
    }
  }

  $('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (demo) return;
    loginError.hidden = true;
    var button = $('loginForm').querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result = await request('login', {
        method: 'POST',
        body: {username: $('username').value.trim(), password: $('password').value}
      });
      authToken = result.access_token;
      if (!authToken) throw new Error('Sign-in did not return a secure session. Please try again.');
      sessionStorage.setItem('dumle-admin-token', authToken);
      if (result.refresh_token) sessionStorage.setItem('dumle-admin-refresh-token', result.refresh_token);
      csrf = result.csrf;
      adminName = result.admin.username;
      $('password').value = '';
      await loadDashboard();
    } catch (error) {
      loginError.textContent = error.message;
      loginError.hidden = false;
    } finally {
      button.disabled = false;
    }
  });

  $('demoButton').hidden = !demo;
  $('demoButton').addEventListener('click', function () {
    adminName = 'Preview';
    loadDashboard();
  });
  $('logoutButton').addEventListener('click', async function () {
    if (!demo) {
      try { await request('logout', {method: 'POST', body: {}}); } catch (error) { setError(error.message); }
    }
    csrf = '';
    authToken = '';
    sessionStorage.removeItem('dumle-admin-token');
    sessionStorage.removeItem('dumle-admin-refresh-token');
    showLogin();
  });
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      selectedType = tab.dataset.type;
      offset = 0;
      $('statusFilter').value = '';
      document.querySelectorAll('.tab').forEach(function (other) { other.classList.toggle('active', other === tab); });
      loadRecords();
    });
  });
  $('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { offset = 0; loadRecords(); }, 250);
  });
  $('statusFilter').addEventListener('change', function () { offset = 0; loadRecords(); });
  $('nextPage').addEventListener('click', function () { offset += 50; loadRecords(); });
  $('exportButton').addEventListener('click', exportCsv);
  $('recordRows').addEventListener('click', function (event) {
    var button = event.target.closest('[data-open]');
    if (!button) return;
    var record = lastRecords.find(function (item) { return String(item.id) === button.dataset.open; });
    if (record) displayDetails(record);
  });
  $('recordRows').addEventListener('change', function (event) {
    var select = event.target.closest('.status-select');
    if (!select) return;
    var record = lastRecords.find(function (item) { return String(item.id) === select.dataset.id; });
    if (record) updateStatus(record, select.value);
  });
  $('closeDetail').addEventListener('click', function () { $('detailPanel').hidden = true; });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') $('detailPanel').hidden = true;
  });

  if (demo) {
    showLogin();
  } else {
    $('username').type = 'email';
    $('username').autocomplete = 'username';
    $('username').placeholder = 'you@example.com';
    $('username').previousElementSibling.textContent = 'Email address';
    $('password').maxLength = 128;
    $('password').placeholder = 'Your campaign account password';
    $('loginError').hidden = true;
    request('csrf').then(function (result) {
      csrf = result.csrf;
      return request('session');
    }).then(function (result) {
      csrf = result.csrf;
      adminName = result.admin.username;
      loadDashboard();
    }).catch(function (error) {
      if (error.message !== 'Please sign in again.') {
        loginError.textContent = error.message;
        loginError.hidden = false;
      }
      showLogin();
    });
  }
}());
