// Background script để xử lý messages và events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transcriptFound") {
    console.log("📄 Transcript được tìm thấy từ content script:");
    console.log("URL:", request.url);
    console.log("Content length:", request.content?.length || 0);

    // Có thể lưu vào storage hoặc xử lý thêm ở đây
    chrome.storage.session.set({
      lastTranscript: {
        content: request.content,
        url: request.url,
        timestamp: Date.now(),
      },
    });
  }
});

// Xử lý khi extension được install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("🎉 Udemy Transcript Copy extension được cài đặt!");
  } else if (details.reason === "update") {
    console.log(
      "🔄 Extension được cập nhật lên version:",
      chrome.runtime.getManifest().version
    );
  }
});

// Xử lý action button click (optional - popup sẽ tự mở)
chrome.action.onClicked.addListener((tab) => {
  // Code này chỉ chạy nếu không có popup
  // Vì chúng ta có popup, code này sẽ không được gọi
  console.log("Action button clicked on tab:", tab.url);
});
