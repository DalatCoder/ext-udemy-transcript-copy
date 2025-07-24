# Udemy Transcript Copy - Chrome Extension

Chrome extension để tự động phát hiện và copy transcript từ các video Udemy.

## ✨ Tính năng

- 🔍 **Tự động phát hiện**: Kiểm tra phần tử div có class bắt đầu bằng "transcript--transcript-panel"
- 📄 **Trích xuất nội dung**: Lấy toàn bộ textContent bên trong transcript panel
- 📋 **Copy dễ dàng**: Copy transcript vào clipboard chỉ với một click
- 🔄 **Theo dõi real-time**: Tự động cập nhật khi transcript được load
- 💾 **Lưu cache**: Lưu transcript vào session storage để truy cập nhanh

## 🚀 Cài đặt

1. **Clone hoặc download project này**
2. **Mở Chrome và vào** `chrome://extensions/`
3. **Bật Developer mode** ở góc trên bên phải
4. **Click "Load unpacked"** và chọn thư mục chứa extension
5. **Extension sẽ xuất hiện** trong danh sách và thanh công cụ

## 📖 Cách sử dụng

1. **Vào Udemy** và mở một video có transcript
2. **Click vào icon extension** trên thanh công cụ Chrome
3. **Extension sẽ tự động kiểm tra** và hiển thị transcript nếu có
4. **Click "Copy to Clipboard"** để copy transcript
5. **Dán vào ứng dụng khác** để sử dụng

## 🔧 Cấu trúc project

```
udemy-transcript-copy/
├── manifest.json          # Cấu hình extension
├── content.js            # Script chạy trên trang Udemy
├── popup.html           # Giao diện popup
├── popup.js            # Logic cho popup
├── background.js       # Background script
├── icons/             # Icons cho extension
└── README.md         # Tài liệu này
```

## 🛠️ Phát triển

### Content Script (`content.js`)

- Kiểm tra DOM để tìm transcript panel
- Sử dụng MutationObserver để theo dõi thay đổi
- Trích xuất và gửi nội dung transcript

### Popup (`popup.html` + `popup.js`)

- Giao diện người dùng
- Hiển thị trạng thái và nội dung transcript
- Chức năng copy to clipboard

### Background Script (`background.js`)

- Xử lý messages giữa các component
- Lưu trữ dữ liệu session

## 🎯 Selector được sử dụng

Extension tìm kiếm phần tử với selector:

```css
[class*="transcript--transcript-panel"]
```

Điều này có nghĩa là sẽ tìm tất cả phần tử có class chứa chuỗi "transcript--transcript-panel".

## 🔒 Quyền hạn

Extension yêu cầu các quyền sau:

- `activeTab`: Truy cập tab hiện tại
- `scripting`: Inject content script
- `https://*.udemy.com/*`: Hoạt động trên Udemy

## 🐛 Troubleshooting

### Extension không hoạt động?

1. Kiểm tra xem bạn có đang ở trang Udemy không
2. Refresh trang và thử lại
3. Kiểm tra Console để xem lỗi (F12 > Console)

### Không tìm thấy transcript?

1. Đảm bảo video có bật transcript/subtitles
2. Thử scroll xuống để transcript panel load
3. Click "Kiểm tra lại" trong popup

### Copy không hoạt động?

1. Đảm bảo browser có quyền clipboard
2. Thử click copy lại
3. Sử dụng Ctrl+C manual nếu cần

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

## 🤝 Đóng góp

Mọi góp ý và pull request đều được chào đón!

---

**Lưu ý**: Extension này chỉ hoạt động trên Udemy.com và chỉ trích xuất transcript đã có sẵn trên trang.
