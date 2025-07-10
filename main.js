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

// 1日前の通知をスケジューリング
function scheduleNotification(reminder) {
  const due = new Date(reminder.dueDate);
  const remindTime = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();
  if (remindTime > now) {
    const timeout = remindTime.getTime() - now.getTime();
    setTimeout(() => {
      showNotification(reminder);
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
}
// 繰り返しボタンの挙動
const repeatBtn = document.getElementById('repeatBtn');
const repeatSelect = document.getElementById('repeatSelect');
if (repeatBtn && repeatSelect) {
  repeatBtn.addEventListener('click', () => {
    repeatSelect.style.display = repeatSelect.style.display === 'none' ? 'inline-block' : 'none';
  });
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
