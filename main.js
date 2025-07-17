// main.js
// 課題リマインダー ロジック

const STORAGE_KEY = 'reminders';
let reminders = [];
let calendarYear = (new Date()).getFullYear();
let calendarMonth = (new Date()).getMonth();

// 通知許可をリクエスト
if (window.Notification && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// ローカルストレージからリマインダーを読み込む
function loadReminders() {
  const data = localStorage.getItem(STORAGE_KEY);
  reminders = data ? JSON.parse(data) : [];
}

// ローカルストレージに保存
function saveReminders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

// テーブルを更新
// カレンダー描画
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  const monthLabel = document.getElementById('calendarMonthLabel');
  if (!container) return;
  container.innerHTML = '';
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  if (monthLabel) monthLabel.textContent = `${year}年${month+1}月`;

  // カレンダー表作成
  let html = '<table class="calendar-table"><thead><tr>';
  const weekDays = ['日','月','火','水','木','金','土'];
  weekDays.forEach(d => html += `<th>${d}</th>`);
  html += '</tr></thead><tbody><tr>';
  for (let i = 0; i < startDay; i++) html += '<td></td>';
  // ...existing code...
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayReminders = getRemindersForDate(dateStr);
    html += `<td class="cal-cell" data-date="${dateStr}" style="vertical-align:top;min-width:80px;min-height:60px;cursor:pointer;">`;
    html += `<div class="cal-date">${d}</div>`;
    if (dayReminders.length > 0) {
      html += `<div class="cal-dot" style="width:12px;height:12px;background:#222;border-radius:50%;margin:6px auto 0 auto;"></div>`;
    }
    html += '</td>';
    if ((startDay + d) % 7 === 0 && d !== daysInMonth) html += '</tr><tr>';
  }
  const remain = (startDay + daysInMonth) % 7;
  if (remain !== 0) for (let i = remain; i < 7; i++) html += '<td></td>';
  html += '</tr></tbody></table>';
  container.innerHTML = html;

  // 日付クリックで詳細表示
  document.querySelectorAll('.cal-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const date = cell.getAttribute('data-date');
      const tasks = getRemindersForDate(date);
      showTaskDetailModal(date, tasks);
    });
  });
