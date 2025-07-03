import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import json
import os

DATA_FILE = 'reminders.json'

class ReminderApp:
    def __init__(self, root):
        self.root = root
        self.root.title('課題リマインダー')
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.reminders = []
        self.load_reminders()
        self.create_widgets()
        self.schedule_all_reminders()

    def create_widgets(self):
        frame = ttk.Frame(self.root, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text='課題名:').grid(row=0, column=0, sticky=tk.W)
        self.title_entry = ttk.Entry(frame, width=30)
        self.title_entry.grid(row=0, column=1, sticky=tk.W)

        ttk.Label(frame, text='提出日程 (例: 2025-06-21 17:30):').grid(row=1, column=0, sticky=tk.W)
        self.date_entry = ttk.Entry(frame, width=30)
        self.date_entry.grid(row=1, column=1, sticky=tk.W)

        ttk.Label(frame, text='追加メモ:').grid(row=2, column=0, sticky=tk.W)
        self.memo_entry = ttk.Entry(frame, width=30)
        self.memo_entry.grid(row=2, column=1, sticky=tk.W)

        self.add_btn = ttk.Button(frame, text='課題を追加', command=self.add_reminder)
        self.add_btn.grid(row=3, column=0, columnspan=2, pady=5)

        self.tree = ttk.Treeview(frame, columns=('title', 'date', 'memo'), show='headings')
        self.tree.heading('title', text='課題名')
        self.tree.heading('date', text='提出日程')
        self.tree.heading('memo', text='追加メモ')
        self.tree.grid(row=4, column=0, columnspan=2, pady=10)
        self.refresh_tree()

    def add_reminder(self):
        title = self.title_entry.get().strip()
        date_str = self.date_entry.get().strip()
        memo = self.memo_entry.get().strip()
        try:
            due_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M')
        except ValueError:
            messagebox.showerror('エラー', '日付の形式が正しくありません。例: 2025-06-21 17:30')
            return
        reminder = {
            'title': title,
            'due_date': due_date.strftime('%Y-%m-%d %H:%M'),
            'memo': memo
        }
        self.reminders.append(reminder)
        self.save_reminders()
        self.schedule_reminder(reminder)
        self.refresh_tree()
        self.title_entry.delete(0, tk.END)
        self.date_entry.delete(0, tk.END)
        self.memo_entry.delete(0, tk.END)

    def show_notification(self, reminder):
        message = f"課題名: {reminder['title']}\n提出日程: {reminder['due_date']}\nメモ: {reminder['memo']}"
        messagebox.showinfo('課題リマインダー', f'【リマインド】\n{message}')

    def schedule_reminder(self, reminder):
        due_date = datetime.strptime(reminder['due_date'], '%Y-%m-%d %H:%M')
        remind_time = due_date - timedelta(days=1)
        if remind_time > datetime.now():
            self.scheduler.add_job(
                self.show_notification,
                'date',
                run_date=remind_time,
                args=[reminder],
                id=f"reminder_{reminder['title']}_{reminder['due_date']}"
            )

    def schedule_all_reminders(self):
        for reminder in self.reminders:
            self.schedule_reminder(reminder)

    def refresh_tree(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        for r in self.reminders:
            self.tree.insert('', tk.END, values=(r['title'], r['due_date'], r['memo']))

    def save_reminders(self):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.reminders, f, ensure_ascii=False, indent=2)

    def load_reminders(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                self.reminders = json.load(f)
        else:
            self.reminders = []

if __name__ == '__main__':
    root = tk.Tk()
    app = ReminderApp(root)
    root.mainloop()
