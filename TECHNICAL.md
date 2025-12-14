# 📚 Tài liệu Kỹ thuật - Udemy Tools Extension

## 1. Tổng quan

**Udemy Tools** là Chrome Extension (Manifest V3) hỗ trợ học tập trên nền tảng Udemy với hai tính năng chính:
- Copy nội dung transcript từ video
- Tạo cấu trúc thư mục ghi chú theo sections của khóa học

---

## 2. Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      CHROME EXTENSION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    Messages    ┌──────────────────────┐  │
│  │   popup.js   │ ◄────────────► │     content.js       │  │
│  │   popup.html │                │  (chạy trên Udemy)   │  │
│  └──────────────┘                └──────────────────────┘  │
│         │                                  │                │
│         │                                  │                │
│         ▼                                  ▼                │
│  ┌──────────────┐                ┌──────────────────────┐  │
│  │ background.js│                │    DOM của Udemy     │  │
│  │  (service    │                │  - Transcript panel  │  │
│  │   worker)    │                │  - Course sidebar    │  │
│  └──────────────┘                └──────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Cấu trúc File

| File | Mô tả |
|------|-------|
| `manifest.json` | Cấu hình extension, permissions, scripts |
| `content.js` | Script inject vào trang Udemy, trích xuất dữ liệu |
| `popup.html` | Giao diện người dùng (UI) |
| `popup.js` | Logic xử lý cho popup |
| `background.js` | Service worker, xử lý events |
| `icons/` | Icons cho extension (16, 48, 128 px) |

---

## 4. Chi tiết Kỹ thuật

### 4.1 Content Script (`content.js`)

**Mục đích:** Chạy trực tiếp trên trang Udemy, tương tác với DOM.

**Class chính:** `TranscriptExtractor`

```javascript
class TranscriptExtractor {
  constructor() {
    this.transcriptSelector = '[class*="transcript--transcript-panel"]';
    this.toggleButtonSelector = '[data-purpose="transcript-toggle"]';
  }
}
```

**Các phương thức quan trọng:**

| Phương thức | Chức năng |
|-------------|-----------|
| `toggleTranscriptPanel()` | Click nút toggle để mở/đóng transcript |
| `checkForTranscript()` | Kiểm tra và trích xuất transcript |
| `extractTranscriptContent()` | Lấy textContent từ panel |

**Message Handlers:**

| Action | Mô tả |
|--------|-------|
| `getTranscript` | Trả về nội dung transcript |
| `getSections` | Trả về danh sách sections |
| `closeTranscriptPanel` | Đóng transcript panel |

### 4.2 Popup (`popup.js`)

**Mục đích:** Điều khiển giao diện và tương tác người dùng.

**Class chính:** `PopupController`

**Các method chính:**

| Method | Chức năng |
|--------|-----------|
| `switchTab()` | Chuyển đổi giữa tab Transcript/Sections |
| `checkTranscript()` | Gửi message lấy transcript |
| `getSections()` | Gửi message lấy sections |
| `generateMkdirCommand()` | Tạo lệnh mkdir từ sections |
| `copyTranscriptAndClose()` | Copy và đóng panel |

### 4.3 Xử lý Tên Thư mục

**Input:** `Section 3: A First Look at React`

**Output:** `03-a-first-look-at-react`

**Quy trình xử lý:**

```javascript
section
  .replace(/^Section\s+\d+:\s*/i, '')  // Bỏ prefix
  .replace(/^PART\s+\d+:\s*/i, '')     // Bỏ PART
  .toLowerCase()                        // Chữ thường
  .replace(/[^\w\s-]/g, '')            // Bỏ ký tự đặc biệt
  .replace(/\s+/g, '-')                // Space → dash
  .replace(/-+/g, '-')                 // Gộp dash
```

---

## 5. CSS Selectors

| Selector | Element |
|----------|---------|
| `[class*="transcript--transcript-panel"]` | Panel chứa transcript |
| `[data-purpose="transcript-toggle"]` | Nút toggle transcript |
| `span.ud-accordion-panel-title span.truncate-with-tooltip--ellipsis--YJw4N` | Tiêu đề section |

---

## 6. Message Flow

### Copy Transcript

```
popup.js                    content.js                DOM
   │                            │                      │
   │ ─── getTranscript ────────►│                      │
   │                            │ ── click toggle ────►│
   │                            │ ◄─ panel opens ──────│
   │                            │ ── get textContent ──►│
   │ ◄── {content, found} ──────│                      │
   │                            │                      │
   │ ─── closeTranscriptPanel ─►│                      │
   │                            │ ── click toggle ────►│
```

### Get Sections

```
popup.js                    content.js                 DOM
   │                            │                       │
   │ ─── getSections ──────────►│                       │
   │                            │ ── querySelectorAll ─►│
   │                            │ ◄─ NodeList ──────────│
   │ ◄── {sections, count} ─────│                       │
```

---

## 7. Permissions

| Permission | Lý do |
|------------|-------|
| `activeTab` | Truy cập tab hiện tại |
| `scripting` | Inject content script |
| `host_permissions` | Chỉ hoạt động trên Udemy |

---

## 8. Theme & UI

**Color Palette (Natural Theme):**

| Biến CSS | Giá trị | Mô tả |
|----------|---------|-------|
| `--primary` | `#2d5a47` | Forest green |
| `--bg-primary` | `#faf8f5` | Cream background |
| `--text-primary` | `#2c2a26` | Warm charcoal |
| `--success` | `#3d7a5a` | Sage green |

---

## 9. Lưu ý Khi Phát triển

1. **MutationObserver:** Theo dõi DOM changes để phát hiện transcript load
2. **Async/Await:** Sử dụng cho Chrome APIs
3. **Error Handling:** Bắt lỗi khi content script chưa sẵn sàng
4. **SessionStorage:** Lưu cache transcript trong tab

---

## 10. Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Cannot access tab" | Không phải trang Udemy | Mở trang Udemy |
| "No transcript found" | Panel chưa load | Click Refresh |
| Extension không hoạt động | Chưa reload extension | Reload trong chrome://extensions |

---

**Version:** 1.0.0  
**Manifest Version:** 3  
**Tác giả:** DalatCoder