// 繰り返し課題も含めて、当日表示する課題を集計（関数を外に定義）
function getRemindersForDate(dateStr) {
  let result = reminders.filter(rem => rem.dueDate && rem.dueDate.startsWith(dateStr));
  reminders.forEach(rem => {
    if (!rem.dueDate || !rem.repeat || rem.repeat === 'none') return;
    let base = new Date(rem.dueDate);
    let target = new Date(dateStr);
    // 毎日
    if (rem.repeat === 'daily') {
      if (target >= base) {
        const diff = (target - base) / (1000*60*60*24);
        if (Number.isInteger(diff)) result.push(rem);
      }
    }
    // 毎週
    else if (rem.repeat === 'weekly') {
      if (target >= base && target.getDay() === base.getDay()) {
        result.push(rem);
      }
    }
    // 毎年
    else if (rem.repeat === 'yearly') {
      if (target >= base && base.getDate() === target.getDate() && base.getMonth() === target.getMonth()) {
        result.push(rem);
      }
    }
  });
  return result;
}
}
// 月切り替え
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
if (prevMonthBtn && nextMonthBtn) {
  prevMonthBtn.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderCalendar();
  });
  nextMonthBtn.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderCalendar();
  });
}
// 課題詳細モーダル
function showTaskDetailModal(date, tasks) {
  const modal = document.getElementById('taskDetailModal');
  const content = document.getElementById('taskDetailContent');
  if (!modal || !content) return;
  let html = `<div style="font-weight:600;color:#1976d2;margin-bottom:8px;">${date.replace(/-/g,'/')} の課題</div>`;
  if (tasks.length === 0) {
    html += '<div>課題はありません。</div>';
  } else {
    tasks.forEach((rem, idx) => {
      html += `<div class="modal-task-block" style="margin-bottom:16px;">
        <div><b>課題名:</b> <span class="modal-task-title">${rem.title}</span></div>
        <div><b>提出日時:</b> ${rem.dueDate.replace('T',' ')}</div>
        <div><b>メモ:</b> ${rem.memo || ''}</div>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button class="edit-task-btn" data-task-idx="${reminders.indexOf(rem)}" style="background:#4f8cff;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;">編集</button>
          <button class="delete-task-btn" data-task-idx="${reminders.indexOf(rem)}" data-task-date="${date}" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;">削除</button>
        </div>`;
      // 繰り返し課題の場合は追加ボタン
      if (rem.repeat && rem.repeat !== 'none') {
        html += `<div style="margin-top:6px;display:flex;gap:8px;">
          <button class="delete-task-future-btn" data-task-idx="${reminders.indexOf(rem)}" data-task-date="${date}" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;">今後の課題も削除</button>
        </div>`;
      }
      html += `</div>`;
    });
  }
  content.innerHTML = html;
  modal.style.display = 'block';

  // 編集ボタン
  content.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = btn.getAttribute('data-task-idx');
      showEditTaskModal(idx);
    });
  });
  // 削除ボタン（単一）
  content.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.getAttribute('data-task-idx'));
      const date = btn.getAttribute('data-task-date');
      // 通常課題 or 繰り返し課題のこの日だけ削除
      const rem = reminders[idx];
      if (!rem.repeat || rem.repeat === 'none') {
        reminders.splice(idx, 1);
      } else {
        // 「この課題のみ削除」: タイトル・repeat・dueDate・memo完全一致のみ削除
        reminders = reminders.filter(r => {
          if (r.title !== rem.title || r.repeat !== rem.repeat || r.memo !== rem.memo) return true;
          return r.dueDate !== rem.dueDate;
        });
      }
      saveReminders();
      renderCalendar();
      document.getElementById('taskDetailModal').style.display = 'none';
    });
  });
  // 今後の課題も削除ボタン
  content.querySelectorAll('.delete-task-future-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.getAttribute('data-task-idx'));
      const date = btn.getAttribute('data-task-date');
      const rem = reminders[idx];
      // 繰り返し課題の今後分を削除（開始日以降、タイトル・repeat一致）
      reminders = reminders.filter(r => {
        if (r.title !== rem.title || r.repeat !== rem.repeat || r.memo !== rem.memo) return true;
        // 「今後の課題を削除」: 選択日より前の課題は残す（選択日以降は削除）
        return new Date(r.dueDate) < new Date(rem.dueDate);
      });
      saveReminders();
      renderCalendar();
      document.getElementById('taskDetailModal').style.display = 'none';
    });
  });
}

// モーダル閉じる
const closeTaskDetail = document.getElementById('closeTaskDetail');
if (closeTaskDetail) {
  closeTaskDetail.addEventListener('click', () => {
    document.getElementById('taskDetailModal').style.display = 'none';
  });
}

// 課題編集モーダル
function showEditTaskModal(idx) {
  const modal = document.getElementById('taskDetailModal');
  const content = document.getElementById('taskDetailContent');
  if (!modal || !content) return;
  const rem = reminders[idx];
  let html = `<div style="font-weight:600;color:#1976d2;margin-bottom:8px;">課題編集</div>`;
  html += `<div style="margin-bottom:8px;"><label>課題名:<br><input id="editTitle" type="text" value="${rem.title}" style="width:90%;padding:4px;"></label></div>`;
  html += `<div style="margin-bottom:8px;"><label>提出日時:<br><input id="editDueDate" type="datetime-local" value="${rem.dueDate}" style="width:90%;padding:4px;"></label></div>`;
  html += `<div style="margin-bottom:8px;"><label>メモ:<br><input id="editMemo" type="text" value="${rem.memo || ''}" style="width:90%;padding:4px;"></label></div>`;
  html += `<button id="saveEditTaskBtn" style="background:#4f8cff;color:#fff;border:none;border-radius:6px;padding:6px 18px;cursor:pointer;">保存</button>`;
  content.innerHTML = html;
  // 保存ボタン
  document.getElementById('saveEditTaskBtn').onclick = function() {
    rem.title = document.getElementById('editTitle').value.trim();
    rem.dueDate = document.getElementById('editDueDate').value;
    rem.memo = document.getElementById('editMemo').value.trim();
    saveReminders();
    renderCalendar();
    modal.style.display = 'none';
  };
}

