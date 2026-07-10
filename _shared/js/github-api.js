/**
 * GitHub API Client — 前端直连 GitHub REST API
 * Token 存储在 localStorage，不在代码中
 * 
 * 写入策略：Contents API (PUT /contents/:path) + 自动重试
 * 写失败时自动重新读取最新 SHA 再重试（最多 2 次）
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

    /* ---------- Helper ---------- */
    _baseUrl: function () {
      return 'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo;
    },
    _headers: function () {
      return {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      };
    },
    _encode: function (obj) {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))));
    },

    /* ---------- Read file ---------- */
    readFile: function (path) {
      return fetch(
        this._baseUrl() + '/contents/' + encodeURIComponent(path) + '?ref=' + CONFIG.branch,
        { headers: this._headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Read failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        var decoded = decodeURIComponent(escape(atob(data.content)));
        return { content: JSON.parse(decoded), sha: data.sha };
      });
    },

    /* ---------- Write file with retry ---------- */
    writeFile: function (path, contentObj, sha, message) {
      var self = this;
      var contentStr = this._encode(contentObj);

      function doWrite(currentSha, retriesLeft) {
        var body = {
          message: message || 'Update ' + path + ' via online CV',
          content: contentStr,
          branch: CONFIG.branch
        };
        if (currentSha) body.sha = currentSha;

        return fetch(
          self._baseUrl() + '/contents/' + encodeURIComponent(path),
          {
            method: 'PUT',
            headers: self._headers(),
            body: JSON.stringify(body)
          }
        ).then(function (res) {
          if (!res.ok) {
            // 409: SHA conflict — 重新读取最新 SHA 再重试
            if (res.status === 409 && retriesLeft > 0) {
              return self.readFile(path).then(function (fresh) {
                return doWrite(fresh.sha, retriesLeft - 1);
              });
            }
            return res.json().then(function (err) {
              throw new Error(err.message || 'Write failed: ' + res.status);
            });
          }
          return res.json();
        });
      }

      // 第一轮：用传入的 sha 尝试写入（如果为 null 会自动创建新文件）
      return doWrite(sha || null, 2);
    },

    /* ---------- Ensure file exists ---------- */
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