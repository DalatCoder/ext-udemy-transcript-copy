# 🎬 Udemy Tools - Chrome Extension

Chrome Extension hỗ trợ học tập trên Udemy: copy transcript và tạo thư mục ghi chú theo cấu trúc khóa học.

## ✨ Tính năng

### � Copy Transcript
- Tự động mở transcript panel nếu chưa mở
- Copy toàn bộ nội dung transcript
- Tự động đóng panel sau khi copy

### 📚 Tạo Thư mục Ghi chú
- Trích xuất danh sách sections từ sidebar
- Tạo lệnh `mkdir` với tên thư mục chuẩn hóa
- Format: `01-ten-section`, `02-ten-section`...

## 🚀 Cài đặt

1. Clone repository này
2. Mở Chrome → `chrome://extensions/`
3. Bật **Developer mode** (góc trên phải)
4. Click **Load unpacked** → Chọn thư mục extension
5. Extension sẽ xuất hiện trên toolbar

## 📖 Hướng dẫn sử dụng

### Copy Transcript
1. Mở video Udemy có transcript
2. Click icon extension trên toolbar
3. Chờ extension tìm transcript
4. Click **Copy Transcript**
5. Panel sẽ tự động đóng lại

### Tạo thư mục Obsidian
1. Mở trang khóa học Udemy
2. Click icon extension → Tab **Sections**
3. Click **Get Sections**
4. Click **Copy mkdir Command**
5. Mở terminal trong Obsidian vault
6. Paste và chạy lệnh

## 🔧 Cấu trúc

```
ext-udemy-transcript-copy/
├── manifest.json    # Cấu hình extension
├── content.js       # Script chạy trên Udemy
├── popup.html       # Giao diện popup
├── popup.js         # Logic popup
├── background.js    # Background service
└── icons/           # Icons extension
```

## � Ví dụ Output

```bash
mkdir -p \
  "01-welcome-welcome-welcome" \
  "02-a-first-look-at-react" \
  "03-working-with-components-props-and-jsx" \
  ...
```

## 🎨 Giao diện

- Theme tự nhiên với tông màu xanh lá
- Thiết kế hiện đại, dễ sử dụng
- Hỗ trợ 2 tab: Transcript & Sections

## � License

MIT License - Tự do sử dụng và chỉnh sửa.

---

**Made with 💚 for Udemy learners**
