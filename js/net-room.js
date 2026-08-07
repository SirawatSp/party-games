// ชั้นเชื่อมต่อสำหรับโหมดเล่นพร้อมกันหลายเครื่อง
//
// ออกแบบเป็น 2 ชั้นแยกกันชัดเจน เพราะเว็บนี้เป็นเว็บ static ไม่มีเซิร์ฟเวอร์ของตัวเอง
//   1) Transport  — ตัวรับส่งข้อมูลจริง ๆ (PeerJS/WebRTC ผ่าน public broker)
//   2) Room       — ตรรกะห้อง: ใครเป็นโฮสต์ ใครอยู่ในห้อง ส่งข้อความหากันยังไง
// การแยกแบบนี้ทำให้สลับ transport เป็นตัวปลอม (loopback) เพื่อทดสอบตรรกะทั้งหมด
// ได้โดยไม่ต้องต่อเน็ตจริง — ดู PGLoopbackTransport ด้านล่าง
//
// รูปแบบห้อง: โฮสต์เป็นเจ้าของสถานะเกมแต่เพียงผู้เดียว (host-authoritative)
// ผู้เล่นคนอื่นส่ง "คำขอ" ไปหาโฮสต์ แล้วโฮสต์กระจาย "สถานะล่าสุด" กลับมาให้ทุกคน
// วิธีนี้กันสถานะขัดแย้งกันเองได้หมด และตรงกับที่เกมนี้เป็นเกมผลัดตาอยู่แล้ว

