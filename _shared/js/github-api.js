/**
 * GitHub API Client — 前端直连 GitHub REST API
 * Token 存储在 localStorage，不在代码中
 * 
 * 写入策略：Contents API (PUT /contents/:path)
 * 未提供 SHA 时自动读取最新 SHA 再写入
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

    /* ---------- Helpers ---------- */
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
    _encodePath: function (path) {
      // 按 / 分段编码，保留 / 作为路径分隔符
      return path.split('/').map(function (seg) { return encodeURIComponent(seg); }).join('/');
    },

    /* ---------- Read file ---------- */
    readFile: function (path) {
      var encodedPath = this._encodePath(path);
      return fetch(
        this._baseUrl() + '/contents/' + encodedPath + '?ref=' + CONFIG.branch,
        { headers: this._headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Read failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        var decoded = decodeURIComponent(escape(atob(data.content)));
        return { content: JSON.parse(decoded), sha: data.sha };
      });
    },

    /* ---------- Write file ---------- */
    writeFile: function (path, contentObj, sha, message) {
      var self = this;
      var contentStr = this._encode(contentObj);
      var encodedPath = this._encodePath(path);

      function doWrite(currentSha) {
        var body = {
          message: message || 'Update ' + path + ' via online CV',
          content: contentStr,
          branch: CONFIG.branch
        };
        if (currentSha) body.sha = currentSha;

        return fetch(
          self._baseUrl() + '/contents/' + encodedPath,
          {
            method: 'PUT',
            headers: self._headers(),
            body: JSON.stringify(body)
          }
        ).then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) {
              throw new Error(err.message || 'Write failed: ' + res.status);
            });
          }
          return res.json();
        });
      }

      // 如果提供了 SHA 直接写入
      if (sha) return doWrite(sha);

      // 未提供 SHA：先读取获取最新 SHA，再写入
      return self.readFile(path).then(function (fresh) {
        return doWrite(fresh.sha);
      }).catch(function (err) {
        // 文件不存在（404）则创建新文件
        if (err.message && err.message.indexOf('404') !== -1) {
          return doWrite(null);
        }
        throw err;
      });
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