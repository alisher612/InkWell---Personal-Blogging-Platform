
import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { createRoot } from "react-dom/client";

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      className="inkwell-global-alert__close"
      aria-label="Dismiss notification"
      onClick={onClose}
    >
      <FiX size={18} />
    </button>
  );
}

export default function GlobalAlertEnhancer() {
  useEffect(() => {
    const timers = new WeakMap();
    const roots = new WeakMap();
    const closeContainers = new WeakMap();

    let layoutFrame = null;

    function getNotifications() {
      return Array.from(
        document.querySelectorAll(
          ".inkwell-global-alert:not(.inkwell-global-alert--dismissed), " +
            ".engagement-flash"
        )
      ).filter((element) => element.isConnected);
    }

    function layoutNotifications() {
      layoutFrame = null;

      let top = 20;
      const gap = 12;

      getNotifications().forEach((notification) => {
        notification.classList.add("inkwell-toast-positioned");

        notification.style.setProperty(
          "--inkwell-toast-top",
          `${top}px`
        );

        const height = notification.getBoundingClientRect().height;
        top += height + gap;
      });
    }

    function scheduleLayout() {
      if (layoutFrame !== null) {
        cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = requestAnimationFrame(layoutNotifications);
    }

    function dismissAlert(alert) {
      const timer = timers.get(alert);

      if (timer) {
        window.clearTimeout(timer);
        timers.delete(alert);
      }

      alert.classList.add("inkwell-global-alert--dismissed");
      scheduleLayout();

      window.setTimeout(() => {
        const root = roots.get(alert);
        const closeContainer = closeContainers.get(alert);

        if (root) {
          root.unmount();
          roots.delete(alert);
        }

        if (closeContainer) {
          closeContainer.remove();
          closeContainers.delete(alert);
        }
      }, 200);
    }

    function enhanceAlert(alert) {
      if (
        alert.dataset.inkwellEnhanced === "true" ||
        alert.dataset.persistent === "true"
      ) {
        return;
      }

      alert.dataset.inkwellEnhanced = "true";
      alert.classList.add("inkwell-global-alert");

      const closeContainer = document.createElement("span");
      closeContainer.className =
        "inkwell-global-alert__close-container";

      alert.appendChild(closeContainer);

      const root = createRoot(closeContainer);

      roots.set(alert, root);
      closeContainers.set(alert, closeContainer);

      root.render(
        <CloseButton onClose={() => dismissAlert(alert)} />
      );

      const timer = window.setTimeout(() => {
        dismissAlert(alert);
      }, 10000);

      timers.set(alert, timer);
    }

    function scanNode(node) {
      if (!(node instanceof Element)) return;

      if (node.matches(".alert")) {
        enhanceAlert(node);
      }

      node.querySelectorAll(".alert").forEach(enhanceAlert);
    }

    document.querySelectorAll(".alert").forEach(enhanceAlert);

    // Position standard alerts and custom engagement notifications.
    scheduleLayout();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(scanNode);
      });

      scheduleLayout();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", scheduleLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleLayout);

      if (layoutFrame !== null) {
        cancelAnimationFrame(layoutFrame);
      }

      document
        .querySelectorAll(
          ".alert[data-inkwell-enhanced='true']"
        )
        .forEach((alert) => {
          const timer = timers.get(alert);

          if (timer) {
            window.clearTimeout(timer);
          }

          const root = roots.get(alert);

          if (root) {
            root.unmount();
          }
        });
    };
  }, []);

  return null;
}