(function (global) {
  "use strict";

  var PEERJS_SRC = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
  var ROOM_PREFIX = "pgparty-";           // กัน id ชนกับคนอื่นที่ใช้ broker สาธารณะเดียวกัน
  var CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // ตัด I,L,O,0,1 ออกกันอ่านผิด
  var CODE_LEN = 5;

  function randomCode() {
    var out = "";
    var buf = new Uint32Array(CODE_LEN);
    if (global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues(buf);
      for (var i = 0; i < CODE_LEN; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
    } else {
      for (var j = 0; j < CODE_LEN; j++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return out;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (global.Peer) return resolve();
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("โหลดไลบรารีเชื่อมต่อไม่สำเร็จ")); };
      document.head.appendChild(s);
    });
  }

  // ---------------------------------------------------------------- transports

  // Transport จริง: WebRTC ผ่าน PeerJS public broker (ไม่ต้องสมัครอะไร ไม่มีคีย์ลับ)
  function PeerTransport() {
    this.id = "host";
    this.peer = null;
    this.conns = {};      // สำหรับโฮสต์: id ผู้เล่น -> DataConnection
    this.hostConn = null; // สำหรับผู้ร่วมเล่น: ท่อไปหาโฮสต์
    this.isHost = false;
  }

  PeerTransport.prototype.host = function (code, handlers) {
    var self = this;
    return loadScript(PEERJS_SRC).then(function () {
      return new Promise(function (resolve, reject) {
        self.isHost = true;
        self.peer = new global.Peer(ROOM_PREFIX + code, { debug: 0 });
        var settled = false;
        var giveUp = setTimeout(function () {
          if (!settled) { settled = true; reject(new Error("เชื่อมต่อเซิร์ฟเวอร์ห้องไม่ได้")); }
        }, 15000);

        self.peer.on("open", function () {
          if (settled) return;
          settled = true;
          clearTimeout(giveUp);
          resolve();
        });
        self.peer.on("error", function (err) {
          if (!settled) { settled = true; clearTimeout(giveUp); reject(err); return; }
          handlers.onError && handlers.onError(err);
        });
        self.peer.on("connection", function (conn) {
          conn.on("open", function () {
            self.conns[conn.peer] = conn;
            handlers.onPeerJoin && handlers.onPeerJoin(conn.peer);
          });
          conn.on("data", function (msg) { handlers.onMessage && handlers.onMessage(conn.peer, msg); });
          conn.on("close", function () {
            delete self.conns[conn.peer];
            handlers.onPeerLeave && handlers.onPeerLeave(conn.peer);
          });
        });
      });
    });
  };

  PeerTransport.prototype.join = function (code, handlers) {
    var self = this;
    return loadScript(PEERJS_SRC).then(function () {
      return new Promise(function (resolve, reject) {
        self.isHost = false;
        self.peer = new global.Peer({ debug: 0 });
        var settled = false;
        var giveUp = setTimeout(function () {
          if (!settled) { settled = true; reject(new Error("หาห้องไม่เจอ ลองเช็ครหัสห้องอีกที")); }
        }, 15000);

        self.peer.on("open", function () {
          self.id = self.peer.id;
          var conn = self.peer.connect(ROOM_PREFIX + code, { reliable: true });
          self.hostConn = conn;
          conn.on("open", function () {
            if (settled) return;
            settled = true;
            clearTimeout(giveUp);
            resolve();
          });
          conn.on("data", function (msg) { handlers.onMessage && handlers.onMessage("host", msg); });
          conn.on("close", function () { handlers.onHostLeave && handlers.onHostLeave(); });
        });
        self.peer.on("error", function (err) {
          if (!settled) { settled = true; clearTimeout(giveUp); reject(err); return; }
          handlers.onError && handlers.onError(err);
        });
      });
    });
  };

  PeerTransport.prototype.send = function (to, msg) {
    if (this.isHost) {
      if (to === "*") {
        var self = this;
        Object.keys(this.conns).forEach(function (id) { self.conns[id].send(msg); });
      } else if (this.conns[to]) {
        this.conns[to].send(msg);
      }
    } else if (this.hostConn) {
      this.hostConn.send(msg);
    }
  };

  PeerTransport.prototype.close = function () {
    try { this.peer && this.peer.destroy(); } catch (e) { /* ปิดไปแล้วก็ไม่เป็นไร */ }
    this.peer = null;
    this.conns = {};
    this.hostConn = null;
  };

  // Transport ปลอมสำหรับทดสอบ: ต่อกันเองในหน้าเดียว ไม่แตะเน็ตเวิร์กเลย
  // ใช้พิสูจน์ว่าตรรกะห้องกับตรรกะเกมถูกต้อง โดยไม่ต้องพึ่ง broker ภายนอก
  var loopbackRooms = {};

  function LoopbackTransport() {
    this.code = null;
    this.id = null;
    this.isHost = false;
    this.handlers = null;
  }

  LoopbackTransport.prototype.host = function (code, handlers) {
    var self = this;
    self.code = code;
    self.isHost = true;
    self.id = "host";
    self.handlers = handlers;
    loopbackRooms[code] = { host: self, guests: {} };
    return Promise.resolve();
  };

  LoopbackTransport.prototype.join = function (code, handlers) {
    var self = this;
    var room = loopbackRooms[code];
    if (!room) return Promise.reject(new Error("หาห้องไม่เจอ ลองเช็ครหัสห้องอีกที"));
    self.code = code;
    self.isHost = false;
    self.id = "g" + (Object.keys(room.guests).length + 1) + "-" + Math.random().toString(36).slice(2, 6);
    self.handlers = handlers;
    room.guests[self.id] = self;
    setTimeout(function () {
      room.host.handlers.onPeerJoin && room.host.handlers.onPeerJoin(self.id);
    }, 0);
    return Promise.resolve();
  };

  LoopbackTransport.prototype.send = function (to, msg) {
    var room = loopbackRooms[this.code];
    if (!room) return;
    var copy = JSON.parse(JSON.stringify(msg)); // เลียนแบบการส่งข้ามเครื่องจริง ๆ ที่ต้อง serialize
    var self = this;
    if (this.isHost) {
      if (to === "*") {
        Object.keys(room.guests).forEach(function (id) {
          setTimeout(function () { room.guests[id].handlers.onMessage("host", JSON.parse(JSON.stringify(msg))); }, 0);
        });
      } else if (room.guests[to]) {
        setTimeout(function () { room.guests[to].handlers.onMessage("host", copy); }, 0);
      }
    } else {
      setTimeout(function () { room.host.handlers.onMessage(self.id, copy); }, 0);
    }
  };

  LoopbackTransport.prototype.close = function () {
    var room = loopbackRooms[this.code];
    if (!room) return;
    if (this.isHost) delete loopbackRooms[this.code];
    else delete room.guests[this.id];
  };

  // Transport ผ่าน BroadcastChannel: ต่อกันข้ามแท็บ/หน้าต่างในเบราว์เซอร์เดียวกัน
  // ใช้สำหรับทดสอบการเล่นหลายเครื่องแบบครบวงจรโดยไม่ต้องพึ่ง broker ภายนอก
  function ChannelTransport() {
    this.ch = null;
    this.code = null;
    this.id = null;
    this.isHost = false;
    this.handlers = null;
    this.known = {};
  }

  ChannelTransport.prototype._open = function (code) {
    this.code = code;
    this.ch = new BroadcastChannel("pg-room-" + code);
  };

  ChannelTransport.prototype.host = function (code, handlers) {
    var self = this;
    self.isHost = true;
    self.id = "host";
    self.handlers = handlers;
    self._open(code);
    self.ch.onmessage = function (ev) {
      var m = ev.data;
      if (!m) return;
      if (m.kind === "_join") {
        if (!self.known[m.from]) {
          self.known[m.from] = true;
          self.ch.postMessage({ kind: "_ack", to: m.from });
          handlers.onPeerJoin && handlers.onPeerJoin(m.from);
        }
        return;
      }
      if (m.kind === "_bye") {
        delete self.known[m.from];
        handlers.onPeerLeave && handlers.onPeerLeave(m.from);
        return;
      }
      if (m.kind === "msg" && m.to === "host") handlers.onMessage && handlers.onMessage(m.from, m.msg);
    };
    return Promise.resolve();
  };

  ChannelTransport.prototype.join = function (code, handlers) {
    var self = this;
    self.isHost = false;
    self.id = "g-" + Math.random().toString(36).slice(2, 9);
    self.handlers = handlers;
    self._open(code);
    return new Promise(function (resolve, reject) {
      var settled = false;
      var giveUp = setTimeout(function () {
        if (!settled) { settled = true; reject(new Error("หาห้องไม่เจอ ลองเช็ครหัสห้องอีกที")); }
      }, 5000);
      self.ch.onmessage = function (ev) {
        var m = ev.data;
        if (!m) return;
        if (m.kind === "_ack" && m.to === self.id) {
          if (!settled) { settled = true; clearTimeout(giveUp); resolve(); }
          return;
        }
        if (m.kind === "_close") { handlers.onHostLeave && handlers.onHostLeave(); return; }
        if (m.kind === "msg" && (m.to === self.id || m.to === "*")) {
          handlers.onMessage && handlers.onMessage("host", m.msg);
        }
      };
      var tries = 0;
      (function ping() {
        if (settled) return;
        self.ch.postMessage({ kind: "_join", from: self.id });
        if (++tries < 25) setTimeout(ping, 180);
      })();
    });
  };

  ChannelTransport.prototype.send = function (to, msg) {
    if (!this.ch) return;
    this.ch.postMessage({ kind: "msg", to: this.isHost ? to : "host", from: this.id, msg: msg });
  };

  ChannelTransport.prototype.close = function () {
    if (!this.ch) return;
    if (this.isHost) this.ch.postMessage({ kind: "_close" });
    else this.ch.postMessage({ kind: "_bye", from: this.id });
    this.ch.close();
    this.ch = null;
  };

  // ---------------------------------------------------------------- room

  // Room ห่อ transport อีกชั้น ให้เกมเรียกใช้ง่าย ๆ โดยไม่ต้องรู้ว่าข้างล่างเป็นอะไร
  //   room.on("ชื่อข้อความ", fn)  — รับข้อความ
  //   room.send(type, payload)    — ผู้ร่วมเล่นส่งหาโฮสต์
  //   room.broadcast(type, data)  — โฮสต์กระจายให้ทุกคน
  //   room.to(id, type, data)     — โฮสต์ส่งเฉพาะคน (ใช้ส่งบทบาทลับ)
  function Room(transport) {
    this.t = transport || new PeerTransport();
    this.isHost = false;
    this.code = null;
    this.listeners = {};
    this.peers = [];      // เฉพาะฝั่งโฮสต์: รายชื่อ id ที่ต่ออยู่
  }

  Room.prototype._handlers = function () {
    var self = this;
    return {
      onMessage: function (from, msg) {
        if (!msg || !msg.type) return;
        var list = self.listeners[msg.type] || [];
        list.forEach(function (fn) { fn(msg.data, from); });
      },
      onPeerJoin: function (id) {
        if (self.peers.indexOf(id) < 0) self.peers.push(id);
        self._emitLocal("peer:join", id);
      },
      onPeerLeave: function (id) {
        self.peers = self.peers.filter(function (p) { return p !== id; });
        self._emitLocal("peer:leave", id);
      },
      onHostLeave: function () { self._emitLocal("host:leave", null); },
      onError: function (err) { self._emitLocal("net:error", err); },
    };
  };

  Room.prototype._emitLocal = function (type, data) {
    (this.listeners[type] || []).forEach(function (fn) { fn(data, null); });
  };

  Room.prototype.host = function () {
    var self = this;
    self.isHost = true;
    self.code = randomCode();
    return self.t.host(self.code, self._handlers()).then(function () { return self.code; });
  };

  Room.prototype.join = function (code) {
    var self = this;
    self.isHost = false;
    self.code = String(code || "").trim().toUpperCase();
    return self.t.join(self.code, self._handlers());
  };

  Room.prototype.on = function (type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
    return this;
  };

  Room.prototype.send = function (type, data) { this.t.send("host", { type: type, data: data }); };
  Room.prototype.broadcast = function (type, data) { this.t.send("*", { type: type, data: data }); };
  Room.prototype.to = function (id, type, data) { this.t.send(id, { type: type, data: data }); };
  Room.prototype.close = function () { this.t.close(); };

  global.PGRoom = Room;
  global.PGPeerTransport = PeerTransport;
  global.PGLoopbackTransport = LoopbackTransport;
  global.PGChannelTransport = ChannelTransport;
  global.PGRoomCode = randomCode;
})(window);
