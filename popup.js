// Popup script để tương tác với user
class PopupController {
  constructor() {
    this.statusEl = document.getElementById("status");
    this.contentEl = document.getElementById("content");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.copyBtn = document.getElementById("copyBtn");

    this.currentTranscript = null;

    this.init();
  }

  init() {
    // Bind event listeners
    this.refreshBtn.addEventListener("click", () => this.refreshTranscript());
    this.copyBtn.addEventListener("click", () => this.copyToClipboard());

    // Auto check khi popup mở
    this.checkTranscript();
  }

  async checkTranscript() {
    try {
      this.setStatus("loading", "Đang kiểm tra transcript...");

      // Get active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (!activeTab) {
        this.setStatus("error", "Không thể truy cập tab hiện tại");
        return;
      }

      // Check if on Udemy
      if (!activeTab.url.includes("udemy.com")) {
        this.setStatus("error", "Extension chỉ hoạt động trên Udemy.com");
        return;
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: "getTranscript",
      });

      if (response && response.success && response.found) {
        this.currentTranscript = response.content;
        this.setStatus("success", "Đã tìm thấy transcript!");
        this.displayTranscript(response.content);
        this.copyBtn.disabled = false;
      } else {
        this.currentTranscript = null;
        this.setStatus(
          "error",
          response?.message || "Không tìm thấy transcript panel"
        );
        this.displayTranscript(null);
        this.copyBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error checking transcript:", error);

      // Fallback: check session storage
      const storedTranscript = sessionStorage?.getItem?.("udemy_transcript");
      if (storedTranscript) {
        this.currentTranscript = storedTranscript;
        this.setStatus("success", "Đã tìm thấy transcript (từ cache)!");
        this.displayTranscript(storedTranscript);
        this.copyBtn.disabled = false;
      } else {
        this.setStatus(
          "error",
          "Lỗi kết nối với content script. Hãy refresh trang và thử lại."
        );
        this.displayTranscript(null);
        this.copyBtn.disabled = true;
      }
    }
  }

  async refreshTranscript() {
    this.refreshBtn.disabled = true;
    this.refreshBtn.innerHTML =
      '<span class="loading-spinner"></span> Đang kiểm tra...';

    await this.checkTranscript();

    this.refreshBtn.disabled = false;
    this.refreshBtn.innerHTML = "🔄 Kiểm tra lại";
  }

  async copyToClipboard() {
    if (!this.currentTranscript) {
      this.setStatus("error", "Không có nội dung để copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(this.currentTranscript);

      // Show success feedback
      const originalText = this.copyBtn.innerHTML;
      this.copyBtn.innerHTML = "✅ Đã copy!";
      this.copyBtn.style.backgroundColor = "#28a745";

      setTimeout(() => {
        this.copyBtn.innerHTML = originalText;
        this.copyBtn.style.backgroundColor = "";
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      this.setStatus("error", "Không thể copy vào clipboard");
    }
  }

  setStatus(type, message) {
    this.statusEl.className = `status ${type}`;

    if (type === "loading") {
      this.statusEl.innerHTML =
        '<span class="loading-spinner"></span>' + message;
    } else {
      let icon = "";
      switch (type) {
        case "success":
          icon = "✅";
          break;
        case "error":
          icon = "❌";
          break;
        default:
          icon = "ℹ️";
          break;
      }
      this.statusEl.innerHTML = icon + " " + message;
    }
  }

  displayTranscript(content) {
    if (content && content.trim()) {
      this.contentEl.className = "content-area";

      // Format content for better display
      const formattedContent = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n\n");

      this.contentEl.textContent = formattedContent;
    } else {
      this.contentEl.className = "content-area empty";
      this.contentEl.textContent = "Chưa có nội dung transcript...";
    }
  }
}

// Khởi tạo popup controller khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
