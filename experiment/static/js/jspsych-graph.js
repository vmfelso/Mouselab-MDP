// Generated by CoffeeScript 1.12.3

/*
jspsych-plane.coffee
Fred Callaway

An MDP mdp in which the participant plans flights to
maximize profit.
 */
var mdp,
  slice = [].slice,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

mdp = void 0;

jsPsych.plugins['graph'] = (function() {
  var Arrow, Edge, GraphMDP, KEYS, KEY_DESCRIPTION, LOG_DEBUG, LOG_INFO, NULL, PRINT, SIZE, State, TRIAL_INDEX, Text, angle, checkObj, dist, plugin, polarMove, redGreen, round;
  PRINT = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return console.log.apply(console, args);
  };
  NULL = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return null;
  };
  LOG_INFO = PRINT;
  LOG_DEBUG = PRINT;
  SIZE = void 0;
  TRIAL_INDEX = 1;
  fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
  fabric.Object.prototype.selectable = false;
  fabric.Object.prototype.hoverCursor = 'plain';
  angle = function(x1, y1, x2, y2) {
    var ang, x, y;
    x = x2 - x1;
    y = y2 - y1;
    if (x === 0) {
      ang = y === 0 ? 0 : y > 0 ? Math.PI / 2 : Math.PI * 3 / 2;
    } else if (y === 0) {
      ang = x > 0 ? 0 : Math.PI;
    } else {
      ang = x < 0 ? Math.atan(y / x) + Math.PI : y < 0 ? Math.atan(y / x) + 2 * Math.PI : Math.atan(y / x);
    }
    return ang + Math.PI / 2;
  };
  polarMove = function(x, y, ang, dist) {
    x += dist * Math.sin(ang);
    y -= dist * Math.cos(ang);
    return [x, y];
  };
  dist = function(o1, o2) {
    return Math.pow(Math.pow(o1.left - o2.left, 2) + Math.pow(o1.top - o2.top, 2), 0.5);
  };
  redGreen = function(val) {
    if (val > 0) {
      return '#080';
    } else if (val < 0) {
      return '#b00';
    } else {
      return '#888';
    }
  };
  round = function(x) {
    return (Math.round(x * 100)) / 100;
  };
  checkObj = function(obj, keys) {
    var i, k, len;
    if (keys == null) {
      keys = Object.keys(obj);
    }
    for (i = 0, len = keys.length; i < len; i++) {
      k = keys[i];
      if (obj[k] === void 0) {
        console.log('Bad Object: ', obj);
        throw new Error(k + " is undefined");
      }
    }
    return obj;
  };
  KEYS = _.mapObject({
    up: 'uparrow',
    down: 'downarrow',
    right: 'rightarrow',
    left: 'leftarrow'
  }, jsPsych.pluginAPI.convertKeyCharacterToKeyCode);
  KEY_DESCRIPTION = "Navigate with the arrow keys.";
  GraphMDP = (function() {
    function GraphMDP(config) {
      this.checkFinished = bind(this.checkFinished, this);
      this.endTrial = bind(this.endTrial, this);
      this.buildMap = bind(this.buildMap, this);
      this.initPlayer = bind(this.initPlayer, this);
      this.draw = bind(this.draw, this);
      this.run = bind(this.run, this);
      this.addScore = bind(this.addScore, this);
      this.arrive = bind(this.arrive, this);
      this.handleClick = bind(this.handleClick, this);
      this.handleKey = bind(this.handleKey, this);
      var centerMessage, leftMessage, lowerMessage, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, rightMessage;
      this.display = config.display, this.graph = config.graph, this.layout = config.layout, this.initial = config.initial, this.click = (ref = config.click) != null ? ref : null, this.keys = (ref1 = config.keys) != null ? ref1 : KEYS, this.trialIndex = (ref2 = config.trialIndex) != null ? ref2 : TRIAL_INDEX, this.playerImage = (ref3 = config.playerImage) != null ? ref3 : '/static/images/plane.png', this.showRewards = (ref4 = config.showRewards) != null ? ref4 : true, this.showStateNames = (ref5 = config.showStateNames) != null ? ref5 : false, SIZE = (ref6 = config.SIZE) != null ? ref6 : 120, leftMessage = (ref7 = config.leftMessage) != null ? ref7 : 'Round: 1/1', centerMessage = (ref8 = config.centerMessage) != null ? ref8 : '&nbsp;', rightMessage = (ref9 = config.rightMessage) != null ? ref9 : 'Score: <span id=graph-score/>', lowerMessage = (ref10 = config.lowerMessage) != null ? ref10 : KEY_DESCRIPTION;
      checkObj(this);
      this.invKeys = _.invert(this.keys);
      this.data = {
        trialIndex: this.trialIndex,
        score: 0,
        path: [],
        rt: [],
        actions: [],
        actionTimes: [],
        clicks: [],
        clickTimes: []
      };
      this.leftMessage = $('<div>', {
        id: 'graph-msg-left',
        "class": 'graph-header',
        html: leftMessage
      }).appendTo(this.display);
      this.centerMessage = $('<div>', {
        id: 'graph-msg-center',
        "class": 'graph-header',
        html: centerMessage
      }).appendTo(this.display);
      this.rightMessage = $('<div>', {
        id: 'graph-msg-right',
        "class": 'graph-header',
        html: rightMessage
      }).appendTo(this.display);
      this.addScore(0);
      this.canvasElement = $('<canvas>', {
        id: 'graph-canvas'
      }).attr({
        width: 500,
        height: 500
      }).appendTo(this.display);
      this.lowerMessage = $('<div>', {
        id: 'graph-msg-bottom',
        html: lowerMessage || '&nbsp'
      }).appendTo(this.display);
      mdp = this;
      LOG_INFO('new GraphMDP', this);
    }

    GraphMDP.prototype.handleKey = function(s0, a) {
      var r, ref, s1, s1g;
      LOG_DEBUG('handleKey', s0, a);
      this.data.actions.push(a);
      this.data.actionTimes.push(Date.now() - this.initTime);
      ref = this.graph[s0][a], r = ref[0], s1 = ref[1];
      LOG_DEBUG(s0 + ", " + a + " -> " + r + ", " + s1);
      this.addScore(r);
      s1g = this.states[s1];
      return this.player.animate({
        left: s1g.left,
        top: s1g.top
      }, {
        duration: dist(this.player, s0) * 4,
        onChange: this.canvas.renderAll.bind(this.canvas),
        onComplete: (function(_this) {
          return function() {
            return _this.arrive(s1);
          };
        })(this)
      });
    };

    GraphMDP.prototype.handleClick = function(s) {
      if (this.click != null) {
        return this.click(s);
      }
    };

    GraphMDP.prototype.arrive = function(s) {
      var a, keys;
      LOG_DEBUG('arrive', s);
      this.data.path.push(s);
      if (this.graph[s]) {
        keys = (function() {
          var i, len, ref, results;
          ref = Object.keys(this.graph[s]);
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            a = ref[i];
            results.push(this.keys[a]);
          }
          return results;
        }).call(this);
      } else {
        keys = [];
      }
      if (!keys.length) {
        this.complete = true;
        this.checkFinished();
        return;
      }
      return this.keyListener = jsPsych.pluginAPI.getKeyboardResponse({
        valid_responses: keys,
        rt_method: 'date',
        persist: false,
        allow_held_key: false,
        callback_function: (function(_this) {
          return function(info) {
            var action;
            action = _this.invKeys[info.key];
            LOG_DEBUG('key', info.key);
            _this.data.rt.push(info.rt);
            return _this.handleKey(s, action);
          };
        })(this)
      });
    };

    GraphMDP.prototype.addScore = function(v) {
      this.data.score = round(this.data.score + v);
      $('#graph-score').html('$' + this.data.score);
      return $('#graph-score').css('color', redGreen(this.data.score));
    };

    GraphMDP.prototype.run = function() {
      LOG_DEBUG('run');
      this.buildMap();
      return fabric.Image.fromURL(this.playerImage, ((function(_this) {
        return function(img) {
          _this.initPlayer(img);
          _this.canvas.renderAll();
          _this.initTime = Date.now();
          return _this.arrive(_this.initial);
        };
      })(this)));
    };

    GraphMDP.prototype.draw = function(obj) {
      this.canvas.add(obj);
      return obj;
    };

    GraphMDP.prototype.initPlayer = function(img) {
      var left, top;
      LOG_DEBUG('initPlayer');
      top = this.states[this.initial].top;
      left = this.states[this.initial].left;
      img.scale(0.3);
      img.set('top', top).set('left', left);
      this.draw(img);
      return this.player = img;
    };

    GraphMDP.prototype.buildMap = function() {
      var a, actions, height, location, name, ref, ref1, ref2, results, reward, s0, s1, width, x, y;
      ref = (function(_this) {
        return function() {
          var ref, xs, ys;
          ref = _.unzip(_.values(_this.layout)), xs = ref[0], ys = ref[1];
          return [(_.max(xs)) + 1, (_.max(ys)) + 1];
        };
      })(this)(), width = ref[0], height = ref[1];
      this.canvasElement.attr({
        width: width * SIZE,
        height: height * SIZE
      });
      this.canvas = new fabric.Canvas('graph-canvas', {
        selection: false
      });
      this.states = {};
      ref1 = this.layout;
      for (name in ref1) {
        location = ref1[name];
        x = location[0], y = location[1];
        this.states[name] = this.draw(new State(name, x, y, {
          fill: '#bbb',
          label: this.showStateNames ? name : ''
        }));
      }
      ref2 = this.graph;
      results = [];
      for (s0 in ref2) {
        actions = ref2[s0];
        results.push((function() {
          var ref3, results1;
          results1 = [];
          for (a in actions) {
            ref3 = actions[a], reward = ref3[0], s1 = ref3[1];
            results1.push(this.draw(new Edge(this.states[s0], this.states[s1], {
              reward: this.showRewards ? reward : ''
            })));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    GraphMDP.prototype.endTrial = function() {
      this.lowerMessage.html("<b>Press any key to continue.</br>");
      return this.keyListener = jsPsych.pluginAPI.getKeyboardResponse({
        valid_responses: [],
        rt_method: 'date',
        persist: false,
        allow_held_key: false,
        callback_function: (function(_this) {
          return function(info) {
            _this.display.empty();
            return jsPsych.finishTrial(_this.data);
          };
        })(this)
      });
    };

    GraphMDP.prototype.checkFinished = function() {
      if (this.complete) {
        return this.endTrial();
      }
    };

    return GraphMDP;

  })();
  State = (function(superClass) {
    extend(State, superClass);

    function State(name1, left, top, config) {
      var conf;
      this.name = name1;
      if (config == null) {
        config = {};
      }
      left = left * SIZE;
      top = top * SIZE;
      conf = {
        left: left,
        top: top,
        fill: '#bbbbbb',
        radius: SIZE / 4,
        label: ''
      };
      _.extend(conf, config);
      this.on('mousedown', function() {
        return mdp.handleClick(this.name);
      });
      this.circle = new fabric.Circle(conf);
      this.label = new Text(conf.label, left, top, {
        fontSize: SIZE / 6,
        fill: '#44d'
      });
      this.radius = this.circle.radius;
      this.left = this.circle.left;
      this.top = this.circle.top;
      State.__super__.constructor.call(this, [this.circle, this.label]);
    }

    State.prototype.setLabel = function(txt) {
      if (txt) {
        this.label.setText(txt);
        this.label.setFill(redGreen(txt));
      } else {
        this.label.setText('');
      }
      return this.dirty = true;
    };

    return State;

  })(fabric.Group);
  Edge = (function(superClass) {
    extend(Edge, superClass);

    function Edge(c1, c2, conf) {
      var adjX, adjY, ang, labX, labY, ref, ref1, ref2, ref3, ref4, ref5, reward, rotateLabel, spacing, txt, x1, x2, y1, y2;
      if (conf == null) {
        conf = {};
      }
      reward = conf.reward, spacing = (ref = conf.spacing) != null ? ref : 8, adjX = (ref1 = conf.adjX) != null ? ref1 : 0, adjY = (ref2 = conf.adjY) != null ? ref2 : 0, rotateLabel = (ref3 = conf.rotateLabel) != null ? ref3 : false;
      ref4 = [c1.left + adjX, c1.top + adjY, c2.left + adjX, c2.top + adjY], x1 = ref4[0], y1 = ref4[1], x2 = ref4[2], y2 = ref4[3];
      this.arrow = new Arrow(x1, y1, x2, y2, c1.radius + spacing, c2.radius + spacing);
      ang = (this.arrow.ang + Math.PI / 2) % (Math.PI * 2);
      if ((0.5 * Math.PI <= ang && ang <= 1.5 * Math.PI)) {
        ang += Math.PI;
      }
      ref5 = polarMove(x1, y1, angle(x1, y1, x2, y2), SIZE * 0.45), labX = ref5[0], labY = ref5[1];
      txt = "" + reward;
      this.label = new Text(txt, labX, labY, {
        angle: rotateLabel ? ang * 180 / Math.PI : 0,
        fill: redGreen(reward),
        fontSize: SIZE / 6,
        textBackgroundColor: 'white'
      });
      Edge.__super__.constructor.call(this, [this.arrow, this.label]);
    }

    return Edge;

  })(fabric.Group);
  Arrow = (function(superClass) {
    extend(Arrow, superClass);

    function Arrow(x1, y1, x2, y2, adj1, adj2) {
      var ang, deltaX, deltaY, dx, dy, line, point, ref, ref1;
      if (adj1 == null) {
        adj1 = 0;
      }
      if (adj2 == null) {
        adj2 = 0;
      }
      this.ang = ang = angle(x1, y1, x2, y2);
      ref = polarMove(x1, y1, ang, adj1), x1 = ref[0], y1 = ref[1];
      ref1 = polarMove(x2, y2, ang, -(adj2 + 7.5)), x2 = ref1[0], y2 = ref1[1];
      line = new fabric.Line([x1, y1, x2, y2], {
        stroke: '#555',
        selectable: false,
        strokeWidth: 3
      });
      this.centerX = (x1 + x2) / 2;
      this.centerY = (y1 + y2) / 2;
      deltaX = line.left - this.centerX;
      deltaY = line.top - this.centerY;
      dx = x2 - x1;
      dy = y2 - y1;
      point = new fabric.Triangle({
        left: x2 + deltaX,
        top: y2 + deltaY,
        pointType: 'arrow_start',
        angle: ang * 180 / Math.PI,
        width: 10,
        height: 10,
        fill: '#555'
      });
      Arrow.__super__.constructor.call(this, [line, point]);
    }

    return Arrow;

  })(fabric.Group);
  Text = (function(superClass) {
    extend(Text, superClass);

    function Text(txt, left, top, config) {
      var conf;
      txt = String(txt);
      conf = {
        left: left,
        top: top,
        fontFamily: 'helvetica',
        fontSize: SIZE / 8
      };
      _.extend(conf, config);
      Text.__super__.constructor.call(this, txt, conf);
    }

    return Text;

  })(fabric.Text);
  plugin = {
    trial: function(display_element, trialConfig) {
      var trial;
      trialConfig = jsPsych.pluginAPI.evaluateFunctionParameters(trialConfig);
      trialConfig.display = display_element;
      console.log('trialConfig', trialConfig);
      display_element.empty();
      trial = new GraphMDP(trialConfig);
      trial.run();
      if (trialConfig._block) {
        trialConfig._block.trialCount += 1;
      }
      return TRIAL_INDEX += 1;
    }
  };
  return plugin;
})();
