/* ============================================================
   common.js — Online CV 公共脚本
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // 根据当前页面 URL 设置导航栏 active 状态
  const links = document.querySelectorAll('.navbar-links a');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
