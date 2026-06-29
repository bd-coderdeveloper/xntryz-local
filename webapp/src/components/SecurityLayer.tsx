"use client";

import { useEffect } from "react";

export default function SecurityLayer() {
  useEffect(() => {
    // Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.code === "KeyI")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j" || e.code === "KeyJ")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c" || e.code === "KeyC")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u" || e.code === "KeyU"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // DevTools Debugger Trap (Causes a pause if DevTools is open)
    const devToolsTrap = setInterval(() => {
      (function () {
        return false;
      }["constructor"]("debugger")());
    }, 100);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsTrap);
    };
  }, []);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      /* ป้องกันการคลุมดำ/ลากข้อความ บนเว็บไซต์ */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      
      /* ยกเว้นให้กล่องข้อความสามารถพิมพ์ได้ */
      input, textarea {
        user-select: text !important;
        -webkit-user-select: text !important;
      }
    `}} />
  );
}