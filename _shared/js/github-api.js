/**
 * GitHub API Client — 前端直连 GitHub REST API
 * Token 存储在 localStorage，不在代码中
 * 
 * 写入策略：使用 Git Data API (blob + tree + commit)，不依赖已有文件 SHA
 * 永远不会发生 SHA 冲突，彻底解决 409
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
    baseUrl: function () {
      return 'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo;
    },
    headers: function () {
      return {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      };
    },

    /* ---------- Get current commit SHA for branch ---------- */
    getHead: function () {
      return fetch(
        this.baseUrl() + '/git/refs/heads/' + CONFIG.branch,
        { headers: this.headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Get head failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.object.sha;
      });
    },

    /* ---------- Get commit tree SHA ---------- */
    getTree: function (commitSha) {
      return fetch(
        this.baseUrl() + '/git/commits/' + commitSha,
        { headers: this.headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Get commit failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.tree.sha;
      });
    },

    /* ---------- Find entry in tree by path ---------- */
    getTreeEntry: function (treeSha, path) {
      return fetch(
        this.baseUrl() + '/git/trees/' + treeSha + '?recursive=1',
        { headers: this.headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Get tree failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        var entry = (data.tree || []).find(function (e) {
          return e.path === path;
        });
        return entry ? entry.sha : null;
      });
    },

    /* ---------- Create blob ---------- */
    createBlob: function (content) {
      var body = {
        content: btoa(unescape(encodeURIComponent(content))),
        encoding: 'base64'
      };
      return fetch(
        this.baseUrl() + '/git/blobs',
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(body)
        }
      ).then(function (res) {
        if (!res.ok) throw new Error('Create blob failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.sha;
      });
    },

    /* ---------- Create tree ---------- */
    createTree: function (baseTreeSha, path, blobSha) {
      var tree = [
        {
          path: path,
          mode: '100644',
          sha: blobSha
        }
      ];
      return fetch(
        this.baseUrl() + '/git/trees',
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: tree
          })
        }
      ).then(function (res) {
        if (!res.ok) throw new Error('Create tree failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.sha;
      });
    },

    /* ---------- Create commit ---------- */
    createCommit: function (treeSha, parentSha, message) {
      var body = {
        message: message || 'Update via online CV',
        tree: treeSha,
        parents: [parentSha]
      };
      return fetch(
        this.baseUrl() + '/git/commits',
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(body)
        }
      ).then(function (res) {
        if (!res.ok) throw new Error('Create commit failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.sha;
      });
    },

    /* ---------- Update branch ref ---------- */
    updateRef: function (newCommitSha) {
      var body = {
        sha: newCommitSha
      };
      return fetch(
        this.baseUrl() + '/git/refs/heads/' + CONFIG.branch,
        {
          method: 'PATCH',
          headers: this.headers(),
          body: JSON.stringify(body)
        }
      ).then(function (res) {
        if (!res.ok) throw new Error('Update ref failed: ' + res.status);
        return res.json();
      });
    },

    /* ---------- Full workflow: write a file ---------- */
    writeFile: function (path, contentObj, unusedSha, message) {
      var self = this;
      return new Promise(function (resolve, reject) {
        // 序列化内容
        var contentStr = JSON.stringify(contentObj, null, 2);
        // 完整流程：get head → get tree → create blob → create tree → create commit → update ref
        self.getHead()
          .then(function (headSha) {
            return Promise.all([
              Promise.resolve(headSha),
              self.getTree(headSha)
            ]);
          })
          .then(function ([headSha, treeSha]) {
            return Promise.all([
              Promise.resolve(treeSha),
              self.createBlob(contentStr)
            ]);
          })
          .then(function ([treeSha, blobSha]) {
            return self.createTree(treeSha, path, blobSha);
          })
          .then(function (newTreeSha) {
            return self.createCommit(newTreeSha, headSha, message || ('Update ' + path));
          })
          .then(function (newCommitSha) {
            return self.updateRef(newCommitSha);
          })
          .then(function (res) {
            resolve(res);
          })
          .catch(function (err) {
            reject(err);
          });
      });
    },

    /* ---------- Read file content (legacy compat) ---------- */
    readFile: function (path) {
      return fetch(
        this.baseUrl() + '/contents/' + encodeURIComponent(path) + '?ref=' + CONFIG.branch,
        { headers: this.headers() }
      ).then(function (res) {
        if (!res.ok) throw new Error('Read failed: ' + res.status);
        return res.json();
      }).then(function (data) {
        var decoded = decodeURIComponent(escape(atob(data.content)));
        return { content: JSON.parse(decoded), sha: data.sha };
      });
    },

    /* ---------- Ensure file exists (create if not exists) ---------- */
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
