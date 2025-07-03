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
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rem.title}</td><td>${rem.dueDate.replace('T', ' ')}</td><td>${rem.memo || ''}</td>`;
    tbody.appendChild(tr);
  });
}

// リマインダー追加
function addReminder(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const memo = document.getElementById('memo').value.trim();
  if (!title || !dueDate) return;
  reminders.push({ title, dueDate, memo });
  saveReminders();
  renderTable();
  scheduleNotification({ title, dueDate, memo });
  e.target.reset();
}

// 1日前の通知をスケジューリング
function scheduleNotification(reminder) {
  const due = new Date(reminder.dueDate);
  const remindTime = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();
  if (remindTime > now) {
    const timeout = remindTime.getTime() - now.getTime();
    setTimeout(() => {
      showNotification(reminder);
    }, timeout);
  }
}

// すべてのリマインダーの通知を再スケジューリング
function scheduleAllNotifications() {
  reminders.forEach(scheduleNotification);
}

// 通知を表示
function showNotification(reminder) {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification('【リマインド】課題提出1日前', {
      body: `課題名: ${reminder.title}\n提出日程: ${reminder.dueDate.replace('T', ' ')}\nメモ: ${reminder.memo || ''}`
    });
  }
}

document.getElementById('reminderForm').addEventListener('submit', addReminder);

// 初期化
loadReminders();
renderTable();
scheduleAllNotifications();
