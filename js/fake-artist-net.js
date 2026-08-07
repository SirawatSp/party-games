// ตรรกะเกม "ศิลปินตัวปลอม" ฝั่งโฮสต์ สำหรับโหมดเล่นพร้อมกันหลายเครื่อง
//
// ไฟล์นี้ตั้งใจไม่แตะ DOM เลยแม้แต่บรรทัดเดียว รับเข้ามาแค่ห้อง (PGRoom) กับคลังคำ
// เพื่อให้เอาไปทดสอบด้วย transport ปลอมได้ครบทุกเส้นทางโดยไม่ต้องมีหน้าจอ
//
// โฮสต์เป็นเจ้าของสถานะทั้งหมด ผู้เล่นเครื่องอื่นส่งได้แค่ "คำขอ" 4 อย่าง
//   join {name} · stroke {pts} · vote {targetId} · guess {word}
// แล้วโฮสต์ตรวจสิทธิ์ก่อนเสมอว่าคำขอนั้นมาจากคนที่มีสิทธิ์ทำตอนนี้จริงไหม

(function (global) {
  "use strict";

  var COLORS = [
    "#e11d48", "#2563eb", "#15803d", "#f59e0b", "#9333ea",
    "#0891b2", "#db2777", "#4d7c0f", "#ea580c", "#4f46e5",
  ];
  var MIN_PLAYERS = 4;
  var MAX_PLAYERS = 10;
  var PASSES = 2;
  var GUESS_OPTIONS = 4;

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // topics: [{ cat, words: [...] }]
  function HostGame(room, topics, opts) {
    opts = opts || {};
    this.room = room;
    this.topics = topics;
    this.goal = opts.goal || 5;
    this.hostName = opts.hostName || "โฮสต์";
    this.onState = opts.onState || function () {};
    this.onPrivate = opts.onPrivate || function () {};

    this.players = [];     // [{ id, name, color, score }] — id "host" คือเครื่องโฮสต์เอง
    this.phase = "lobby";
    this.roundNo = 0;
    this.topic = null;
    this.fakeId = null;
    this.order = [];
    this.turnPos = 0;
    this.strokes = [];
    this.votes = {};       // voterId -> targetId
    this.accusedId = null;
    this.guessOptions = [];
    this.fakeGuess = null;
    this.result = null;
    this.gallery = [];

    this._wire();
    this._addPlayer("host", this.hostName);
  }

  HostGame.prototype._wire = function () {
    var self = this;
    this.room.on("peer:join", function (id) { self._touch(id); });
    this.room.on("peer:leave", function (id) { self._removePlayer(id); });
    this.room.on("join", function (data, from) { self._addPlayer(from, (data && data.name) || "ผู้เล่น"); });
    this.room.on("stroke", function (data, from) { self.submitStroke(from, data && data.pts); });
    this.room.on("vote", function (data, from) { self.submitVote(from, data && data.targetId); });
    this.room.on("guess", function (data, from) { self.submitGuess(from, data && data.word); });
  };

  // ผู้เล่นเพิ่งต่อเข้ามาแต่ยังไม่ส่งชื่อ — ยังไม่นับเป็นผู้เล่นจนกว่าจะ join
  HostGame.prototype._touch = function () { this.publish(); };

  HostGame.prototype._addPlayer = function (id, name) {
    if (this.phase !== "lobby") return;                       // เกมเริ่มแล้วห้ามแทรก
    if (this.players.length >= MAX_PLAYERS) return;
    var existing = this.players.filter(function (p) { return p.id === id; })[0];
    var clean = String(name || "").trim().slice(0, 12) || "ผู้เล่น";
    // ชื่อซ้ำให้เติมเลขต่อท้าย จะได้ชี้ตัวกันไม่งง
    var taken = this.players.filter(function (p) { return p.id !== id && p.name === clean; }).length;
    if (taken) clean = clean + " " + (taken + 1);
    if (existing) {
      existing.name = clean;
    } else {
      this.players.push({ id: id, name: clean, color: COLORS[this.players.length % COLORS.length], score: 0 });
    }
    this.publish();
  };

  HostGame.prototype._removePlayer = function (id) {
    var was = this.players.length;
    this.players = this.players.filter(function (p) { return p.id !== id; });
    if (this.players.length === was) return;
    // ถ้าคนที่หลุดคือตัวปลอมหรือคนที่ยังไม่ได้วาด เกมรอบนี้ไปต่อไม่ได้ ให้ล้มรอบกลับไปล็อบบี้
    if (this.phase !== "lobby" && this.phase !== "final") {
      if (id === this.fakeId || this.players.length < MIN_PLAYERS) {
        this.phase = "lobby";
        this.strokes = [];
        this.topic = null;
        this.fakeId = null;
      } else {
        this.order = this.order.filter(function (x) { return x !== id; });
        delete this.votes[id];
        if (this.turnPos >= this.order.length * PASSES) this._toVote();
      }
    }
    this.publish();
  };

  HostGame.prototype.canStart = function () {
    return this.phase === "lobby" && this.players.length >= MIN_PLAYERS;
  };

  HostGame.prototype.startRound = function () {
    if (this.players.length < MIN_PLAYERS) return false;
    this.roundNo++;
    var topic = this.topics[Math.floor(Math.random() * this.topics.length)];
    var word = topic.words[Math.floor(Math.random() * topic.words.length)];
    this.topic = { cat: topic.cat, word: word };
    this.fakeId = this.players[Math.floor(Math.random() * this.players.length)].id;
    this.order = shuffled(this.players.map(function (p) { return p.id; }));
    this.turnPos = 0;
    this.strokes = [];
    this.votes = {};
    this.accusedId = null;
    this.guessOptions = [];
    this.fakeGuess = null;
    this.result = null;
    this.phase = "draw";

    // ส่งบทบาทให้แต่ละเครื่องแยกกัน — คนอื่นไม่มีทางเห็นของคนอื่น
    var self = this;
    this.players.forEach(function (p) {
      // ติดเลขรอบไปด้วย เครื่องลูกจะได้รู้ว่าบทบาทนี้เป็นของรอบไหน
      // (ข้อความ role กับ state วิ่งคนละทาง ลำดับมาถึงสลับกันได้)
      var payload = { round: self.roundNo, cat: self.topic.cat, isFake: p.id === self.fakeId };
      if (p.id !== self.fakeId) payload.word = self.topic.word;
      if (p.id === "host") self.onPrivate("role", payload);
      else self.room.to(p.id, "role", payload);
    });
    this.publish();
    return true;
  };

  HostGame.prototype.currentDrawerId = function () {
    if (this.phase !== "draw" || !this.order.length) return null;
    return this.order[this.turnPos % this.order.length];
  };

  HostGame.prototype.totalTurns = function () { return this.order.length * PASSES; };

  HostGame.prototype.submitStroke = function (fromId, pts) {
    if (this.phase !== "draw") return false;
    if (fromId !== this.currentDrawerId()) return false;      // ไม่ใช่ตาของคุณ
    if (!Array.isArray(pts)) return false;
    // ตัดจุดที่ผิดรูปแบบทิ้ง กันข้อมูลเพี้ยนจากเครื่องอื่น
    var clean = pts
      .filter(function (pt) { return pt && isFinite(pt.x) && isFinite(pt.y); })
      .map(function (pt) {
        return { x: Math.min(1, Math.max(0, +pt.x)), y: Math.min(1, Math.max(0, +pt.y)) };
      });
    this.strokes.push({ id: fromId, pts: clean });
    this.turnPos++;
    if (this.turnPos >= this.totalTurns()) this._toVote();
    this.publish();
    return true;
  };

  HostGame.prototype._toVote = function () {
    this.phase = "vote";
    this.votes = {};
  };

  HostGame.prototype.submitVote = function (fromId, targetId) {
    if (this.phase !== "vote") return false;
    if (!this.players.some(function (p) { return p.id === fromId; })) return false;
    if (!this.players.some(function (p) { return p.id === targetId; })) return false;
    if (fromId === targetId) return false;                    // โหวตตัวเองไม่ได้
    this.votes[fromId] = targetId;
    if (Object.keys(this.votes).length >= this.players.length) this._resolveVotes();
    this.publish();
    return true;
  };

  HostGame.prototype.voteCounts = function () {
    var counts = {};
    var self = this;
    Object.keys(this.votes).forEach(function (voter) {
      var t = self.votes[voter];
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  };

  HostGame.prototype._resolveVotes = function () {
    var counts = this.voteCounts();
    var best = -1;
    var leaders = [];
    Object.keys(counts).forEach(function (id) {
      if (counts[id] > best) { best = counts[id]; leaders = [id]; }
      else if (counts[id] === best) leaders.push(id);
    });
    // เสียงเท่ากัน = วงตกลงกันไม่ได้ ตัวปลอมรอดไป
    if (leaders.length !== 1) {
      this.accusedId = null;
      this._finish("fake", "tie");
      return;
    }
    this.accusedId = leaders[0];
    if (this.accusedId === this.fakeId) this._toGuess();
    else this._finish("fake", "wrong");
  };

  HostGame.prototype._toGuess = function () {
    var self = this;
    var topic = this.topics.filter(function (t) { return t.cat === self.topic.cat; })[0];
    var pool = topic ? topic.words.filter(function (w) { return w !== self.topic.word; }) : [];
    var decoys = shuffled(pool).slice(0, GUESS_OPTIONS - 1);
    this.guessOptions = shuffled([this.topic.word].concat(decoys));
    this.phase = "guess";
    if (this.fakeId === "host") this.onPrivate("guessOptions", { options: this.guessOptions });
    else this.room.to(this.fakeId, "guessOptions", { options: this.guessOptions });
  };

  HostGame.prototype.submitGuess = function (fromId, word) {
    if (this.phase !== "guess") return false;
    if (fromId !== this.fakeId) return false;                 // มีแต่ตัวปลอมที่ทายได้
    if (this.guessOptions.indexOf(word) < 0) return false;
    this.fakeGuess = word;
    if (word === this.topic.word) this._finish("fake", "guessed");
    else this._finish("artists", "caught");
    this.publish();
    return true;
  };

  HostGame.prototype._finish = function (winner, how) {
    var self = this;
    if (winner === "fake") {
      this.players.forEach(function (p) { if (p.id === self.fakeId) p.score += 2; });
    } else {
      this.players.forEach(function (p) { if (p.id !== self.fakeId) p.score += 1; });
    }
    var fake = this.players.filter(function (p) { return p.id === self.fakeId; })[0];
    this.result = {
      winner: winner,
      how: how,
      word: this.topic.word,
      cat: this.topic.cat,
      fakeName: fake ? fake.name : "?",
      fakeColor: fake ? fake.color : "#fff",
      accusedName: this.accusedId
        ? (this.players.filter(function (p) { return p.id === self.accusedId; })[0] || {}).name
        : null,
      fakeGuess: this.fakeGuess,
    };
    this.gallery.push({
      round: this.roundNo,
      word: this.topic.word,
      strokes: this.strokes.slice(),
      fakeName: this.result.fakeName,
      fakeColor: this.result.fakeColor,
      winner: winner,
    });
    this.phase = this.players.some(function (p) { return p.score >= self.goal; }) ? "final" : "result";
  };

  HostGame.prototype.nextRound = function () {
    if (this.phase === "result") this.startRound();
  };

  HostGame.prototype.restart = function () {
    this.players.forEach(function (p) { p.score = 0; });
    this.roundNo = 0;
    this.gallery = [];
    this.phase = "lobby";
    this.publish();
  };

  // สถานะที่ปลอดภัยพอจะกระจายให้ทุกเครื่อง — ห้ามมีคำลับหรือ id ตัวปลอมเด็ดขาด
  // จนกว่าจะจบรอบ ไม่งั้นเปิด DevTools ก็โกงได้
  HostGame.prototype.publicState = function () {
    var self = this;
    return {
      phase: this.phase,
      roundNo: this.roundNo,
      goal: this.goal,
      cat: this.topic ? this.topic.cat : null,
      players: this.players.map(function (p) {
        return { id: p.id, name: p.name, color: p.color, score: p.score };
      }),
      strokes: this.strokes.map(function (s) { return { id: s.id, pts: s.pts }; }),
      turnPos: this.turnPos,
      totalTurns: this.totalTurns(),
      drawerId: this.currentDrawerId(),
      voted: Object.keys(this.votes),
      voteCounts: this.phase === "vote" ? null : this.voteCounts(),
      result: this.result,
      gallery: this.phase === "final" ? this.gallery : null,
    };
  };

  HostGame.prototype.publish = function () {
    var state = this.publicState();
    this.room.broadcast("state", state);
    this.onState(state);
  };

  global.PGFakeArtistHost = HostGame;
  global.PGFakeArtistConst = { MIN_PLAYERS: MIN_PLAYERS, MAX_PLAYERS: MAX_PLAYERS, PASSES: PASSES, COLORS: COLORS };
})(window);
