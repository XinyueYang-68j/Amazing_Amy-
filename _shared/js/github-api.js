/**
 * GitHub API Client — 前端直连 GitHub REST API
 * Token 存储在 localStorage，不在代码中
 * 
 * 写入策略：Git Data API (blob → tree → commit → update ref)
 * 不需要文件 SHA，避免 409/422 冲突
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

    /* ---------- Read file via Contents API ---------- */
    readFile: function (path) {
      // 正确编码路径：将路径按 / 分段，分别编码每个段
      var encodedPath = path.split('/').map(function (seg) { return encodeURIComponent(seg); }).join('/');
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

    /* ---------- Write file via Git Data API ---------- */
    writeFile: function (path, contentObj, _shaIgnored, message) {
      var self = this;
      var contentStr = this._encode(contentObj);
      var baseUrl = this._baseUrl();
      var headers = this._headers();
      var msg = message || 'Update ' + path + ' via online CV';

      // Step 1: Create blob
      return fetch(baseUrl + '/git/blobs', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ content: contentStr, encoding: 'base64' })
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (e) { throw new Error('Blob create failed: ' + (e.message || res.status)); });
        return res.json();
      }).then(function (blob) {
        // Step 2: Get latest commit ref
        return fetch(baseUrl + '/git/refs/heads/' + CONFIG.branch, {
          headers: headers
        }).then(function (res) {
          if (!res.ok) throw new Error('Get ref failed: ' + res.status);
          return res.json();
        }).then(function (ref) {
          return { blobSha: blob.sha, headSha: ref.object.sha };
        });
      }).then(function (state) {
        // Step 3: Get the commit object to get tree SHA
        return fetch(baseUrl + '/git/commits/' + state.headSha, {
          headers: headers
        }).then(function (res) {
          if (!res.ok) throw new Error('Get commit failed: ' + res.status);
          return res.json();
        }).then(function (commit) {
          state.treeSha = commit.tree.sha;
          return state;
        });
      }).then(function (state) {
        // Step 4: Create new tree with the updated file
        return fetch(baseUrl + '/git/trees', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            base_tree: state.treeSha,
            tree: [{
              path: path,
              mode: '100644',
              type: 'blob',
              sha: state.blobSha
            }]
          })
        }).then(function (res) {
          if (!res.ok) return res.json().then(function (e) { throw new Error('Tree create failed: ' + (e.message || res.status)); });
          return res.json();
        }).then(function (tree) {
          state.newTreeSha = tree.sha;
          return state;
        });
      }).then(function (state) {
        // Step 5: Create commit
        return fetch(baseUrl + '/git/commits', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            message: msg,
            tree: state.newTreeSha,
            parents: [state.headSha]
          })
        }).then(function (res) {
          if (!res.ok) return res.json().then(function (e) { throw new Error('Commit create failed: ' + (e.message || res.status)); });
          return res.json();
        }).then(function (commit) {
          state.commitSha = commit.sha;
          return state;
        });
      }).then(function (state) {
        // Step 6: Update branch reference
        return fetch(baseUrl + '/git/refs/heads/' + CONFIG.branch, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ sha: state.commitSha, force: false })
        }).then(function (res) {
          if (!res.ok) return res.json().then(function (e) { throw new Error('Ref update failed: ' + (e.message || res.status)); });
          return res.json();
        });
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