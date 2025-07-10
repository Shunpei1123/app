// main.js
// 課題リマインダー ロジック

const STORAGE_KEY = 'reminders';
let reminders = [];

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
function renderTable() {
  const tbody = document.querySelector('#reminderTable tbody');
  tbody.innerHTML = '';
  reminders.forEach(rem => {
    let repeatText = '';
    if (rem.repeat === 'daily') repeatText = '（毎日）';
    if (rem.repeat === 'weekly') repeatText = '（毎週）';
    if (rem.repeat === 'yearly') repeatText = '（毎年）';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rem.title}</td><td>${rem.dueDate.replace('T', ' ')}${repeatText}</td><td>${rem.memo || ''}</td>`;
    tbody.appendChild(tr);
  });
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
  renderTable();
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
        renderTable();
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
renderTable();
scheduleAllNotifications();
