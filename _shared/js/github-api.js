/**
 * GitHub API Client — 前端直连 GitHub REST API
 * Token 存储在 localStorage，不在代码中
 */
(function () {
  'use strict';

  var CONFIG = {
    owner: 'XinyueYang-68j',
    repo: 'Amazing_Amy-',
    branch: 'main'
  };

  var token = localStorage.getItem('amy_gh_token') || '';

  window.GitHubAPI = {
    /* ---------- Token Management ---------- */
    setToken: function (t) {
      token = t;
      localStorage.setItem('amy_gh_token', t);
    },
    getToken: function () {
      return token;
    },
    hasToken: function () {
      return !!token;
    },

    /* ---------- File Operations ---------- */
    /**
     * 读取仓库文件内容
     * @param {string} path — 文件路径，如 "data/radar-notes.json"
     * @returns {Promise<{content: any, sha: string}>}
     */
    readFile: function (path) {
      return fetch(
        'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo +
        '/contents/' + encodeURIComponent(path) + '?ref=' + CONFIG.branch,
        {
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      ).then(function (res) {
        if (!res.ok) throw new Error('Read failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        var decoded = decodeURIComponent(escape(atob(data.content)));
        return { content: JSON.parse(decoded), sha: data.sha };
      });
    },

    /**
     * 写入/更新仓库文件
     * @param {string} path — 文件路径
     * @param {any} content — 要写入的对象（会被 JSON.stringify）
     * @param {string} sha — 文件的当前 SHA（更新时必须）
     * @param {string} message — 提交消息
     */
    writeFile: function (path, content, sha, message, _retryCount) {
      var self = this;
      var retries = typeof _retryCount === 'number' ? _retryCount : 0;
      var body = {
        message: message || 'Update ' + path + ' via online CV',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        branch: CONFIG.branch
      };
      if (sha) body.sha = sha;

      return fetch(
        'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo +
        '/contents/' + encodeURIComponent(path),
        {
          method: 'PUT',
          headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(body)
        }
      ).then(function (res) {
        if (!res.ok) {
          // SHA mismatch — auto retry with fresh SHA (max 2 retries)
          if (res.status === 409 && retries < 2) {
            return self.readFile(path).then(function (fresh) {
              return self.writeFile(path, content, fresh.sha, message, retries + 1);
            });
          }
          return res.json().then(function (err) {
            throw new Error('Write failed: ' + (err.message || res.status));
          });
        }
        return res.json();
      });
    },

    /**
     * 确保文件存在（不存在则创建空文件）
     */
    ensureFile: function (path, defaultContent, message) {
      var self = this;
      return this.readFile(path).catch(function () {
        return self.writeFile(path, defaultContent, null, message).then(function () {
          return self.readFile(path);
        });
      });
    }
  };

})();
