// Content script để kiểm tra và lấy transcript
class TranscriptExtractor {
  constructor() {
    this.transcriptSelector = '[class*="transcript--transcript-panel"]';
    this.toggleButtonSelector = '[data-purpose="transcript-toggle"]';
    this.observer = null;
    this.init();
  }

  init() {
    // Kiểm tra ngay khi script được load
    this.checkForTranscript();

    // Theo dõi thay đổi DOM để phát hiện transcript được load sau
    this.observeDOM();
  }

  // Click toggle button để mở transcript panel
  async toggleTranscriptPanel() {
    const toggleButton = document.querySelector(this.toggleButtonSelector);
    
    if (toggleButton) {
      console.log("🔘 Đang click nút toggle transcript...");
      toggleButton.click();
      
      // Đợi panel load
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } else {
      console.log("⚠️ Không tìm thấy nút toggle transcript");
      return false;
    }
  }

  async checkForTranscript() {
    let transcriptElement = document.querySelector(this.transcriptSelector);

    // Nếu không tìm thấy panel, thử click toggle button
    if (!transcriptElement) {
      console.log("⏳ Chưa tìm thấy transcript panel, đang thử mở...");
      const clicked = await this.toggleTranscriptPanel();
      
      if (clicked) {
        transcriptElement = document.querySelector(this.transcriptSelector);
      }
    }

    if (transcriptElement) {
      console.log("🎯 Transcript panel được tìm thấy!");
      this.extractTranscriptContent(transcriptElement);
      return true;
    } else {
      console.log("⏳ Chưa tìm thấy transcript panel...");
      return false;
    }
  }

  extractTranscriptContent(transcriptElement) {
    try {
      // Lấy tất cả text content bên trong transcript panel
      const textContent =
        transcriptElement.textContent || transcriptElement.innerText;

      if (textContent.trim()) {
        console.log("📄 Transcript content:", textContent);

        // Gửi message đến popup/background script
        this.sendTranscriptToExtension(textContent.trim());

        // Lưu vào session storage để popup có thể truy cập
        sessionStorage.setItem("udemy_transcript", textContent.trim());

        return textContent.trim();
      } else {
        console.log("⚠️ Transcript panel tồn tại nhưng không có nội dung");
        return null;
      }
    } catch (error) {
      console.error("❌ Lỗi khi extract transcript:", error);
      return null;
    }
  }

  sendTranscriptToExtension(content) {
    // Gửi message đến extension
    chrome.runtime
      .sendMessage({
        action: "transcriptFound",
        content: content,
        url: window.location.href,
      })
      .catch((error) => {
        console.log("Extension context không available:", error);
      });
  }

  observeDOM() {
    // Tạo MutationObserver để theo dõi thay đổi DOM
    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Kiểm tra xem có node mới được thêm có chứa transcript không
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches(this.transcriptSelector)) {
                shouldCheck = true;
                break;
              } else if (
                node.querySelector &&
                node.querySelector(this.transcriptSelector)
              ) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
      });

      if (shouldCheck) {
        setTimeout(() => this.checkForTranscript(), 1000);
      }
    });

    // Bắt đầu observe
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Method để gọi từ popup
  getCurrentTranscript() {
    return this.checkForTranscript();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Khởi tạo extractor
const transcriptExtractor = new TranscriptExtractor();

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    (async () => {
      let transcriptElement = document.querySelector(
        '[class*="transcript--transcript-panel"]'
      );

      // Nếu panel chưa mở, thử click toggle button
      if (!transcriptElement) {
        console.log("📌 Panel chưa mở, đang thử click toggle...");
        await transcriptExtractor.toggleTranscriptPanel();
        transcriptElement = document.querySelector(
          '[class*="transcript--transcript-panel"]'
        );
      }

      if (transcriptElement) {
        const content =
          transcriptExtractor.extractTranscriptContent(transcriptElement);
        sendResponse({
          success: true,
          content: content,
          found: !!content,
        });
      } else {
        sendResponse({
          success: false,
          content: null,
          found: false,
          message: "Không tìm thấy transcript panel",
        });
      }
    })();
  }

  // Handle getSections action
  if (request.action === "getSections") {
    const sectionSelector = 'span.ud-accordion-panel-title span.truncate-with-tooltip--ellipsis--YJw4N';
    const sections = document.querySelectorAll(sectionSelector);
    
    const sectionTitles = [];
    sections.forEach((section) => {
      const title = section.textContent.trim();
      if (title) {
        sectionTitles.push(title);
      }
    });

    console.log("📚 Found", sectionTitles.length, "sections");
    
    sendResponse({
      success: true,
      sections: sectionTitles,
      count: sectionTitles.length,
    });
  }

  // Handle closeTranscriptPanel action - close panel after copying
  if (request.action === "closeTranscriptPanel") {
    const toggleButton = document.querySelector('[data-purpose="transcript-toggle"]');
    const transcriptPanel = document.querySelector('[class*="transcript--transcript-panel"]');
    
    // Only close if panel is currently open
    if (toggleButton && transcriptPanel) {
      console.log("📕 Closing transcript panel...");
      toggleButton.click();
      sendResponse({ success: true, message: "Panel closed" });
    } else {
      sendResponse({ success: false, message: "Panel not open or button not found" });
    }
  }

  return true; // Giữ channel mở cho async response
});

// Cleanup khi page unload
window.addEventListener("beforeunload", () => {
  transcriptExtractor.destroy();
});
