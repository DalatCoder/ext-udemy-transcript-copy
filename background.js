// Background script để xử lý messages và events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transcriptFound") {
    console.log("📄 Transcript được tìm thấy từ content script:");
    console.log("URL:", request.url);
    console.log("Content length:", request.content?.length || 0);

    // Log success - không cần lưu storage vì đã dùng sessionStorage trong content script
  }

  // Trả về true để giữ channel mở nếu cần async response
  return true;
});

// Xử lý khi extension được install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("🎉 Udemy Tools extension được cài đặt!");
  } else if (details.reason === "update") {
    console.log(
      "🔄 Extension được cập nhật lên version:",
      chrome.runtime.getManifest().version
    );
  }
});