// リマインダー追加
function addReminder(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const memo = document.getElementById('memo').value.trim();
  const repeat = document.getElementById('repeatSelect').value;
  if (!title || !dueDate) return;
  reminders.push({ title, dueDate, memo, repeat });
  saveReminders();
  renderCalendar();
  scheduleNotification({ title, dueDate, memo, repeat });
  e.target.reset();
  document.getElementById('repeatSelect').style.display = 'none';
}

// 1日前の通知と当日通知をブラウザ内で管理
function scheduleNotification(reminder) {
  // 1日前通知
  const due = new Date(reminder.dueDate);
  const remindTime = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();
  if (remindTime > now) {
    const timeout = remindTime.getTime() - now.getTime();
    setTimeout(() => {
      showNotification(reminder, '【リマインド】課題提出1日前');
      // 繰り返し設定がある場合は次回分を自動追加
      if (reminder.repeat && reminder.repeat !== 'none') {
        let nextDue = new Date(reminder.dueDate);
        if (reminder.repeat === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        if (reminder.repeat === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        if (reminder.repeat === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
        const newReminder = { ...reminder, dueDate: nextDue.toISOString().slice(0,16) };
        reminders.push(newReminder);
        saveReminders();
  renderCalendar();
        scheduleNotification(newReminder);
      }
    }, timeout);
  }
  // 当日通知
  if (due > now) {
    const timeout2 = due.getTime() - now.getTime();
    setTimeout(() => {
      showNotification(reminder, '【リマインド】課題提出当日');
    }, timeout2);
  }
}
// 繰り返しボタンの挙動
const repeatBtn = document.getElementById('repeatBtn');
const repeatSelect = document.getElementById('repeatSelect');
const repeatStatus = document.getElementById('repeatStatus');
const repeatTextMap = {
  none: 'しない',
  daily: '毎日',
  weekly: '毎週',
  yearly: '毎年'
};
function updateRepeatStatus() {
  if (repeatStatus && repeatSelect) {
    const val = repeatSelect.value;
    repeatStatus.textContent = `【${repeatTextMap[val]}】`;
  }
}
if (repeatBtn && repeatSelect && repeatStatus) {
  repeatBtn.addEventListener('click', () => {
    if (repeatSelect.style.display === 'none' || repeatSelect.style.display === '') {
      repeatSelect.style.display = 'inline-block';
      repeatSelect.focus();
    } else {
      repeatSelect.style.display = 'none';
    }
  });
  // 選択したら自動で閉じる＋表示更新
  repeatSelect.addEventListener('change', () => {
    repeatSelect.style.display = 'none';
    updateRepeatStatus();
  });
  // 初期状態は非表示＋表示
  repeatSelect.style.display = 'none';
  updateRepeatStatus();
}

// すべてのリマインダーの通知を再スケジューリング
function scheduleAllNotifications() {
  reminders.forEach(scheduleNotification);
}

// 通知を表示（ブラウザ内通知）
function showNotification(reminder, title) {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title || '【リマインド】課題提出1日前', {
      body: `課題名: ${reminder.title}\n提出日程: ${reminder.dueDate.replace('T', ' ')}\nメモ: ${reminder.memo || ''}`
    });
  } else {
    // ブラウザ通知が許可されていない場合は画面上に表示
    showInPageNotification(title || '【リマインド】課題提出1日前', reminder);
  }
}

// 画面内通知
function showInPageNotification(title, reminder) {
  let n = document.createElement('div');
  n.className = 'inpage-notify';
  n.innerHTML = `<strong>${title}</strong><br>課題名: ${reminder.title}<br>提出日程: ${reminder.dueDate.replace('T', ' ')}<br>メモ: ${reminder.memo || ''}`;
  document.body.appendChild(n);
  setTimeout(() => {
    n.classList.add('show');
    setTimeout(() => {
      n.classList.remove('show');
      setTimeout(() => n.remove(), 500);
    }, 6000);
  }, 100);
}

document.getElementById('reminderForm').addEventListener('submit', addReminder);

// --- 繰り返しステータスの初期表示を必ず反映 ---
window.addEventListener('DOMContentLoaded', () => {
  if (typeof updateRepeatStatus === 'function') updateRepeatStatus();
});

// 初期化
loadReminders();
renderCalendar();
scheduleAllNotifications();
